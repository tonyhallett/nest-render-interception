/* istanbul ignore file */
import { RenderInterceptorInternal } from './renderInterceptorInternal';
import { RenderInterceptorExecutionContextFactory } from './renderInterceptorExecutionContext';
export abstract class RenderInterceptor extends RenderInterceptorInternal {
  constructor() {
    super(RenderInterceptorExecutionContextFactory);
  }
}
