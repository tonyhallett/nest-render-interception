import { TemplateInterceptor } from '../src/templateInterceptor';
import { CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IRenderRegistration } from '../src/renderRegistrationInterface';
describe('TemplateInterceptor', () => {
  it('should RenderAdapter.registerTemplateInterception', () => {
    class TestTemplateInterceptor extends TemplateInterceptor {
      testRegister(registration: IRenderRegistration, response: any) {
        this.register(registration, response);
      }
      renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
        throw new Error('Method not implemented.');
      }
    }
    const templateInterceptor = new TestTemplateInterceptor();
    const registerTemplateInterception = jest.fn();
    const res = {res: ''};
    templateInterceptor.testRegister({registerTemplateInterception, registerRenderInterception: null}, res);
    expect(registerTemplateInterception).toHaveBeenCalledWith(templateInterceptor, res);
  });
});
