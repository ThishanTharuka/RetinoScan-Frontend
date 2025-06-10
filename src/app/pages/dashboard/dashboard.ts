import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, AuthUser } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  currentUser: AuthUser | null = null;
  isLoading = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  async handleSignOut() {
    this.isLoading = true;
    try {
      await this.authService.signOut();
      this.snackBar.open('Signed out successfully', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-success'],
      });
    } catch (error) {
      console.error('Sign out error:', error);
      this.snackBar.open('Error signing out. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    } finally {
      this.isLoading = false;
    }
  }
  getDisplayName(): string {
    if (this.currentUser?.displayName) {
      return this.currentUser.displayName;
    }
    return this.currentUser?.email?.split('@')[0] || 'User';
  }
}
