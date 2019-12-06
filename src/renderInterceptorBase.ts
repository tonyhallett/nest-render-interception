import {
  Inject,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { RenderAdapter } from './renderAdapter';
import { Observable } from 'rxjs';
import { RENDER_METADATA } from '@nestjs/common/constants';
import {
  IRenderInterceptorExecutionContextFactory,
  IRenderInterceptorExecutionContext,
  RenderInterceptorExecutionContextFactory,
} from './renderInterceptorExecutionContext';
import { IRenderRegistration } from './renderRegistrationInterface';

export abstract class RenderInterceptorBase implements NestInterceptor {
  protected executionContext: IRenderInterceptorExecutionContext;
  private renderInterceptorExecutionContextFactory: IRenderInterceptorExecutionContextFactory;
  constructor() {
    this.renderInterceptorExecutionContextFactory = RenderInterceptorExecutionContextFactory;
  }
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    this.executionContext = this.renderInterceptorExecutionContextFactory(
      context,
    );
    if (this.shouldRegister()) {
      this.register(this.renderAdapter, this.executionContext.getResponse());
    }

    return next.handle();
  }

  private shouldRegister() {
    return !!this.reflector.get(
      RENDER_METADATA,
      this.executionContext.getHandler(),
    );
  }
  @Inject(HttpAdapterHost)
  private httpAdapterHost: HttpAdapterHost;

  @Inject(Reflector)
  private reflector: Reflector;

  private get renderAdapter() {
    return this.httpAdapterHost.httpAdapter as RenderAdapter;
  }
  protected abstract register(
    renderAdapter: IRenderRegistration,
    response: any,
  );

  abstract renderIntercept(
    next: CallHandler<string>,
  ): Observable<string> | Promise<Observable<string>>;
}
