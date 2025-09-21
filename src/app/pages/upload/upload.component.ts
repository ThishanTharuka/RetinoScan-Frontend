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

    const submissionData = {
      patientId: patientData.patientId,
      age: patientData.age,
      gender: patientData.gender,
      medicalHistory: `Patient Name: ${patientData.patientName}, DOB: ${patientData.dateOfBirth?.toDateString()}`,
    };

    try {
      // First check if FastAPI is running
      await new Promise<any>((resolve, reject) => {
        this.analysisService.checkFastAPIHealth().subscribe({
          next: (health) => {
            console.log('FastAPI Health:', health);
            resolve(health);
          },
          error: (err) => {
            console.error('FastAPI not available:', err);
            this.snackBar.open(
              'Model API is not available. Please ensure the model server is running.',
              'Close',
              {
                duration: 5000,
                panelClass: ['snackbar-error'],
              },
            );
            reject(new Error('FastAPI not available'));
          },
        });
      });

      // Send to FastAPI for prediction
      const prediction = await new Promise<any>((resolve, reject) => {
        this.analysisService.uploadToFastAPI(file, submissionData).subscribe({
          next: (result) => {
            console.log('FastAPI Prediction Result:', result);
            resolve(result);
          },
          error: (err) => {
            console.error('FastAPI prediction error:', err);

            // Show specific error message based on error type
            let errorMessage = 'Prediction failed';

            if (err.status === 0) {
              errorMessage =
                'Cannot connect to model server. Please ensure it is running on port 8001.';
            } else if (err.status === 400) {
              errorMessage = `Invalid request: ${err.error?.detail || 'Bad request'}`;
            } else if (err.status === 503) {
              errorMessage =
                'Model is not loaded. Please wait for the server to initialize.';
            } else if (err.error?.detail) {
              errorMessage = `Server error: ${err.error.detail}`;
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

      // Show success message with prediction results
      const primaryDiagnosis = prediction.primary_diagnosis || 'No diagnosis';
      const confidence = Math.round((prediction.confidence_score || 0) * 100);

      // Map diabetic retinopathy levels to user-friendly names
      const severityMap: { [key: number]: string } = {
        0: 'No Diabetic Retinopathy',
        1: 'Mild Diabetic Retinopathy',
        2: 'Moderate Diabetic Retinopathy',
        3: 'Severe Diabetic Retinopathy',
        4: 'Proliferative Diabetic Retinopathy',
      };

      // Determine severity level based on predictions with detailed condition names
      let severityLevel = 0;
      let maxConfidence = 0;

      // Create a mapping from detailed condition names to severity levels
      const conditionToSeverity: { [key: string]: number } = {
        'No Diabetic Retinopathy': 0,
        'Mild Diabetic Retinopathy': 1,
        'Moderate Diabetic Retinopathy': 2,
        'Severe Diabetic Retinopathy': 3,
        'Proliferative Diabetic Retinopathy': 4,
      };

      prediction.predictions?.forEach((pred: any) => {
        if (pred.confidence > maxConfidence) {
          maxConfidence = pred.confidence;
          severityLevel = conditionToSeverity[pred.condition] || 0;
        }
      });

      const severityName = severityMap[severityLevel] || primaryDiagnosis;
      const urgencyLevel = this.getUrgencyLevel(severityLevel);
      const snackbarClass = this.getSnackbarClass(severityLevel);

      this.snackBar.open(
        `${urgencyLevel} - ${severityName} (${confidence}% confidence)`,
        'Close',
        {
          duration: 10000,
          panelClass: snackbarClass,
        },
      );

      // Store detailed result for dashboard display
      const detailedResult = {
        ...prediction,
        severity_level: severityLevel,
        severity_name: severityName,
        urgency_level: urgencyLevel,
        recommendations: this.getRecommendations(severityLevel),
      };

      console.log('Detailed prediction result:', detailedResult);

      // Navigate to dashboard after showing results
      setTimeout(() => this.router.navigate(['/dashboard']), 3000);
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
