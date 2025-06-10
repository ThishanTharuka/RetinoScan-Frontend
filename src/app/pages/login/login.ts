import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBar
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

const SNACKBAR_SUCCESS_PANEL_CLASS = 'snackbar-success';
const SNACKBAR_ERROR_PANEL_CLASS = 'snackbar-error';
const SNACKBAR_WARNING_PANEL_CLASS = 'snackbar-warning';
const SNACKBAR_DEFAULT_DURATION = 3000;
const SNACKBAR_ERROR_DURATION = 5000;

// Custom Validator for matching passwords
export function passwordsMatcher(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  } else if (confirmPassword) {
    const errors = confirmPassword.errors;
    if (errors?.['mismatch']) {
      delete errors['mismatch'];
      if (Object.keys(errors).length === 0) {
        confirmPassword.setErrors(null);
      } else {
        confirmPassword.setErrors(errors);
      }
    }
  }
  return null;
}

@Component({
  selector: 'app-login',
  imports: [
    NavbarComponent,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTabsModule,
    CommonModule,
    MatSnackBarModule,
    LottieComponent,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
})
export class Login {
  private readonly auth: Auth = inject(Auth);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  registerForm: FormGroup;

  isLoading: boolean = false;

  loadingAnimationOptions: AnimationOptions = {
    path: '/assets/animations/loading-spinner.json',
    loop: true,
    autoplay: true,
  };

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: passwordsMatcher },
    );
  }

  async handleLogin() {
    if (this.loginForm.invalid) {
      this.snackBar.open(
        'Please fill in all required fields correctly.',
        'Close',
        {
          duration: SNACKBAR_DEFAULT_DURATION,
          panelClass: [SNACKBAR_WARNING_PANEL_CLASS],
        },
      );
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.snackBar.open('Login successful!', 'Close', {
        duration: SNACKBAR_DEFAULT_DURATION,
        panelClass: [SNACKBAR_SUCCESS_PANEL_CLASS],
      });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login error', error);
      const errorMessage = this.getFirebaseErrorMessage(error.code);
      this.snackBar.open(errorMessage, 'Close', {
        duration: SNACKBAR_ERROR_DURATION,
        panelClass: [SNACKBAR_ERROR_PANEL_CLASS],
      });
    } finally {
      this.isLoading = false;
    }
  }

  async handleRegister() {
    if (this.registerForm.invalid) {
      if (
        this.registerForm.errors?.['mismatch'] ||
        this.registerForm.get('confirmPassword')?.hasError('mismatch')
      ) {
        this.snackBar.open('Passwords do not match.', 'Close', {
          duration: SNACKBAR_DEFAULT_DURATION,
          panelClass: [SNACKBAR_WARNING_PANEL_CLASS],
        });
      } else {
        this.snackBar.open(
          'Please fill in all required fields correctly.',
          'Close',
          {
            duration: SNACKBAR_DEFAULT_DURATION,
            panelClass: [SNACKBAR_WARNING_PANEL_CLASS],
          },
        );
      }
      return;
    }

    this.isLoading = true;
    const { email, password } = this.registerForm.value;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password,
      );
      console.log('User registered:', userCredential.user);
      this.snackBar.open('Registration successful! Please login.', 'Close', {
        duration: SNACKBAR_DEFAULT_DURATION,
        panelClass: [SNACKBAR_SUCCESS_PANEL_CLASS],
      });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = this.getFirebaseErrorMessage(error.code);
      this.snackBar.open(errorMessage, 'Close', {
        duration: SNACKBAR_ERROR_DURATION,
        panelClass: [SNACKBAR_ERROR_PANEL_CLASS],
      });
    } finally {
      this.isLoading = false;
    }
  }

  private getFirebaseErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests':
        'Too many failed attempts. Please try again later.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-credential':
        'Invalid email or password. Please check your credentials.',
      'auth/network-request-failed':
        'Network error. Please check your connection.',
    };

    return (
      errorMessages[errorCode] ||
      'An unexpected error occurred. Please try again.'
    );
  }
}
