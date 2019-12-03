import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IRenderInterceptorExecutionContext, IRenderInterceptorExecutionContextFactory, RenderInterceptorExecutionContextFactory } from './renderInterceptorExecutionContext';

export abstract class RenderInterceptorInternal implements NestInterceptor {
  constructor(private readonly routerExecutionContextFactory:
    IRenderInterceptorExecutionContextFactory) {}

  protected executionContext: IRenderInterceptorExecutionContext;
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    this.executionContext = this.routerExecutionContextFactory(context);
    const response = this.executionContext.getResponse();
    this.addRenderInterceptor(response);
    return next.handle();
  }
  private addRenderInterceptor(response: any) {
    if (response.renderInterceptors === undefined) {
      response.renderInterceptors = [];
    }
    response.renderInterceptors.push(this);
  }
  abstract renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>>;
}
