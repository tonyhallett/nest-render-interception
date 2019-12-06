import { RenderInterceptor } from '../src/renderInterceptor';
import { CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IRenderRegistration } from '../src/renderRegistrationInterface';
describe('RenderInterceptor', () => {
  it('should RenderAdapter.registerRenderInterception', () => {
    class TestRenderInterceptor extends RenderInterceptor {
      testRegister(registration: IRenderRegistration, response: any) {
        this.register(registration, response);
      }
      renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
        throw new Error('Method not implemented.');
      }
    }
    const templateInterceptor = new TestRenderInterceptor();
    const registerRenderInterception = jest.fn();
    const res = {res: ''};
    templateInterceptor.testRegister({registerTemplateInterception: null, registerRenderInterception}, res);
    expect(registerRenderInterception).toHaveBeenCalledWith(templateInterceptor, res);
  });
});
