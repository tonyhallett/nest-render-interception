# Nest render interception

## Why ?

Nest has interception for handler responses and if there is an @Render decorator applied then template processing is performed.  This is normally what is required but it does not allow interceptors to :

1) to skip the template rendering altogether - **if have already rendered to string**
2) to change the template
2) to intercept the rendered html.

## How ?

npm install --save nest-render-interception

Supply a RenderAdapter argument to NestFactory.create().  There are 3 RenderAdapter classes available.  The base class constructor takes an AbstractHttpAdapter that is decorated with the new render functionality.  If render intercepting the html (3) and not skip rendering (1) the second constructor argument is required, which is responsible for rendering to string using the wrapped AbstractHttpAdapter.

There are two adapter specific RenderAdapter derivations, ExpressRenderAdapter and FastifyRenderAdapter.  These classes do not require the second argument as rendering to string is managed for you.  Also with ExpressRenderAdapter you do not need to provide an ExpressAdapter.

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressRenderAdapter(),
  );
  app.setBaseViewsDir('views');
  app.setViewEngine('hbs');
  await app.listen(3000);
}
bootstrap();
```

The RenderAdapter classes work in conjunction with interceptors.
To achieve 1), 2) and 3) above we need to :

1) No additional classes required.  Just attach skipRender true to the response in normal Nest Interceptor.  **Ensure that the result from applying normal interceptors is Observable\<string\>\|Promise\<Observable\<string\>\>**

2) Derive from TemplateInterceptor
3) Derive from RenderInterceptor

For both 2) and 3) :

Implement the renderIntercept method which works similarly to the normal intercept.  The differences are as follows. 

You are working with string values.
```typescript
abstract renderIntercept(
  next: CallHandler<string>,
): Observable<string> | Promise<Observable<string>>;
```
The execution context argument has been removed and replaced with an **executionContext property** that is better suited to this use case.
As you can see below, getClass/getHandler is as before and you can now getRequest/getResponse without needing to switchToHttp() first.  getNext has not been exposed.

```typescript
export interface IRenderInterceptorExecutionContext {
  getClass<T = any>(): ReturnType<ExecutionContext['getClass']>;
  getHandler(): ReturnType<ExecutionContext['getHandler']>;
  
  getRequest<T = any>(): ReturnType<HttpArgumentsHost['getRequest']>;
  getResponse<T = any>(): ReturnType<HttpArgumentsHost['getResponse']>;
}
```

**Caveat !**

The TemplateInterceptor and the RenderTemplateInterceptor use nest dependency injection and as such you cannot pass an instance to nest.  If you need to pass 
arguments you can use a factory function :

```typescript
// A contrived example
export const useFooterRenderInterceptor = (footer: string) => {
  @Injectable()
  class AddFooterRenderInterceptor extends RenderInterceptor {
    renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
      if (this.executionContext.getHandler().name.endsWith('Footer')) {
        return next.handle().pipe(map(html => {
          return html.replace('</body>', `${footer}</body>`);
        }));
      }
      return next.handle();
    }
  }
  return AddFooterRenderInterceptor;
};

@Controller()
@UseInterceptors( useFooterRenderInterceptor('<div>This is a footer</div>'))
export class RenderInterceptionController {
  @Get('someFooter')
  @Render('someView1.hbs')
  someFooter() {
    return {
        view: 'View One',
    };
  }
}
```

Remember to provide the renderToString constructor argument to the RenderAdapter if not using ExpressRenderAdapter or FastifyRenderAdapter and intercepting non skip render.
