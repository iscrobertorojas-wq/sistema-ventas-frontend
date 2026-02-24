import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.auth.isAuthenticated$.pipe(
            take(1),
            map(isAuth => {
                if (!isAuth) {
                    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                    return false;
                }
                return true;
            })
        );
    }
}
