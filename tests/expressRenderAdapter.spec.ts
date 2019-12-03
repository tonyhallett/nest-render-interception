import { RenderAdapter } from '../src/renderAdapter';
import { ExpressRenderAdapter } from '../src/expressRenderAdapter';
import { ExpressAdapter } from '@nestjs/platform-express';

jest.mock('../src/renderAdapter');
jest.mock('@nestjs/platform-express');

describe('ExpressRenderAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass the adapter to the base class', () => {
    const expressAdapter = {};
    const expressRenderAdapter = new ExpressRenderAdapter(expressAdapter as any);
    expect((RenderAdapter as jest.Mock).mock.calls[0][0]).toBe(expressAdapter);
  });
  it('should create an ExpressRenderAdapter if no ctor arg', () => {
    const MockExpressAdapter = ExpressAdapter as jest.Mock;
    const expressRenderAdapter = new ExpressRenderAdapter();
    expect(MockExpressAdapter.mock.calls[0].length).toBe(0);
    expect((RenderAdapter as jest.Mock).mock.calls[0][0]).toBe(MockExpressAdapter.mock.instances[0]);
  });

  it('should render to string as expected', async () => {
    const expressRendered = '<div>Rendered to string</div>';
    const expressRender = jest.fn((view, options, callback) => {
      callback(undefined, expressRendered);
    });
    const expressAdapter = {
      getInstance() {
        return {
          render: expressRender,
        };
      },
    };

    const expressRenderAdapter = new ExpressRenderAdapter(expressAdapter as any);
    const renderToString = ( RenderAdapter as jest.Mock).mock.calls[0][1];
    const result = {hello: 'world'};
    const rendered = await renderToString(expressAdapter, 'someView', result);
    expect(expressRender.mock.calls[0][0]).toBe('someView');
    expect(expressRender.mock.calls[0][1]).toBe(result);
    expect(rendered).toBe(expressRendered);
  });
  it('should reject when expected', async () => {
    const error = new Error();
    const expressAdapter = {
      getInstance() {
        return {
          render(view, options, callback) {
            callback(error);
          },
        };
      },
    };
    let renderToStringError: Error|undefined;
    const expressRenderAdapter = new ExpressRenderAdapter(expressAdapter as any);
    const renderToString = ( RenderAdapter as jest.Mock).mock.calls[0][1];
    try {
      await renderToString(expressAdapter, 'someView', '');
    } catch (e) {
      renderToStringError = e;
    }
    expect(renderToStringError).toBe(error);
  });
});
