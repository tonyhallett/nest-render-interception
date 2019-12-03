import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { RenderAdapter } from '../src/renderAdapter';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { RenderInterceptionController } from './controllers/renderInterception';
import * as path from 'path';

describe('Render interception', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ RenderInterceptionController],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>(new RenderAdapter(new ExpressAdapter(), (expressAdapter, view, options) => {
      return new Promise((resolve, reject) => {
        (expressAdapter.getInstance() as express.Express).render(view, options, (err, html) => {
          if (err) {
            reject(err);
          } else {
            resolve(html);
          }
        });
      });
    }));
    const viewsDirectory = path.join(__dirname, 'views');
    app.setBaseViewsDir(viewsDirectory);
    app.setViewEngine('hbs');
    await app.init();
  });

  describe('skip render', () => {
    interface SkipRenderTest {
      view1: boolean;
      useFancyView: boolean;
      description: string;
    }
    const skipRenderTests: SkipRenderTest[] = [
      {
        view1: true,
        useFancyView: true,
        description: 'skip renders, view 1',
      },
      {
        view1: false,
        useFancyView: true,
        description: 'skip renders, view 2',
      },
      {
        view1: true,
        useFancyView: false,
        description: 'does not skip render',
      },
    ];
    skipRenderTests.forEach(skipRenderTest => {
      it(skipRenderTest.description, () => {
        let chain = request(app.getHttpServer())
        .get(`/renderInterception/skipRender${skipRenderTest.view1 ? 1 : 2}`);
        if (skipRenderTest.useFancyView) {
          chain = chain.set('use-fancy-view', 'true');
        }
        return chain.expect(200)
        .expect(res => {
          const text = res.text;
          expect(text.indexOf(`View ${skipRenderTest.view1 ? 'One' : 'Two'}`) !== -1).toBe(true);
          expect(text.indexOf('This is fancy') !== -1).toBe(skipRenderTest.useFancyView);
        });
      });
    });
  });
  describe('render interception adding footer', () => {
    interface RenderInterceptionTest {
      path: string;
      expectRenderIntercepted: boolean;
      description: string;
    }
    const renderInterceptionTests: RenderInterceptionTest[] = [
      {
        path: 'renderIntercept',
        expectRenderIntercepted: true,
        description: 'should add footer to rendered template when handler ends with Footer',
      },
      {
        path: 'notRenderInterceptFooter',
        expectRenderIntercepted: false,
        description: 'should not add footer to rendered template when handler does not ends with Footer',
      },
    ];
    renderInterceptionTests.forEach(rit => {
      it(rit.description, () => {
        return request(app.getHttpServer())
        .get(`/renderInterception/${rit.path}`)
        .expect(200)
        .expect(res => {
          const text = res.text;
          expect(text.indexOf(`This view will ${rit.expectRenderIntercepted ? '' : 'not '}be render intercepted`));
          expect(text.indexOf('<div>This is a footer</div>') !== -1).toBe(rit.expectRenderIntercepted);
        });
      });
    });
  });
});
