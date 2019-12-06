import {
  RequestMethod,
  NestApplicationOptions,
  CallHandler,
  HttpServer,
} from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { SkipRenderNotStringError } from './SkipRenderNotStringError';
import { AbstractHttpAdapter } from '@nestjs/core';
import { RenderInterceptorBase } from './renderInterceptorBase';
import { IRenderRegistration } from './renderRegistrationInterface';
import { RenderInterception } from './interception';

export type RenderResponse = {
  templateInterceptors?: RenderInterceptorBase[];
  renderInterceptors?: RenderInterceptorBase[];
  skipRender?: boolean;
} & Record<string, any>;
export type ResponseInterceptorsKeys = keyof Omit<RenderResponse, 'skipRender'>;

export class RenderAdapter<T extends AbstractHttpAdapter = AbstractHttpAdapter>
  extends AbstractHttpAdapter
  implements IRenderRegistration {
  private interception = new RenderInterception();
  constructor(
    public readonly adapter: T,
    private readonly renderToString?: (
      server: T,
      view: string,
      options: any,
      response: any,
    ) => string | Promise<string>,
  ) {
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
    this.adapter.setHeader(
      response,
      'Content-Type',
      'text/html; charset=utf-8',
    );
  }
  private isString = (fn: any): fn is string => typeof fn === 'string';
  private canRenderIntercept(response: RenderResponse, skipRender: boolean) {
    let canRenderIntercept = false;
    if (response.renderInterceptors && response.renderInterceptors.length > 0) {
      canRenderIntercept = skipRender || !!this.renderToString;
    }
    return canRenderIntercept;
  }
  registerTemplateInterception(
    interceptor: RenderInterceptorBase,
    response: any,
  ) {
    this.registerInterception('templateInterceptors', interceptor, response);
  }
  registerRenderInterception(
    interceptor: RenderInterceptorBase,
    response: any,
  ) {
    this.registerInterception('renderInterceptors', interceptor, response);
  }
  private registerInterception<TKey extends ResponseInterceptorsKeys>(
    key: TKey,
    interceptor: RenderInterceptorBase,
    response: RenderResponse,
  ) {
    if (response[key] === undefined) {
      response[key] = [];
    }
    response[key].push(interceptor);
  }

  async render(response: RenderResponse, view: string, options: any) {
    const skipRender = response.skipRender;
    if (skipRender) {
      if (!this.isString(options)) {
        throw new SkipRenderNotStringError();
      }
      this.setContentTypeToHtml(response);
    } else {
      view = await this.interception.intercept(
        view,
        response.templateInterceptors,
      );
    }
    if (this.canRenderIntercept(response, skipRender)) {
      const renderedString = skipRender
        ? (options as string)
        : await this.renderToString(this.adapter, view, options, response);

      const renderIntercepted = await this.interception.intercept(
        renderedString,
        response.renderInterceptors,
      );
      return this.adapter.reply(response, renderIntercepted);
    } else if (response.skipRender) {
      return this.adapter.reply(response, options);
    } else {
      return this.adapter.render(response, view, options);
    }
  }
}
