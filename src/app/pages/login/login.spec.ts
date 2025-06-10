import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('Auth', [], {
      currentUser: null,
      onAuthStateChanged: jasmine.createSpy(),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        Login,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatInputModule,
        MatButtonModule,
        MatFormFieldModule,
        MatTabsModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture.detectChanges();
  });

  afterEach(() => {
    mockRouter.navigate.calls.reset();
    mockSnackBar.open.calls.reset();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize forms', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.registerForm).toBeDefined();
    });

    it('should initialize with loading state as false', () => {
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe('Login Form Validation', () => {
    it('should invalidate login form with empty fields', () => {
      expect(component.loginForm.valid).toBeFalsy();
    });

    it('should invalidate login form with invalid email', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(component.loginForm.valid).toBeFalsy();
      expect(component.loginForm.get('email')?.hasError('email')).toBeTruthy();
    });

    it('should invalidate login form with short password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: '123',
      });
      expect(component.loginForm.valid).toBeFalsy();
      expect(
        component.loginForm.get('password')?.hasError('minlength'),
      ).toBeTruthy();
    });

    it('should validate login form with correct email and password', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.loginForm.valid).toBeTruthy();
    });
  });

  describe('Registration Form Validation', () => {
    it('should invalidate register form with empty fields', () => {
      expect(component.registerForm.valid).toBeFalsy();
    });

    it('should invalidate register form when passwords do not match', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      });
      expect(component.registerForm.hasError('mismatch')).toBeTruthy();
    });

    it('should validate register form when passwords match', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });

    it('should invalidate register form with invalid email', () => {
      component.registerForm.patchValue({
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(component.registerForm.valid).toBeFalsy();
      expect(
        component.registerForm.get('email')?.hasError('email'),
      ).toBeTruthy();
    });
  });

  describe('Form State Management', () => {
    it('should handle form validation properly for login', () => {
      // Test with empty form
      expect(component.loginForm.invalid).toBeTruthy();

      // Test with valid data
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.loginForm.valid).toBeTruthy();
    });

    it('should handle form validation properly for registration', () => {
      // Test with empty form
      expect(component.registerForm.invalid).toBeTruthy();

      // Test with valid matching passwords
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });
  });

  describe('Error Message Handling', () => {
    it('should return user-friendly message for known Firebase errors', () => {
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      const message = component['getFirebaseErrorMessage'](error);
      expect(message).toBe('No account found with this email address.');
    });

    it('should return generic message for unknown Firebase errors', () => {
      const error = { code: 'auth/unknown-error', message: 'Unknown error' };
      const message = component['getFirebaseErrorMessage'](error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle non-Firebase errors', () => {
      const error = new Error('Network error');
      const message = component['getFirebaseErrorMessage'](error);
      expect(message).toBe('An error occurred: Network error');
    });

    it('should handle completely unknown error types', () => {
      const error = 'string error';
      const message = component['getFirebaseErrorMessage'](error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle all Firebase error codes', () => {
      const testCases = [
        {
          code: 'auth/wrong-password',
          expected: 'Incorrect password. Please try again.',
        },
        {
          code: 'auth/invalid-email',
          expected: 'Please enter a valid email address.',
        },
        {
          code: 'auth/user-disabled',
          expected: 'This account has been disabled.',
        },
        {
          code: 'auth/too-many-requests',
          expected: 'Too many failed attempts. Please try again later.',
        },
        {
          code: 'auth/email-already-in-use',
          expected: 'An account with this email already exists.',
        },
        {
          code: 'auth/weak-password',
          expected: 'Password should be at least 6 characters long.',
        },
        {
          code: 'auth/invalid-credential',
          expected: 'Invalid email or password. Please check your credentials.',
        },
        {
          code: 'auth/network-request-failed',
          expected: 'Network error. Please check your connection.',
        },
      ];

      testCases.forEach((testCase) => {
        const error = { code: testCase.code, message: 'Test message' };
        const message = component['getFirebaseErrorMessage'](error);
        expect(message).toBe(testCase.expected);
      });
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify Firebase errors', () => {
      const firebaseError = {
        code: 'auth/user-not-found',
        message: 'User not found',
      };
      expect(component['isFirebaseError'](firebaseError)).toBeTruthy();
    });

    it('should reject invalid Firebase error objects', () => {
      const invalidError = { code: 123, message: 'Invalid' };
      expect(component['isFirebaseError'](invalidError)).toBeFalsy();
    });

    it('should reject non-objects', () => {
      expect(component['isFirebaseError']('string')).toBeFalsy();
      expect(component['isFirebaseError'](null)).toBeFalsy();
      expect(component['isFirebaseError'](undefined)).toBeFalsy();
    });

    it('should reject objects missing required properties', () => {
      expect(component['isFirebaseError']({ code: 'test' })).toBeFalsy();
      expect(component['isFirebaseError']({ message: 'test' })).toBeFalsy();
      expect(component['isFirebaseError']({})).toBeFalsy();
    });
  });

  describe('Password Matching Validator', () => {
    it('should validate when passwords match', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(component.registerForm.hasError('mismatch')).toBeFalsy();
    });

    it('should invalidate when passwords do not match', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      });

      expect(component.registerForm.hasError('mismatch')).toBeTruthy();
    });

    it('should not validate when fields are empty', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: '',
        confirmPassword: '',
      });

      // Should not have mismatch error when both are empty
      expect(component.registerForm.hasError('mismatch')).toBeFalsy();
    });

    it('should handle password validation correctly', () => {
      // Test minimum length validation
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: '12345',
        confirmPassword: '12345',
      });

      expect(
        component.registerForm.get('password')?.hasError('minlength'),
      ).toBeTruthy();
      expect(
        component.registerForm.get('confirmPassword')?.hasError('minlength'),
      ).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should initialize loading state as false', () => {
      expect(component.isLoading).toBeFalsy();
    });

    it('should have loading animation options defined', () => {
      expect(component.loadingAnimationOptions).toBeDefined();
      expect(component.loadingAnimationOptions.loop).toBe(true);
      expect(component.loadingAnimationOptions.autoplay).toBe(true);
    });
  });
});
