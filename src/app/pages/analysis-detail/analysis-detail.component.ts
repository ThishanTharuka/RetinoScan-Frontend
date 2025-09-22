import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import {
  AnalysisService,
  AnalysisResult,
} from '../../core/services/analysis.service';
import { DashboardLayoutComponent } from '../../shared/components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-analysis-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatTooltipModule,
    MatMenuModule,
    DashboardLayoutComponent,
  ],
  templateUrl: './analysis-detail.component.html',
  styleUrls: ['./analysis-detail.component.scss'],
})
export class AnalysisDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly analysisService = inject(AnalysisService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  analysis = signal<AnalysisResult | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  analysisId = '';

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: any) => {
        this.analysisId = params['id'];
        if (this.analysisId) {
          this.loadAnalysisDetail();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnalysisDetail() {
    this.isLoading.set(true);
    this.error.set(null);

    this.analysisService
      .getAnalysis(this.analysisId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analysis: any) => {
          // Map originalImageUrl to retinaImageUrl for compatibility
          const enhancedAnalysis = {
            ...analysis,
            retinaImageUrl: analysis.originalImageUrl,
            fileName:
              analysis.prediction?.metadata?.file_name || 'retina-scan.jpg',
          };
          this.analysis.set(enhancedAnalysis);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load analysis detail:', err);
          this.error.set('Failed to load analysis details');
          this.isLoading.set(false);
          this.snackBar.open('Failed to load analysis details', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        },
      });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getConfidencePercentage(analysis: AnalysisResult): number {
    return Math.round((analysis.prediction?.confidence_score || 0) * 100);
  }

  // Helper: determine if two metric values are effectively equal (within 0.5%)
  metricsAreEqual(a?: number, b?: number): boolean {
    if (a === undefined || b === undefined) return false;
    const pa = Math.round((a || 0) * 1000) / 10; // one decimal as percent
    const pb = Math.round((b || 0) * 1000) / 10;
    return Math.abs(pa - pb) <= 0.5; // within half a percent
  }

  getUrgencyColor(urgencyLevel: string): string {
    if (urgencyLevel.includes('URGENT')) return 'warn';
    if (urgencyLevel.includes('MODERATE')) return 'accent';
    if (urgencyLevel.includes('MILD')) return 'primary';
    return 'primary';
  }

  downloadReport() {
    const analysis = this.analysis();
    if (!analysis) return;

    // Generate a simple text report (you can enhance this to PDF later)
    const reportContent = this.generateReportContent(analysis);
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retinal-analysis-${analysis.id}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Report downloaded successfully', 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  private generateReportContent(analysis: AnalysisResult): string {
    const lines = [
      '=== RETINAL ANALYSIS REPORT ===',
      '',
      `Patient: ${analysis.patientInfo?.name || 'N/A'}`,
      `Age: ${analysis.patientInfo?.age || 'N/A'}`,
      `Gender: ${analysis.patientInfo?.gender || 'N/A'}`,
      `Analysis Date: ${this.formatDate(analysis.uploadDate)}`,
      '',
      '=== ANALYSIS RESULTS ===',
    ];

    if (analysis.prediction) {
      lines.push(
        `Primary Diagnosis: ${analysis.prediction.primary_diagnosis}`,
        `Severity Level: ${analysis.prediction.severity_name}`,
        `Confidence: ${this.getConfidencePercentage(analysis)}%`,
        `Urgency: ${analysis.prediction.urgency_level}`,
        `Processing Time: ${analysis.prediction.processing_time?.toFixed(2)}s`,
        '',
        '=== DETAILED PREDICTIONS ===',
      );

      analysis.prediction.predictions.forEach((pred, index) => {
        lines.push(
          `${index + 1}. ${pred.condition}:`,
          `   Confidence: ${(pred.confidence * 100).toFixed(1)}%`,
          `   Probability: ${(pred.probability * 100).toFixed(1)}%`,
        );
      });

      if (analysis.prediction.recommendations?.length) {
        lines.push('', '=== RECOMMENDATIONS ===');
        analysis.prediction.recommendations.forEach((rec, index) => {
          lines.push(`${index + 1}. ${rec}`);
        });
      }

      if (analysis.prediction.metadata) {
        lines.push(
          '',
          '=== TECHNICAL DETAILS ===',
          `Model Version: ${analysis.prediction.metadata.model_version}`,
          `Model Architecture: ${analysis.prediction.metadata.model_architecture}`,
          `Preprocessing: ${analysis.prediction.metadata.preprocessing}`,
        );
      }
    }

    lines.push(
      '',
      '=== DISCLAIMER ===',
      'This analysis is generated by an AI system and should not replace',
      'professional medical diagnosis. Please consult with a qualified',
      'ophthalmologist for proper medical evaluation.',
      '',
      `Report generated on: ${new Date().toLocaleDateString('en-US')}`,
    );

    return lines.join('\n');
  }

  deleteAnalysis() {
    const analysis = this.analysis();
    if (!analysis) return;

    if (
      confirm(
        'Are you sure you want to delete this analysis? This action cannot be undone.',
      )
    ) {
      this.analysisService
        .deleteAnalysis(analysis.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Analysis deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['snackbar-success'],
            });
            this.router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            console.error('Failed to delete analysis:', err);
            this.snackBar.open('Failed to delete analysis', 'Close', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
          },
        });
    }
  }

  shareAnalysis() {
    // Implement sharing functionality
    this.snackBar.open('Sharing functionality coming soon', 'Close', {
      duration: 2000,
    });
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/placeholder-retina.svg';
    }
  }
}
