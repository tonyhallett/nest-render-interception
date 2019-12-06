import { ExecutionContext } from '@nestjs/common';

import { HttpArgumentsHost } from '@nestjs/common/interfaces';

export interface IRenderInterceptorExecutionContext {
  getClass<T = any>(): ReturnType<ExecutionContext['getClass']>;
  getHandler(): ReturnType<ExecutionContext['getHandler']>;
  getRequest<T = any>(): ReturnType<HttpArgumentsHost['getRequest']>;
  getResponse<T = any>(): ReturnType<HttpArgumentsHost['getResponse']>;
}

class RenderInterceptorExecutionContext
  implements IRenderInterceptorExecutionContext {
  private readonly httpArgumentsHost: HttpArgumentsHost;
  constructor(private readonly executionContext: ExecutionContext) {
    this.httpArgumentsHost = executionContext.switchToHttp();
  }
  getClass<T = any>() {
    return this.executionContext.getClass();
  }
  getHandler() {
    return this.executionContext.getHandler();
  }
  getRequest<T = any>() {
    return this.httpArgumentsHost.getRequest<T>();
  }
  getResponse<T = any>() {
    return this.httpArgumentsHost.getResponse<T>();
  }
}
export type IRenderInterceptorExecutionContextFactory = (
  executionContext: ExecutionContext,
) => IRenderInterceptorExecutionContext;
export const RenderInterceptorExecutionContextFactory: IRenderInterceptorExecutionContextFactory =
  // tslint:disable-next-line: only-arrow-functions
  function(executionContext) {
    return new RenderInterceptorExecutionContext(executionContext);
  };
