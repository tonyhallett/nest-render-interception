import { TemplateInterceptor } from '../../src/templateInterceptor';
import { CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class ExampleTemplateInterceptor extends TemplateInterceptor{
  renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
    return next.handle().pipe(map(view => `useFancyView/${view}`));
  }
}
