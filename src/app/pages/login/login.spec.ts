import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

// Mock AuthService
const mockAuthService = {
  signIn: jasmine.createSpy('signIn').and.returnValue(Promise.resolve()),
  register: jasmine.createSpy('register').and.returnValue(Promise.resolve()),
  getErrorMessage: jasmine
    .createSpy('getErrorMessage')
    .and.returnValue('Test error message'),
  currentUser$: of(null),
  isLoading$: of(false),
  isAuthenticated: false,
  currentUser: null,
};

// Mock MatSnackBar
const mockSnackBar = {
  open: jasmine.createSpy('open').and.returnValue({
    dismiss: jasmine.createSpy('dismiss'),
  }),
};

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, BrowserAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        provideRouter([]),
        provideLocationMocks(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clear all spy calls between tests
    mockAuthService.signIn.calls.reset();
    mockAuthService.register.calls.reset();
    mockAuthService.getErrorMessage.calls.reset();
    mockSnackBar.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize login form with email and password controls', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
    });

    it('should initialize register form with email, password, and confirmPassword controls', () => {
      expect(component.registerForm).toBeDefined();
      expect(component.registerForm.get('email')).toBeDefined();
      expect(component.registerForm.get('password')).toBeDefined();
      expect(component.registerForm.get('confirmPassword')).toBeDefined();
    });

    it('should have required validators on login form fields', () => {
      const emailControl = component.loginForm.get('email');
      const passwordControl = component.loginForm.get('password');

      emailControl?.setValue('');
      passwordControl?.setValue('');

      expect(emailControl?.hasError('required')).toBeTruthy();
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should have email validator on login form email field', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });

    it('should have minlength validator on password fields', () => {
      const loginPasswordControl = component.loginForm.get('password');
      const registerPasswordControl = component.registerForm.get('password');

      loginPasswordControl?.setValue('123');
      registerPasswordControl?.setValue('123');

      expect(loginPasswordControl?.hasError('minlength')).toBeTruthy();
      expect(registerPasswordControl?.hasError('minlength')).toBeTruthy();

      loginPasswordControl?.setValue('123456');
      registerPasswordControl?.setValue('123456');

      expect(loginPasswordControl?.hasError('minlength')).toBeFalsy();
      expect(registerPasswordControl?.hasError('minlength')).toBeFalsy();
    });
  });

  describe('Login Functionality', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should call authService.signIn with correct credentials on successful login', async () => {
      await component.handleLogin();

      expect(authService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should set isLoading to true during login and false after completion', async () => {
      expect(component.isLoading).toBeFalsy();

      const loginPromise = component.handleLogin();
      expect(component.isLoading).toBeTruthy();

      await loginPromise;
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe('Registration Functionality', () => {
    beforeEach(() => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });

    it('should call authService.register with correct credentials on successful registration', async () => {
      await component.handleRegister();

      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should set isLoading to true during registration and false after completion', async () => {
      expect(component.isLoading).toBeFalsy();

      const registerPromise = component.handleRegister();
      expect(component.isLoading).toBeTruthy();

      await registerPromise;
      expect(component.isLoading).toBeFalsy();
    });

    it('should not proceed when register form is invalid', async () => {
      component.registerForm.patchValue({
        email: '',
        password: '',
        confirmPassword: '',
      });

      await component.handleRegister();

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should not proceed when passwords do not match', async () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      });

      await component.handleRegister();

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should not proceed when email is invalid', async () => {
      component.registerForm.patchValue({
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      });

      await component.handleRegister();

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should not proceed when password is too short', async () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
      });

      await component.handleRegister();

      expect(authService.register).not.toHaveBeenCalled();
    });
  });
  describe('Loading Animation', () => {
    it('should have loading animation options configured', () => {
      expect(component.loadingAnimationOptions).toBeDefined();
      expect(component.loadingAnimationOptions.loop).toBeTruthy();
      expect(component.loadingAnimationOptions.autoplay).toBeTruthy();
    });

    it('should initialize isLoading as false', () => {
      expect(component.isLoading).toBeFalsy();
    });
  });

  describe('Component Integration', () => {
    it('should render login form when component is created', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).toBeTruthy();
    });

    it('should have proper form controls in the template', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emailInputs = compiled.querySelectorAll(
        'input[formControlName="email"]',
      );
      const passwordInputs = compiled.querySelectorAll(
        'input[formControlName="password"]',
      );

      expect(emailInputs.length).toBeGreaterThan(0);
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    it('should have forgot password link', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const forgotPasswordLink = compiled.querySelector(
        'a[routerLink="/forgot-password"]',
      );
      expect(forgotPasswordLink).toBeTruthy();
    });

    it('should have tab navigation for login and register', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tabGroup = compiled.querySelector('mat-tab-group');
      expect(tabGroup).toBeTruthy();
    });
  });
});
