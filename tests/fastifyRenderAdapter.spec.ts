import { RenderAdapter } from '../src/renderAdapter';
import { FastifyRenderAdapter } from '../src/fastifyRenderAdapter';

jest.mock('../src/renderAdapter');

describe('ExpressRenderAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass the adapter to the base class', () => {
    const fastifyAdapter = {};
    const fastifyRenderAdapter = new FastifyRenderAdapter(fastifyAdapter as any);
    expect((RenderAdapter as jest.Mock).mock.calls[0][0]).toBe(fastifyAdapter);
  });

  it('should render to string as expected', async () => {
    const fastifyRendered = '<div>Rendered to string</div>';
    const fastifyRender = jest.fn().mockReturnValue(Promise.resolve(fastifyRendered));
    const fastifyAdapter = {
      getInstance() {
        return {
          view: fastifyRender,
        };
      },
    };

    const fastifyRenderAdapter = new FastifyRenderAdapter(fastifyAdapter as any);
    const renderToString = ( RenderAdapter as jest.Mock).mock.calls[0][1];
    const result = {hello: 'world'};
    const rendered = await renderToString(fastifyAdapter, 'someView', result);
    expect(fastifyRender.mock.calls[0][0]).toBe('someView');
    expect(fastifyRender.mock.calls[0][1]).toBe(result);
    expect(rendered).toBe(fastifyRendered);
  });
  it('should reject when expected', async () => {
    const error = new Error();
    const fastifyRender = jest.fn().mockReturnValue(Promise.reject(error));
    const fastifyAdapter = {
      getInstance() {
        return {
          view: fastifyRender,
        };
      },
    };
    let renderToStringError: Error|undefined;
    const fastifyRenderAdapter = new FastifyRenderAdapter(fastifyAdapter as any);
    const renderToString = ( RenderAdapter as jest.Mock).mock.calls[0][1];
    try {
      await renderToString(fastifyAdapter, 'someView', '');
    } catch (e) {
      renderToStringError = e;
    }
    expect(renderToStringError).toBe(error);
  });
});
