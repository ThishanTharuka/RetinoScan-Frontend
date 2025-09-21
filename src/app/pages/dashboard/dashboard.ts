import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

import { AuthService, AuthUser } from '../../core/services/auth.service';
import {
  AnalysisService,
  AnalysisResult,
} from '../../core/services/analysis.service';
import { DashboardLayoutComponent } from '../../shared/components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    DashboardLayoutComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly analysisService = inject(AnalysisService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  currentUser: AuthUser | null = null;
  analyses = signal<AnalysisResult[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  searchTerm = '';
  filteredAnalyses = signal<AnalysisResult[]>([]);

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.loadAnalyses();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDisplayName(): string {
    if (this.currentUser?.displayName) {
      return this.currentUser.displayName;
    }
    const emailLocalPart = this.currentUser?.email?.split('@')[0]?.trim();
    return emailLocalPart && emailLocalPart.length > 0
      ? emailLocalPart
      : 'User';
  }

  loadAnalyses() {
    this.isLoading.set(true);
    this.error.set(null);

    this.analysisService
      .getAnalyses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analyses) => {
          this.analyses.set(analyses);
          this.filterAnalyses();
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load analyses:', err);
          this.error.set('Failed to load analysis history');
          this.isLoading.set(false);
          this.snackBar.open('Failed to load analysis history', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        },
      });
  }

  getSeverityClass(severityLevel?: number): string {
    if (severityLevel === undefined || severityLevel === null)
      return 'severity-unknown';
    if (severityLevel >= 3) return 'severity-urgent';
    if (severityLevel >= 2) return 'severity-moderate';
    if (severityLevel >= 1) return 'severity-mild';
    return 'severity-normal';
  }

  getSeverityIcon(severityLevel?: number): string {
    if (severityLevel === undefined || severityLevel === null) return 'help';
    if (severityLevel >= 3) return 'error';
    if (severityLevel >= 2) return 'warning';
    if (severityLevel >= 1) return 'info';
    return 'check_circle';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'processing':
        return 'hourglass_empty';
      case 'failed':
        return 'error';
      case 'pending':
        return 'schedule';
      default:
        return 'help';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'processing':
        return 'status-processing';
      case 'failed':
        return 'status-failed';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-unknown';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getConfidencePercentage(analysis: AnalysisResult): number {
    return Math.round((analysis.prediction?.confidence_score || 0) * 100);
  }

  deleteAnalysis(analysisId: string, event: Event) {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this analysis?')) {
      this.analysisService
        .deleteAnalysis(analysisId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.analyses.update((analyses) =>
              analyses.filter((a) => a.id !== analysisId),
            );
            this.filterAnalyses(); // Update filtered results
            this.snackBar.open('Analysis deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
          },
          error: (err) => {
            console.error('Failed to delete analysis:', err);
            this.snackBar.open('Failed to delete analysis', 'Close', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          },
        });
    }
  }

  viewAnalysisDetails(analysis: AnalysisResult) {
    this.router.navigate(['/analysis', analysis.id]);
  }

  refreshAnalyses() {
    this.loadAnalyses();
  }

  navigateToUpload() {
    this.router.navigate(['/upload']);
  }

  // Search functionality
  onSearchChange() {
    this.filterAnalyses();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterAnalyses();
  }

  filterAnalyses() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredAnalyses.set(this.analyses());
      return;
    }

    const filtered = this.analyses().filter((analysis) => {
      // Search by date
      const dateMatch =
        this.formatDate(analysis.uploadDate).toLowerCase().includes(term) ||
        this.formatDateShort(analysis.uploadDate).toLowerCase().includes(term);

      // Search by severity
      const severityMatch =
        analysis.prediction?.severity_name?.toLowerCase().includes(term) ||
        this.getSeverityDisplayName(analysis.prediction?.severity_level)
          .toLowerCase()
          .includes(term);

      // Search by patient name
      const patientMatch = analysis.patientInfo?.name
        ?.toLowerCase()
        .includes(term);

      // Search by status
      const statusMatch = analysis.status.toLowerCase().includes(term);

      return dateMatch || severityMatch || patientMatch || statusMatch;
    });

    this.filteredAnalyses.set(filtered);
  }

  // Date formatting methods
  formatDateShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatTimeShort(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Severity display methods
  getSeverityDisplayName(severityLevel?: number): string {
    if (severityLevel === undefined || severityLevel === null) return 'Unknown';
    switch (severityLevel) {
      case 0:
        return 'Normal';
      case 1:
        return 'Mild';
      case 2:
        return 'Moderate';
      case 3:
        return 'Severe';
      case 4:
        return 'Severe';
      default:
        return 'Unknown';
    }
  }

  // Image error handling
  onImageError(event: any) {
    event.target.src = 'assets/placeholder-retina.svg'; // Use SVG placeholder
    event.target.alt = 'Image not available';
  }

  // Download report functionality
  downloadReport(analysis: AnalysisResult) {
    // Implement report download functionality
    this.snackBar.open('Download functionality coming soon', 'Close', {
      duration: 2000,
    });
  }
}
