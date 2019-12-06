import { RenderInterceptorBase } from './renderInterceptorBase';

import { defer, of, from as fromPromise } from 'rxjs';

import { CallHandler } from '@nestjs/common';

import { mergeAll } from 'rxjs/operators';

export class RenderInterception {
  public async intercept(
    toIntercept: string,
    renderInterceptors: RenderInterceptorBase[] | undefined,
  ) {
    if (renderInterceptors) {
      const renderInterceptedObservable = await this.interceptorsIntercept(
        toIntercept,
        renderInterceptors,
      );
      return renderInterceptedObservable.toPromise();
    }
    return toIntercept;
  }
  private interceptorsIntercept(
    toIntercept: string,
    interceptors: RenderInterceptorBase[],
  ) {
    const start$ = defer(() => of(toIntercept));
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
