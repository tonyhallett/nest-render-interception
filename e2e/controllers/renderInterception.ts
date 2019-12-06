import { Controller, UseInterceptors, Get, Render, Logger, LoggerService } from '@nestjs/common';
import { SkipRenderInterceptor } from '../interceptors/skipRenderInterceptor';
import { useFooterRenderInterceptor } from '../interceptors/addFooterRenderInterceptor';
import { ExampleTemplateInterceptor } from '../interceptors/exampleTemplateInterceptor';

@Controller('renderInterception')
@UseInterceptors( SkipRenderInterceptor,  useFooterRenderInterceptor('<div>This is a footer</div>'))
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

  @UseInterceptors(ExampleTemplateInterceptor)
  @Get('templateIntercept')
  @Render('someView1.hbs')
  templateIntercept() {
    return {
      view: 'One - will be fancy viewed',
    };
  }

  @UseInterceptors(useFooterRenderInterceptor('<div>This is another footer</div>'))
  @Render('someView1.hbs')
  doubleFooter() {
    return {
      view: 'Double footer',
    };
  }
}
