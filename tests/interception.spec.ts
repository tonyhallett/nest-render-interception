import { RenderInterceptorBase } from '../src/renderInterceptorBase';
import { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RenderInterception } from '../src/interception';

describe('intercept', () => {
  it('should return the toIntercept in a promise if no render interceptors', async () => {
    const renderInterception = new RenderInterception();
    const intercepted = await renderInterception.intercept('to intercept', undefined);
    expect(intercepted).toBe('to intercept');
  });
  describe('should return Promise for the last observed render intercepted value', () => {
    const rendered = '<div>Rendered</div>';
    interface RenderInterceptTest {
      renderInterceptors: RenderInterceptorBase[];
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
        const renderInterception = new RenderInterception();
        const result = await renderInterception.intercept(rendered, t.renderInterceptors);
        expect(result).toEqual(t.expectedResult);
      });
    });
  });
});
