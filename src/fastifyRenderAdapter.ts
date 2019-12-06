import { RenderAdapter } from './renderAdapter';
import { AbstractHttpAdapter } from '@nestjs/core';
export class FastifyRenderAdapter extends RenderAdapter {
  constructor(fastifyAdapter: AbstractHttpAdapter) {
    super(fastifyAdapter, async (adapter, view, options) => {
      const instance = adapter.getInstance();
      const renderedString: string = await instance.view(view, options);
      return renderedString;
    });
  }
}
