import { RenderAdapter } from '../src/renderAdapter';
import { SkipRenderNotStringError } from '../src/SkipRenderNotStringError';
import { CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import * as ts from 'typescript';
import { tsPassThroughHelper } from './passthroughHelper';
import { RenderInterceptor } from '../src/renderInterceptor';
import * as path from 'path';
import { jestPassThroughTestHelper} from 'ts-passthrough-test-helper';

function noop() {
  //
}

describe('RenderAdapter', () => {
  describe('should pass through all methods other than render from AbstractHttpAdapter', () => {
    const adapterPath = path.join(__dirname, '..\\node_modules\\@nestjs\\core\\adapters\\http-adapter.d.ts');
    const isValidMethod = (methodName => {
      return methodName !== 'render';
    });
    jestPassThroughTestHelper({filePath: adapterPath, isValidMethod}, mock => new RenderAdapter(mock, undefined));
  });
  describe('setBaseViewsDir', () => {
    ['path', ['path1', 'path2']].forEach(p => {
      it('should pass through if implemented on the adapter', () => {
        const adapter = {setBaseViewsDir: jest.fn()};
        const renderAdapter = new RenderAdapter(adapter as any, undefined);
        renderAdapter.setBaseViewsDir(p);
        expect(adapter.setBaseViewsDir).toHaveBeenCalledWith(p);
      });
    });
    it('should not throw if not present on the adapter', () => {
        const renderAdapter = new RenderAdapter({} as any, undefined);
        expect(() => renderAdapter.setBaseViewsDir('somePath')).not.toThrow();
    });
  });
  describe('render', () => {
    function getServerMethodResolved(timeout = 200) {
      let didResolve = false;
      const serverRenderPromise = new Promise(resolve => {
        setTimeout(() => {
          resolve();
          didResolve = true;
        }, timeout);
      });
      const method = jest.fn().mockReturnValue(serverRenderPromise);
      return {
        method,
        resolved() {
          return didResolve;
        },
      };
    }
    describe('skip render', () => {
      it('should throw error if result is not a string', () => {
        const renderAdapter = new RenderAdapter(null, null);
        const response = {skipRender: true};
        return expect(renderAdapter.render(response, '', {})).rejects.toBeInstanceOf(SkipRenderNotStringError);
      });

      it('should set content type html using the wrapped server', async () => {
        const setHeader = jest.fn();
        const renderAdapter = new RenderAdapter({reply: noop, setHeader} as any, null);
        const response = {skipRender: true};
        await renderAdapter.render(response, '', '<div></div>');
        expect(setHeader).toBeCalledWith(response, 'Content-Type', 'text/html; charset=utf-8');
      });

      describe('no render interception', () => {
        it('should server reply if no render interceptors', async () => {
          const serverReplyResolved = getServerMethodResolved();
          const server = {reply: serverReplyResolved.method, setHeader: noop};
          const renderAdapter = new RenderAdapter(server as any, () => 'rendered');
          const response = {skipRender: true};
          await renderAdapter.render(response, '', '<div></div>');
          expect(serverReplyResolved.resolved()).toBe(true);
          expect(server.reply).toHaveBeenCalledWith(response, '<div></div>');
        });
        it('should server reply if no renderToString', async () => {
          const serverReplyResolved = getServerMethodResolved();
          const server = {reply: serverReplyResolved.method, setHeader: noop};
          const renderAdapter = new RenderAdapter(server as any);
          const response = {skipRender: true, renderInterceptors: [{}]};
          await renderAdapter.render(response, '', '<div></div>');
          expect(serverReplyResolved.resolved()).toBe(true);
          expect(server.reply).toHaveBeenCalledWith(response, '<div></div>');
        });
      });

      describe('render interception', () => {
        it('should server reply with the render intercepted', async () => {
          const serverReplyResolved = getServerMethodResolved();
          const server = {reply: serverReplyResolved.method, setHeader: noop};
          const renderAdapter = new RenderAdapter(server as any, () => '');
          const response = {skipRender: true, renderInterceptors: [{}]};
          const renderIntercepted = '<div>Render intercepted</div>';
          const renderIntercept = jest.fn().mockReturnValue(Promise.resolve(renderIntercepted));
          renderAdapter.renderIntercept = renderIntercept;
          const skipRenderIntercepted = '<div></div>';
          await renderAdapter.render(response, '', skipRenderIntercepted);
          expect(renderIntercept).toHaveBeenCalledWith(skipRenderIntercepted, response.renderInterceptors);
          expect(serverReplyResolved.resolved()).toBe(true);
          expect(server.reply).toHaveBeenCalledWith(response, renderIntercepted);
        });
      });
    });

    describe('not skip render', () => {
      describe('no render interception', () => {
        describe('no renderToString', () => {
          it('should server render the view', async () => {
            const serverRenderResolved = getServerMethodResolved();
            const server = {render: serverRenderResolved.method};
            const renderAdapter = new RenderAdapter(server as any);
            const response = {renderInterceptors: [{}]};
            const result = {the: 'result'};
            await renderAdapter.render(response, 'someView', result);
            expect(serverRenderResolved.resolved()).toBe(true);
            expect(server.render).toHaveBeenCalledWith(response, 'someView', result);
          });
        });
        describe('no render interceptors', () => {
          it('should server render the view', async () => {
            const serverRenderResolved = getServerMethodResolved();
            const server = {render: serverRenderResolved.method};
            const renderAdapter = new RenderAdapter(server as any, () => '');
            const response = {no: 'renderInterceptors'};
            const result = {the: 'result'};
            await renderAdapter.render(response, 'someView', result);
            expect(serverRenderResolved.resolved()).toBe(true);
            expect(server.render).toHaveBeenCalledWith(response, 'someView', result);
          });
        });
      });
      describe('render interception', () => {
        it('should reply with the render intercepted renderToString', async () => {
          const serverReplyResolved = getServerMethodResolved();
          const renderedToString = '<div></div>';
          const renderToString = jest.fn().mockReturnValue(Promise.resolve(renderedToString));
          const server = {reply: serverReplyResolved.method} as any;
          const renderAdapter = new RenderAdapter(server, renderToString);
          const response = { renderInterceptors: [{}]};

          const renderIntercepted = '<div>Render intercepted</div>';
          const renderIntercept = jest.fn().mockReturnValue(Promise.resolve(renderIntercepted));
          renderAdapter.renderIntercept = renderIntercept;

          const result = { some: 'result'};
          await renderAdapter.render(response, 'someView', result);

          expect(renderToString).toHaveBeenCalledWith(server, 'someView', result, response);

          expect(renderIntercept).toHaveBeenCalledWith(renderedToString, response.renderInterceptors);
          expect(serverReplyResolved.resolved()).toBe(true);
          expect(server.reply).toHaveBeenCalledWith(response, renderIntercepted);
        });
      });
    });

    describe('renderIntercept', () => {
      describe('should return Promise for the last observed render intercepted value', () => {
        const rendered = '<div>Rendered</div>';
        interface RenderInterceptTest {
          renderInterceptors: RenderInterceptor[];
          expectedResult: any;
          description: string;
        }
        const tests: RenderInterceptTest[] = [
          {
            description: 'should provide the rendered string to the chain of render interceptors',
            renderInterceptors: [
              {
                renderIntercept(callHandler: CallHandler<string>) {
                  return callHandler.handle();
                },
              } as any,
            ],
            expectedResult: rendered,
          },
          {
            description: 'renderIntercept returning Observable with multiple values',
            renderInterceptors: [
              {
                renderIntercept(callHandler: CallHandler<string>) {
                  return of('1', '2', '3');
                },
              } as any,
            ],
            expectedResult: '3',
          },
          {
            description: 'renderIntercept returning Promise<Observable> with multiple values',
            renderInterceptors: [
              {
                renderIntercept(callHandler: CallHandler<string>) {
                  return Promise.resolve(of('1', '2', '3'));
                },
              } as any,
            ],
            expectedResult: '3',
          },
          {
            description: 'multiple render interceptors',
            renderInterceptors: [
              {
                renderIntercept(callHandler: CallHandler<string>) {
                  return callHandler.handle().pipe(map(v => v + '2'));
                },
              } as any,
              {
                renderIntercept(callHandler: CallHandler<string>) {
                  return callHandler.handle().pipe(map(v => v + '1'));
                },
              } as any,
            ],
            expectedResult: rendered + '1' + '2',
          },
        ];
        tests.forEach(t => {
          it(t.description, async () => {
            const renderAdapter = new RenderAdapter(null, null);
            const result = await renderAdapter.renderIntercept(rendered, t.renderInterceptors);
            expect(result).toEqual(t.expectedResult);
          });
        });
      });
    });

  });
});
