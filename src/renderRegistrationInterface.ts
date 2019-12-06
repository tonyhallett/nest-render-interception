import { RenderInterceptorBase } from './renderInterceptorBase';

export interface IRenderRegistration {
  registerRenderInterception(interceptor: RenderInterceptorBase, response: any);
  registerTemplateInterception(
    interceptor: RenderInterceptorBase,
    response: any,
  );
}
