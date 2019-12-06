import { RenderInterceptorBase } from './renderInterceptorBase';
import { IRenderRegistration } from './renderRegistrationInterface';

export abstract class TemplateInterceptor extends RenderInterceptorBase {
  protected register(registration: IRenderRegistration, response: any) {
    registration.registerTemplateInterception(this, response);
  }
}
