import { RenderInterceptorInternal } from '../src/renderInterceptorInternal';
import { CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

describe('RenderInterceptor', () => {
  const context = {switchToHttp() { return null; }} as any;
  let mockResponse: any = {};
  const mockContext = {
    getResponse() {
      return mockResponse;
    },
  };
  let mockExecutionContextFactory: jest.Mock;
  let renderInterceptor: TestRenderInterceptor;
  class TestRenderInterceptor extends RenderInterceptorInternal {
    constructor(factory: any) {
      super(factory);
    }
    renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
      throw new Error('Method not implemented.');
    }
    getExecutionContext() {
      return this.executionContext;
    }
  }
  beforeEach(() => {
    mockResponse = {};
    mockExecutionContextFactory = jest.fn().mockReturnValue(mockContext);
    renderInterceptor = new TestRenderInterceptor(mockExecutionContextFactory);
  });
  it('should create execution context from the factory', () => {
    renderInterceptor.intercept(context, {handle: () => null});
    expect(mockExecutionContextFactory.mock.calls[0][0] === context).toBe(true);
  });
  it('should add itself to the response.renderInterceptors', async () => {
    await renderInterceptor.intercept(context, {handle: () => null});
    expect(mockResponse.renderInterceptors).toBeInstanceOf(Array);
    expect(mockResponse.renderInterceptors.length).toBe(1);
    expect(mockResponse.renderInterceptors[0]).toBe(renderInterceptor);
  });
  it('should add itself to the response.renderInterceptors - exists', async () => {
    mockResponse.renderInterceptors = [{}];

    await renderInterceptor.intercept(context, {handle: () => null});
    expect(mockResponse.renderInterceptors.length).toBe(2);
    expect(mockResponse.renderInterceptors[1]).toBe(renderInterceptor);
  });
  it('should next.handle()', async () => {
    const handle = jest.fn();
    await renderInterceptor.intercept(context, {handle});
    expect(handle).toBeCalled();
  });
});
