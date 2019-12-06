import { RenderAdapter } from './renderAdapter';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
export class ExpressRenderAdapter extends RenderAdapter<ExpressAdapter> {
  constructor(expressAdapter = new ExpressAdapter()) {
    super(expressAdapter, (adapter, view, options) => {
      const instance = expressAdapter.getInstance<express.Express>();
      return new Promise((resolve, reject) => {
        instance.render(view, options, (error: Error, html: string) => {
          if (error) {
            reject(error);
          } else {
            resolve(html);
          }
        });
      });
    });
  }
}
