# Nest render interception

## Why ?

Nest has interception for handler responses and if there is an @Render decorator applied then template processing is performed.  This is normally what is required but it does not allow interceptors to :

1) to skip the template rendering altogether
2) to intercept the rendered html.

## How ?

npm install --save nest-render-interception

Supply a RenderAdapter argument to NestFactory.create().  There are 3 RenderAdapter classes available.  The base class constructor takes an AbstractHttpAdapter which is adapted to have the new render functionality.  If intercepting the rendered html the second constructor argument is required which is responsible for rendering to string.

There are two adapter specific RenderAdapter derivations, ExpressRenderAdapter and FastifyRenderAdapter.  These classes do not require the second argument as rendering to string is managed for you.  Also with ExpressRenderAdapter you do not need to provide an ExpressAdapter.

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
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
To achieve 1 and 2 above we need to :

1) No additional classes required.  Just attach skipRender true to the response in normal Nest Interceptor.

2) Derive from RenderInterceptor implementing the renderIntercept method which works similarly to the normal intercept.  The differences are as follows. You are working with string values and the execution context argument has been removed and replaced with an **executionContext property** that is better suited to this use case.
As you can see below getClass/getHandler is as before and you can now getRequest/getResponse without needing to switchToHttp() first.  getNext has not been exposed.

```typescript
export interface IRenderInterceptorExecutionContext {
  getClass<T = any>(): ReturnType<ExecutionContext['getClass']>;
  getHandler(): ReturnType<ExecutionContext['getHandler']>;
  
  getRequest<T = any>(): ReturnType<HttpArgumentsHost['getRequest']>;
  getResponse<T = any>(): ReturnType<HttpArgumentsHost['getResponse']>;
}
```

Provide this interceptor to nest in the normal manner.  Remember to provide the renderToString constructor argument to the RenderAdapter if not using ExpressRenderAdapter or FastifyRenderAdapter.

Below is a ( contrived ) render interceptor

```typescript
@Injectable()
export class AddFooterRenderInterceptor extends RenderInterceptor {
  constructor(private readonly footer: string) {
    super();
  }
  renderIntercept(next: CallHandler<string>): Observable<string> | Promise<Observable<string>> {
    if (this.executionContext.getHandler().name.endsWith('Footer')) {
      return next.handle().pipe(map(html => {
        return html.replace('</body>', `${this.footer}</body>`);
      }));
    }
    return next.handle();
  }
}
```

