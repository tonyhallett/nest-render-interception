import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RENDER_METADATA } from '@nestjs/common/constants';
import * as express from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class SkipRenderInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    let passThrough = true;
    const httpArguments = context.switchToHttp();
    const request: express.Request = httpArguments.getRequest();
    if (request.headers['use-fancy-view']) {
      const renderTemplate = this.reflector.get(RENDER_METADATA, context.getHandler());
      if (renderTemplate) {
        passThrough = false;
        return next.handle().pipe(map(async res => {
          const response: express.Response = httpArguments.getResponse();
          const skipRenderResponse = await new Promise((resolve, reject) => {
            const template = `useFancyView/${renderTemplate}`;
            response.render(template, res, (err, html) => {
              if (err) {
                reject(err);
              } else {
                (response as any).skipRender = true;
                resolve(html);
              }
            });
          });
          return skipRenderResponse;
        }));
      }
    }
    if ( passThrough) {
      return next.handle();
    }
  }
}
