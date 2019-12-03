export class SkipRenderNotStringError extends Error {
  constructor() {
    super('NestInterceptor.intercept rendered - result is not a string');
  }
}
