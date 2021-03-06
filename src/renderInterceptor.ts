import { RenderInterceptorBase } from './renderInterceptorBase';
import { IRenderRegistration } from './renderRegistrationInterface';
export abstract class RenderInterceptor extends RenderInterceptorBase {
  protected register(registration: IRenderRegistration, response: any) {
    registration.registerRenderInterception(this, response);
  }
}
