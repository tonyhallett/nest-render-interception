import { Injectable, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RenderInterceptor } from '../../src/renderInterceptor';

export const useFooterRenderInterceptor = (footer: string) => {
  @Injectable()
  class AddFooterRenderInterceptor extends RenderInterceptor {
    renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
      if (this.executionContext.getHandler().name.endsWith('Footer')) {
        return next.handle().pipe(map(html => {
          return html.replace('</body>', `${footer}</body>`);
        }));
      }
      return next.handle();
    }
  }
  return AddFooterRenderInterceptor;
};
