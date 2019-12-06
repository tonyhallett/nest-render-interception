
import { RenderAdapter } from '../src/renderAdapter';
import { CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RenderInterceptorBase } from '../src/renderInterceptorBase';
import * as RenderInterceptorExecutionContext from '../src/renderInterceptorExecutionContext';
import { RENDER_METADATA } from '@nestjs/common/constants';

// tslint:disable-next-line: only-arrow-functions
const noop = function() {
  //
} as any;

jest.mock('../src/renderInterceptorExecutionContext');
const mockRegistered = jest.fn();
class MockRenderInterceptorBase extends RenderInterceptorBase {
  getExecutionContext() {
    return this.executionContext;
  }
  protected register(renderAdapter: RenderAdapter, response: any) {
    mockRegistered(renderAdapter, response);
  }
  renderIntercept(next: CallHandler<string>): Observable<string>|Promise<Observable<string>> {
    throw new Error('Method not implemented.');
  }
}
describe('RenderInterceptorBase intercept', () => {
  let renderInterceptorBase: MockRenderInterceptorBase;
  let reflectorGetReturn: any| undefined;
  const reflectorGet = jest.fn().mockImplementation(() => reflectorGetReturn);
  const httpAdapter = {};
  let mockRenderExecutionContext: any;
  let spiedExecutionContextFactory: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    spiedExecutionContextFactory = jest.spyOn(RenderInterceptorExecutionContext, 'RenderInterceptorExecutionContextFactory')
      .mockImplementation(() => mockRenderExecutionContext);
    renderInterceptorBase = new MockRenderInterceptorBase();
    const renderInterceptorAny = renderInterceptorBase as any;
    renderInterceptorAny.reflector = {
      get: reflectorGet,
    };
    renderInterceptorAny.httpAdapterHost = {
      httpAdapter,
    };
  });

  it('should set the executionContext using the factory', async () => {
    mockRenderExecutionContext = {getHandler: noop} as any;
    const executionContext = {};
    await renderInterceptorBase.intercept(executionContext as any, {handle: noop});
    expect(renderInterceptorBase.getExecutionContext()).toBe(mockRenderExecutionContext);
    expect(spiedExecutionContextFactory.mock.calls[0][0]).toBe(executionContext);
  });
  describe('registering', () => {
    interface RegistrationTest {
      description: string;
      renderDecoratorApplied: boolean;
      expectRegistration: boolean;
    }
    const registrationTests: RegistrationTest[] = [
      {
        description: 'should register with the RenderAdapter and the response if render decorator applied to the handler',
        expectRegistration: true,
        renderDecoratorApplied: true,
      },
      {
        description: 'should not register if render decorator is not applied to the handler',
        expectRegistration: false,
        renderDecoratorApplied: false,
      },
    ];
    registrationTests.forEach((test) => {
      it(test.description, async () => {
        const response = {};
        const handler = {};
        mockRenderExecutionContext = {
          getResponse() {
            return response;
          },
          getHandler() {
            return handler;
          },
        };
        reflectorGetReturn = test.renderDecoratorApplied ? {} : undefined;

        await renderInterceptorBase.intercept(undefined, {handle: noop});
        (function expectChecksForRenderDecorator() {
          const reflectorGetArgs = reflectorGet.mock.calls[0];
          expect(reflectorGetArgs[0]).toBe(RENDER_METADATA);
          expect(reflectorGetArgs[1]).toBe(handler);
        })();

        if (test.expectRegistration) {
          const registerArguments = mockRegistered.mock.calls[0];
          expect(registerArguments[0]).toBe(httpAdapter);
          expect(registerArguments[1]).toBe(response);
        } else {
          expect(mockRegistered).not.toHaveBeenCalled();
        }
      });
    });
  });
  it('should next.handle()', async () => {
    const nextHandle = jest.fn();
    mockRenderExecutionContext = {getHandler: noop} as any;
    const executionContext = {};
    await renderInterceptorBase.intercept(executionContext as any, {handle: nextHandle});
    expect(nextHandle).toHaveBeenCalled();
  });
});
