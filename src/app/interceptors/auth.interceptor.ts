import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional HTTP Interceptor to automatically attach the stored JWT token
 * to the 'Authorization' header of every outgoing request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};
