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
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AuthService } from '../../core/services/auth.service';

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
    RouterModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
})
export class Login {
  private readonly authService = inject(AuthService);
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
      await this.authService.signIn({ email, password });
      this.snackBar.open('Login successful!', 'Close', {
        duration: SNACKBAR_DEFAULT_DURATION,
        panelClass: [SNACKBAR_SUCCESS_PANEL_CLASS],
      });
    } catch (error: unknown) {
      console.error('Login error', error);
      const errorMessage = this.authService.getErrorMessage(error);
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
      return;
    }

    this.isLoading = true;
    const { email, password } = this.registerForm.value;
    try {
      await this.authService.register({ email, password });
      this.snackBar.open('Registration successful!', 'Close', {
        duration: SNACKBAR_DEFAULT_DURATION,
        panelClass: [SNACKBAR_SUCCESS_PANEL_CLASS],
      });
      this.loginForm.reset();
      this.registerForm.reset();
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = this.authService.getErrorMessage(error);
      this.snackBar.open(errorMessage, 'Close', {
        duration: SNACKBAR_ERROR_DURATION,
        panelClass: [SNACKBAR_ERROR_PANEL_CLASS],
      });
    } finally {
      this.isLoading = false;
    }
  }
}
