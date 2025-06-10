import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
  onAuthStateChanged,
  updateProfile,
  UserCredential,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, take, firstValueFrom } from 'rxjs';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth: Auth = inject(Auth);
  private readonly router: Router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(
    null,
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        };
        this.currentUserSubject.next(authUser);
      } else {
        this.currentUserSubject.next(null);
      }
      this.isLoadingSubject.next(false);
    });
  }

  /**
   * Get the current user
   */
  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if auth is still loading
   */
  get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      );

      // Wait for the auth state to be updated before navigating
      await firstValueFrom(
        this.currentUser$.pipe(
          filter((user) => user !== null),
          take(1),
        ),
      );

      // Navigate to dashboard after auth state is confirmed
      await this.router.navigate(['/dashboard']);

      return userCredential;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Register with email and password
   */
  async register(credentials: RegisterCredentials): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      );

      // Update display name if provided
      if (credentials.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName,
        });
      }

      // Wait for the auth state to be updated before navigating
      await firstValueFrom(
        this.currentUser$.pipe(
          filter((user) => user !== null),
          take(1),
        ),
      );

      // Navigate to dashboard after auth state is confirmed
      await this.router.navigate(['/dashboard']);

      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);

      // Wait for the auth state to be cleared before navigating
      await firstValueFrom(
        this.currentUser$.pipe(
          filter((user) => user === null),
          take(1),
        ),
      );

      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get user-friendly error message from Firebase auth error
   */
  getErrorMessage(error: unknown): string {
    const errorMessages: { [key: string]: string } = {
      // Sign in errors
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests':
        'Too many failed attempts. Please try again later.',
      'auth/invalid-credential':
        'Invalid email or password. Please check your credentials.',

      // Registration errors
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',

      // Network errors
      'auth/network-request-failed':
        'Network error. Please check your connection.',

      // General errors
      'auth/internal-error': 'An internal error occurred. Please try again.',
      'auth/cancelled-popup-request': 'Authentication was cancelled.',
      'auth/popup-blocked': 'Popup was blocked by the browser.',
      'auth/popup-closed-by-user': 'Authentication popup was closed.',
    };

    if (this.isFirebaseError(error)) {
      return (
        errorMessages[error.code] ||
        'An unexpected error occurred. Please try again.'
      );
    }

    if (error instanceof Error) {
      return `An error occurred: ${error.message}`;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Type guard to check if error is a Firebase error
   */
  private isFirebaseError(
    error: unknown,
  ): error is { code: string; message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      typeof (error as any).code === 'string' &&
      typeof (error as any).message === 'string'
    );
  }
}
