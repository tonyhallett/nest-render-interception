import { RenderInterceptorExecutionContextFactory } from '../src/renderInterceptorExecutionContext';

describe('RenderInterceptorExecutionContextFactory', () => {
  describe('creates context that uses the ExecutionContext', () => {
    const mockClass = {};
    const mockHandler = {};
    const mockRequest = {};
    const mockResponse = {};
    const executionContext = {
      getClass() {
        return mockClass;
      },
      getHandler() {
        return mockHandler;
      },
      switchToHttp() {
        return {
          getRequest() {
            return mockRequest;
          },
          getResponse() {
            return mockResponse;
          },
        };
      },
    };
    const renderExecutionContext = RenderInterceptorExecutionContextFactory(executionContext as any);
    it('should getClass', () => {
      expect(renderExecutionContext.getClass()).toBe(mockClass);
    });
    it('should getHandler', () => {
      expect(renderExecutionContext.getHandler()).toBe(mockHandler);
    });
    it('should getRequest from http', () => {
      expect(renderExecutionContext.getRequest()).toBe(mockRequest);
    });
    it('should getResponce from http', () => {
      expect(renderExecutionContext.getResponse()).toBe(mockResponse);
    });
  });
});
