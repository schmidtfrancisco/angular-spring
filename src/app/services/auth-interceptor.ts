import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { from, lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptorService implements HttpInterceptor {
  private auth = inject(AuthService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.handleAccess(request, next));
  }

  private async handleAccess(request: HttpRequest<any>, next: HttpHandler): Promise<HttpEvent<any>> {
    const endpoint = environment.shoppeandoApiUrl + '/orders';
    const secureEndpoints = [endpoint];

    if (secureEndpoints.some((url) => request.urlWithParams.includes(url))) {
      await this.auth.getAccessTokenSilently().forEach((token) => {
        console.log('Access token: ', token);
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      });
    }

    return await lastValueFrom(next.handle(request));
  }
}
