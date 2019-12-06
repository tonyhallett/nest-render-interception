import { RenderAdapter, RenderResponse } from '../src/renderAdapter';
import { SkipRenderNotStringError } from '../src/SkipRenderNotStringError';
import * as path from 'path';
import { jestPassThroughTestHelper} from 'ts-passthrough-test-helper';
import { RenderInterception } from '../src/interception';

jest.mock('../src/interception');

function noop() {
  //
}

describe('RenderAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('pass through', () => {
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
    function getIntercept() {
      const interception = (RenderInterception as jest.Mock).mock.instances[0];
      return interception.intercept as jest.Mock;
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

      it('should not template intercept', async () => {
        const renderAdapter = new RenderAdapter({reply: noop, setHeader: noop} as any, null);
        const response = {skipRender: true};
        await renderAdapter.render(response, '', '');

        expect(getIntercept()).not.toHaveBeenCalled();
      });

      it('should server reply if no render interceptors', async () => {
        const serverReplyResolved = getServerMethodResolved();
        const server = {reply: serverReplyResolved.method, setHeader: noop};
        const renderAdapter = new RenderAdapter(server as any, () => 'rendered');
        const response = {skipRender: true};
        await renderAdapter.render(response, '', '<div></div>');
        expect(serverReplyResolved.resolved()).toBe(true);
        expect(server.reply).toHaveBeenCalledWith(response, '<div></div>');
      });

      describe('render interception', () => {
        it('should server reply with the render intercepted', async () => {
          const serverReplyResolved = getServerMethodResolved();
          const server = {reply: serverReplyResolved.method, setHeader: noop};
          const renderAdapter = new RenderAdapter(server as any);

          const renderIntercepted = '<div>Render intercepted</div>';
          const intercept = getIntercept().mockReturnValue(Promise.resolve(renderIntercepted));

          const response = {skipRender: true};
          const renderInterceptor = {intercept: noop} as any;
          renderAdapter.registerRenderInterception(renderInterceptor, response);

          const skipRenderIntercepted = '<div></div>';
          await renderAdapter.render(response, '', skipRenderIntercepted);

          expect(intercept).toHaveBeenCalledWith(skipRenderIntercepted, [renderInterceptor]);
          expect(serverReplyResolved.resolved()).toBe(true);
          expect(server.reply).toHaveBeenCalledWith(response, renderIntercepted);
        });
      });
    });

    describe('not skip render', () => {
      it('it should intercept the view with registered template interceptors', async () => {
        const serverRenderResolved = getServerMethodResolved();
        const server = {render: serverRenderResolved.method};
        const renderAdapter = new RenderAdapter(server as any);

        const response = {};
        const templateInterceptor = { intercept: noop};
        renderAdapter.registerTemplateInterception(templateInterceptor as any, response);

        const intercept = getIntercept();

        await renderAdapter.render(response, 'someView', {});
        expect(intercept).toHaveBeenCalledWith('someView', [templateInterceptor]);
      });

      describe('no render interception', () => {
        [true, false].forEach(noRenderToString => {
          describe(noRenderToString ? 'no render to string' : ' no render interceptors', () => {
            it('should server render the intercepted view', async () => {
              const serverRenderResolved = getServerMethodResolved();
              const server = {render: serverRenderResolved.method};
              const renderAdapter = new RenderAdapter(server as any, noRenderToString ? undefined : () => '');

              const response = {the: 'response'};
              if (noRenderToString) {
                renderAdapter.registerRenderInterception({} as any, response);
              }

              const interceptedView = 'intercepted/someView';
              getIntercept().mockReturnValue(Promise.resolve(interceptedView));

              const result = {the: 'result'};
              await renderAdapter.render(response, 'someView', result);

              expect(serverRenderResolved.resolved()).toBe(true);
              expect(server.render).toHaveBeenCalledWith(response, interceptedView, result);
            });
          });
        });
      });

      describe('render interception', () => {
        it('should reply with the render intercepted renderToString', async () => {
          const serverReplyResolved = getServerMethodResolved();
          const server = {reply: serverReplyResolved.method} as any;

          const renderedToString = '<div></div>';
          const renderToString = jest.fn().mockReturnValue(Promise.resolve(renderedToString));

          const renderAdapter = new RenderAdapter(server, renderToString);
          const interceptedView = 'intercepted/someView';
          const intercept = getIntercept();
          intercept.mockReturnValueOnce(Promise.resolve(interceptedView));
          const renderIntercepted = '<div>Render intercepted</div>';
          intercept.mockReturnValueOnce(Promise.resolve(renderIntercepted));

          const response = { };

          const renderInterceptor = {intercept: noop} as any;
          renderAdapter.registerRenderInterception(renderInterceptor, response);

          const result = { some: 'result'};
          await renderAdapter.render(response, 'someView', result);

          expect(renderToString).toHaveBeenCalledWith(server, interceptedView, result, response);

          expect(intercept).toHaveBeenNthCalledWith(2, renderedToString, [renderInterceptor]);
          expect(serverReplyResolved.resolved()).toBe(true);
          expect(server.reply).toHaveBeenCalledWith(response, renderIntercepted);
        });
      });
    });

  });

  describe('registration', () => {
    interface RegistrationTest {
      description: string;
      templateInterceptors: boolean;
      interceptors: any[];
    }
    const registrationTests: RegistrationTest[] = [
      {
        description: 'single render interceptor',
        interceptors: [{intercept: noop}],
        templateInterceptors: false,
      },
      {
        description: 'multiple render interceptor',
        interceptors: [{intercept: noop}, {intercept2: noop}],
        templateInterceptors: false,
      },
      {
        description: 'single template interceptor',
        interceptors: [{intercept: noop}],
        templateInterceptors: true,
      },
      {
        description: 'multiple template interceptor',
        interceptors: [{intercept: noop}, {intercept2: noop}],
        templateInterceptors: true,
      },
    ];
    registrationTests.forEach(test => {
      it(test.description, () => {
        const response: RenderResponse = {};
        const renderAdapter = new RenderAdapter(null);
        test.interceptors.forEach(interceptor => {
          if (test.templateInterceptors) {
            renderAdapter.registerTemplateInterception(interceptor, response);
          } else {
            renderAdapter.registerRenderInterception(interceptor, response);
          }
        });
        if (test.templateInterceptors) {
          expect(response.templateInterceptors).toEqual(test.interceptors);
        } else {
          expect(response.renderInterceptors).toEqual(test.interceptors);
        }
      });
    });
  });
});
