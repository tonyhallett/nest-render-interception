import { RequestMethod, NestApplicationOptions, CallHandler, HttpServer } from '@nestjs/common';

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import { defer, from as fromPromise, of } from 'rxjs';

import { mergeAll } from 'rxjs/operators';
import { SkipRenderNotStringError } from './SkipRenderNotStringError';
import { AbstractHttpAdapter } from '@nestjs/core';
import { RenderInterceptor } from './renderInterceptor';

export class RenderAdapter<T extends AbstractHttpAdapter = AbstractHttpAdapter> extends AbstractHttpAdapter {
  constructor(
    public readonly adapter: T,
    private readonly renderToString?: (server: T, view: string, options: any, response: any) => string | Promise<string>) {
      /*
        ctor arg sets protected instance property
        that is then used by use/get/post/head/delete/put/patch/options/listen/getInstance

        as override each of these and call the underlying no need to provide the argument

        the adapter can  be retrieved with the adapter property or getInstance can be used
      */
      super(undefined);
    }

  //#region pass throughs
  createMiddlewareFactory(method: RequestMethod) {
    return this.adapter.createMiddlewareFactory(method);
  }
  get(path: any, handler?: any) {
    return this.adapter.get(path, handler);
  }
  use(...args: any[]): any {
    return this.adapter.use.call(this.adapter, ...args);
  }
  post(path: any, handler?: any) {
    return this.adapter.post(path, handler);
  }
  head(path: any, handler?: any) {
    return this.adapter.head(path, handler);
  }
  delete(path: any, handler?: any) {
    return this.adapter.delete(path, handler);
  }
  put(path: any, handler?: any) {
    return this.adapter.put(path, handler);
  }
  patch(path: any, handler?: any) {
    return this.adapter.patch(path, handler);
  }
  options(path: any, handler?: any) {
    return this.adapter.options(path, handler);
  }
  listen(port: any, hostname?: any, callback?: any) {
    return this.adapter.listen(port, hostname, callback);
  }
  reply(response: any, body: any, statusCode?: number) {
    return this.adapter.reply(response, body, statusCode);
  }
  status(response: any, statusCode: number) {
    return this.adapter.status(response, statusCode);
  }
  redirect(response: any, statusCode: number, url: string) {
    return this.adapter.redirect(response, statusCode, url);
  }
  setHeader(response: any, name: string, value: string) {
    return this.adapter.setHeader(response, name, value);
  }

  getInstance<TInstance = any>() {
    return this.adapter.getInstance() as TInstance;
  }
  registerParserMiddleware() {
    return this.adapter.registerParserMiddleware();
  }
  enableCors(options: CorsOptions) {
    return this.adapter.enableCors(options);
  }
  getHttpServer() {
    return this.adapter.getHttpServer();
  }
  setHttpServer(httpServer: any) {
    return this.adapter.setHttpServer(httpServer);
  }
  initHttpServer(options: NestApplicationOptions) {
    return this.adapter.initHttpServer(options);
  }
  close() {
    return this.adapter.close();
  }
  getType(): string {
    return this.adapter.getType();
  }
  useStaticAssets(...args: any[]) {
    return this.adapter.useStaticAssets(...args);
  }
  setViewEngine(engine: string) {
    return this.adapter.setViewEngine(engine);
  }
  getRequestMethod(request: any) {
    return this.adapter.getRequestMethod(request);
  }
  getRequestUrl(request: any) {
    return this.adapter.getRequestUrl(request);
  }
  setErrorHandler(handler: () => any) {
    return this.adapter.setErrorHandler(handler);
  }
  setNotFoundHandler(handler: () => any) {
    return this.adapter.setNotFoundHandler(handler);
  }
  setBaseViewsDir(path: string | string[]): this {
    if (this.adapterAsServer.setBaseViewsDir) {
      this.adapterAsServer.setBaseViewsDir(path);
    }
    return this;
  }

  private get adapterAsServer() {
    return this.adapter as HttpServer;
  }
  //#endregion

  private setContentTypeToHtml(response: any) {
    this.adapter.setHeader(response, 'Content-Type', 'text/html; charset=utf-8');
  }
  private isString = (fn: any): fn is string => typeof fn === 'string';
  private canRenderIntercept(response: any) {
    return this.renderToString && response.renderInterceptors && response.renderInterceptors.length > 0;
  }
  async render(response: any, view: string, options: any) {
    const skipRender = response.skipRender;
    if (skipRender) {
      if (!this.isString(options)) {
        throw new SkipRenderNotStringError();
      }
      this.setContentTypeToHtml(response);
    }
    if (this.canRenderIntercept(response)) {
      const renderedString = skipRender
            ? options as string
            : await this.renderToString(this.adapter, view, options, response);

      const renderIntercepted = await this.renderIntercept(renderedString, response.renderInterceptors);
      return this.adapter.reply(response, renderIntercepted);
    } else if (response.skipRender) {
        return this.adapter.reply(response, options);
      } else {
        return this.adapter.render(response, view, options);
      }
  }
  public async renderIntercept(renderedString: string, renderInterceptors: RenderInterceptor[]) {
    const renderInterceptedObservable = await this.renderInterceptInterceptors(renderedString, renderInterceptors);
    return renderInterceptedObservable.toPromise();
  }
  private renderInterceptInterceptors(rendered: string, interceptors: RenderInterceptor[]) {
    const start$ = defer(() => of(rendered));
    const nextFn = (i = 0) => async () => {
      if (i >= interceptors.length) {
        return start$;
      }
      const handler: CallHandler = {
        handle: () => fromPromise(nextFn(i + 1)()).pipe(mergeAll()),
      };
      return interceptors[i].renderIntercept(handler);
    };
    return nextFn()();
  }
}
