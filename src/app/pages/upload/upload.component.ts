import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

import { DashboardLayoutComponent } from '../../shared/components/dashboard-layout/dashboard-layout.component';
import { AnalysisService } from '../../core/services/analysis.service';

export interface PatientInfo {
  patientName: string;
  patientId: string;
  dateOfBirth: Date | null;
  age: number;
  gender: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatIconModule,
    MatExpansionModule,
    // Dashboard Layout
    DashboardLayoutComponent,
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent implements OnInit {
  // Single form for patient info and image upload
  uploadForm!: FormGroup;

  // File handling
  selectedFiles = signal<File[]>([]);
  isUploading = signal<boolean>(false);

  // Options for dropdowns
  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private analysisService: AnalysisService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.initializeForms();
  }
  ngOnInit() {
    // Subscribe to date of birth changes to calculate age
    this.uploadForm.get('dateOfBirth')?.valueChanges.subscribe((date: Date) => {
      if (date) {
        const age = this.calculateAge(date);
        this.uploadForm.patchValue({ age }, { emitEvent: false });
      }
    });
  }

  private initializeForms() {
    this.uploadForm = this.formBuilder.group({
      patientName: ['', [Validators.required, Validators.minLength(2)]],
      patientId: ['', [Validators.required, Validators.minLength(3)]],
      dateOfBirth: [null, Validators.required],
      age: [{ value: '', disabled: true }],
      gender: ['', Validators.required],
      image: [null, Validators.required],
    });
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // File handling with native input
  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Please select a valid image file.', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.snackBar.open('File size must be less than 10MB.', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        return;
      }

      // For single file upload, replace the existing file
      this.selectedFiles.set([file]);

      // Update form control and mark as valid
      const imageControl = this.uploadForm.get('image');
      if (imageControl) {
        imageControl.setValue(file);
        imageControl.markAsTouched();
        imageControl.updateValueAndValidity();
      }

      this.snackBar.open(`${file.name} selected successfully.`, 'Close', {
        duration: 2000,
        panelClass: ['snackbar-success'],
      });
    }
  }
  removeFile(index: number) {
    const files = this.selectedFiles();
    files.splice(index, 1);
    this.selectedFiles.set([...files]);

    // Update form control
    const imageControl = this.uploadForm.get('image');
    if (files.length === 0) {
      if (imageControl) {
        imageControl.setValue(null);
        imageControl.markAsTouched();
        imageControl.updateValueAndValidity();
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  // Form validation helpers
  isFormValid(): boolean {
    return this.uploadForm.valid && this.selectedFiles().length > 0;
  }

  getFormData(): PatientInfo {
    // Include disabled controls (age) in the returned data
    return this.uploadForm.getRawValue() as PatientInfo;
  }
  // Submit the complete analysis request
  async submitAnalysis() {
    if (!this.selectedFiles().length) {
      this.snackBar.open('Please select an image file', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    this.isUploading.set(true);

    // Gather patient data and file
    const patientData = this.getFormData();
    const file = this.selectedFiles()[0];

    try {
      // Send to Backend (which will handle Model API, Cloudinary, and Database)
      const result = await new Promise<any>((resolve, reject) => {
        this.analysisService
          .uploadForAnalysis(file, {
            patientId: patientData.patientId,
            age: patientData.age,
            gender: patientData.gender,
            medicalHistory: `Patient Name: ${patientData.patientName}, DOB: ${patientData.dateOfBirth?.toDateString()}`,
          })
          .subscribe({
            next: (analysisResult) => {
              console.log('Backend Analysis Result:', analysisResult);
              resolve(analysisResult);
            },
            error: (err) => {
              console.error('Backend analysis error:', err);

              // Show specific error message based on error type
              let errorMessage = 'Analysis failed';

              if (err.status === 0) {
                errorMessage =
                  'Cannot connect to server. Please check your connection.';
              } else if (err.status === 400) {
                errorMessage = `Invalid request: ${err.error?.message || 'Bad request'}`;
              } else if (err.status === 503) {
                errorMessage =
                  'Model API is not available. Please try again later.';
              } else if (err.error?.message) {
                errorMessage = `Server error: ${err.error.message}`;
              } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
              }

              this.snackBar.open(errorMessage, 'Close', {
                duration: 5000,
                panelClass: ['snackbar-error'],
              });
              reject(new Error(errorMessage));
            },
          });
      });

      // Extract prediction data from the backend response
      const prediction = result.prediction;
      if (!prediction) {
        throw new Error('No prediction data received');
      }

      const confidence = Math.round((prediction.confidence_score || 0) * 100);
      const severityLevel = prediction.severity_level || 0;
      const severityName = prediction.severity_name || 'Unknown';
      const urgencyLevel = prediction.urgency_level || '✅ NORMAL';

      // Show success message with prediction results
      const snackbarClass = this.getSnackbarClass(severityLevel);

      this.snackBar.open(
        `${urgencyLevel} - ${severityName} (${confidence}% confidence)`,
        'Close',
        {
          duration: 10000,
          panelClass: snackbarClass,
        },
      );

      console.log('Complete analysis result:', result);

      // Navigate to the newly created analysis detail page after showing results
      // Use the result.id from the backend AnalysisResult to open the analysis page
      const analysisId = result?.id || result?.analysis?.id;
      if (analysisId) {
        // Keep the uploading overlay until navigation completes
        try {
          await this.router.navigate(['/analysis', analysisId]);
        } catch (navErr) {
          console.error('Navigation to analysis detail failed:', navErr);
        }
      } else {
        // Fallback to dashboard if no id is present
        try {
          await this.router.navigate(['/dashboard']);
        } catch (navErr) {
          console.error('Navigation to dashboard failed:', navErr);
        }
      }
    } catch (error: any) {
      console.error('Analysis submission error:', error);
      // Error messages already shown in individual catch blocks
    } finally {
      this.isUploading.set(false);
    }
  }

  // Method to reset the entire form
  resetForm() {
    this.uploadForm.reset();
    this.selectedFiles.set([]);
  }

  // Helper method to determine urgency level
  private getUrgencyLevel(severityLevel: number): string {
    if (severityLevel >= 3) return '🚨 URGENT';
    if (severityLevel >= 2) return '⚠️ MODERATE';
    if (severityLevel >= 1) return '💛 MILD';
    return '✅ NORMAL';
  }

  // Helper method to get snackbar CSS class
  private getSnackbarClass(severityLevel: number): string[] {
    if (severityLevel >= 3) return ['snackbar-error'];
    if (severityLevel >= 1) return ['snackbar-warning'];
    return ['snackbar-success'];
  }

  // Helper method to get recommendations based on severity
  private getRecommendations(severityLevel: number): string[] {
    switch (severityLevel) {
      case 0:
        return ['Continue regular eye exams', 'Maintain healthy lifestyle'];
      case 1:
        return [
          'Schedule follow-up in 6-12 months',
          'Monitor blood sugar levels',
          'Consider lifestyle modifications',
        ];
      case 2:
        return [
          'Schedule follow-up in 3-6 months',
          'Consult with ophthalmologist',
          'Optimize diabetes management',
        ];
      case 3:
        return [
          'Urgent ophthalmologist referral required',
          'Consider laser treatment',
          'Intensive diabetes management',
        ];
      case 4:
        return [
          'IMMEDIATE ophthalmologist consultation',
          'May require surgery',
          'Emergency diabetes management',
        ];
      default:
        return ['Consult with healthcare provider'];
    }
  }
}
