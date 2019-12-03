import { Controller, UseInterceptors, Get, Render } from '@nestjs/common';
import { SkipRenderInterceptor } from '../interceptors/skipRenderInterceptor';
import { AddFooterRenderInterceptor } from '../interceptors/addFooterRenderInterceptor';

@Controller('renderInterception')
@UseInterceptors( SkipRenderInterceptor, new AddFooterRenderInterceptor('<div>This is a footer</div>'))
export class RenderInterceptionController {
  @Get('skipRender1')
  @Render('someView1.hbs')
  skipRender1() {
    return {
        view: 'View One',
    };
  }

  @Get('skipRender2')
  @Render('someView2.hbs')
  skipRender2() {
    return {
        view: 'View Two',
    };
  }

  @Get('renderIntercept')
  @Render('renderIntercept.hbs')
  renderInterceptFooter() {
    return {
      msg: 'This view will be render intercepted',
    };
  }

  @Get('notRenderInterceptFooter')
  @Render('renderIntercept.hbs')
  notRenderIntercept() {
    return {
      msg: 'This view will not be render intercepted',
    };
  }

  // could demo that if no render template all is good
}
