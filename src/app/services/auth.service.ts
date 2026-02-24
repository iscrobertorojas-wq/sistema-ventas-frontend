import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, fromEvent, merge, timer } from 'rxjs';
import { map, switchMap, tap, filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private baseUrl: string;
    private authStatus = new BehaviorSubject<boolean>(this.hasToken());
    private inactivityTimer = new BehaviorSubject<number>(0);
    private readonly INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in ms

    constructor(
        private http: HttpClient,
        private router: Router,
        private ngZone: NgZone
    ) {
        const host = window.location.hostname;
        this.baseUrl = `https://sistema-ventas-backend.vercel.app/api/auth`;
        this.setupInactivityTracker();
    }

    private hasToken(): boolean {
        return !!localStorage.getItem('token');
    }

    get isAuthenticated$(): Observable<boolean> {
        return this.authStatus.asObservable();
    }

    checkSetupStatus(): Observable<{ isSetup: boolean }> {
        return this.http.get<{ isSetup: boolean }>(`${this.baseUrl}/setup-status`);
    }

    setup(password: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/setup`, { password });
    }

    login(password: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/login`, {
            email: 'iscroberto.rojas@gmail.com',
            password
        }).pipe(
            tap(res => {
                localStorage.setItem('token', res.token);
                this.authStatus.next(true);
                this.resetInactivityTimer();
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        this.authStatus.next(false);
        this.router.navigate(['/login']);
    }

    private setupInactivityTracker() {
        this.ngZone.runOutsideAngular(() => {
            const events = merge(
                fromEvent(document, 'mousemove'),
                fromEvent(document, 'click'),
                fromEvent(document, 'keydown'),
                fromEvent(document, 'scroll'),
                fromEvent(document, 'touchstart')
            );

            events.pipe(
                filter(() => this.authStatus.value),
                switchMap(() => {
                    this.resetInactivityTimer();
                    return timer(this.INACTIVITY_LIMIT);
                })
            ).subscribe(() => {
                this.ngZone.run(() => {
                    console.log('Inactivity limit reached, logging out...');
                    this.logout();
                });
            });
        });
    }

    private resetInactivityTimer() {
        // Just a placeholder if we want to track the actual time remaining
    }
}
