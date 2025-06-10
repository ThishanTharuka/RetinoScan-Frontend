import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, map, take, filter, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.canActivate(childRoute, state);
  }

  private checkAuth(url: string): Observable<boolean> {
    // Wait for auth service to finish loading before checking auth state
    return this.authService.isLoading$.pipe(
      filter((isLoading) => !isLoading), // Wait until loading is complete
      take(1),
      switchMap(() =>
        this.authService.currentUser$.pipe(
          take(1),
          map((user) => {
            if (user) {
              return true;
            }

            // Store the attempted URL for redirecting after login
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: url },
            });
            return false;
          }),
        ),
      ),
    );
  }
}

/**
 * Guard to prevent authenticated users from accessing auth pages (login, register, etc.)
 */
@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    // Wait for auth service to finish loading before checking auth state
    return this.authService.isLoading$.pipe(
      filter((isLoading) => !isLoading), // Wait until loading is complete
      take(1),
      switchMap(() =>
        this.authService.currentUser$.pipe(
          take(1),
          map((user) => {
            if (user) {
              // User is already authenticated, redirect to dashboard
              this.router.navigate(['/dashboard']);
              return false;
            }
            return true;
          }),
        ),
      ),
    );
  }
}
