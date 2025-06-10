import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { AuthService } from '../../core/services/auth.service';

const SNACKBAR_SUCCESS_PANEL_CLASS = 'snackbar-success';
const SNACKBAR_ERROR_PANEL_CLASS = 'snackbar-error';
const SNACKBAR_WARNING_PANEL_CLASS = 'snackbar-warning';
const SNACKBAR_DEFAULT_DURATION = 3000;
const SNACKBAR_ERROR_DURATION = 5000;

@Component({
  selector: 'app-forgot-password',
  imports: [
    NavbarComponent,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    CommonModule,
    MatSnackBarModule,
    LottieComponent,
    MatIconModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  standalone: true,
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);
  private readonly fb: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);

  forgotPasswordForm: FormGroup;
  isLoading: boolean = false;
  emailSent: boolean = false;

  loadingAnimationOptions: AnimationOptions = {
    path: '/assets/animations/loading-spinner.json',
    loop: true,
    autoplay: true,
  };

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async handleForgotPassword() {
    if (this.forgotPasswordForm.invalid) {
      this.snackBar.open('Please enter a valid email address.', 'Close', {
        duration: SNACKBAR_DEFAULT_DURATION,
        panelClass: [SNACKBAR_WARNING_PANEL_CLASS],
      });
      return;
    }

    this.isLoading = true;
    const { email } = this.forgotPasswordForm.value;
    try {
      await this.authService.resetPassword(email);
      this.emailSent = true;
      this.snackBar.open(
        'Password reset email sent! Please check your inbox.',
        'Close',
        {
          duration: SNACKBAR_DEFAULT_DURATION,
          panelClass: [SNACKBAR_SUCCESS_PANEL_CLASS],
        },
      );
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      const errorMessage = this.authService.getErrorMessage(error);
      this.snackBar.open(errorMessage, 'Close', {
        duration: SNACKBAR_ERROR_DURATION,
        panelClass: [SNACKBAR_ERROR_PANEL_CLASS],
      });
    } finally {
      this.isLoading = false;
    }
  }
  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  resendEmail() {
    this.emailSent = false;
    this.handleForgotPassword();
  }
}
