import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authHttpInterceptorFn, provideAuth0 } from '@auth0/auth0-angular';
import { AuthInterceptorService } from './services/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideAuth0({
      domain: "dev-eh3l2g5ka7lckp21.us.auth0.com",
      clientId: "Cep1lr8ZIzcoHUgYU4SGyRDi2O1AWiHr",
      authorizationParams: {
        redirect_uri: "https://localhost:4200/login/callback",
        audience: "http://localhost:8080",
      },
      httpInterceptor: {
        allowedList: [
          'http://localhost:8080/api/orders/*',
          'http://localhost:8080/api/checkout/purchase'
        ],
      }
    }),
    provideHttpClient(
      withInterceptors([authHttpInterceptorFn])
    ),
  ],
};
