import { Injectable, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RenderInterceptor } from '../../src/renderInterceptor';

@Injectable()
export class AddFooterRenderInterceptor extends RenderInterceptor {
  constructor(private readonly footer: string) {
    super();
  }
  renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
    if (this.executionContext.getHandler().name.endsWith('Footer')) {
      return next.handle().pipe(map(html => {
        return html.replace('</body>', `${this.footer}</body>`);
      }));
    }
    return next.handle();
  }
}
