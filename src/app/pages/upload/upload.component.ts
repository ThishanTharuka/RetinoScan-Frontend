import { Component, OnInit, signal, ViewChild } from '@angular/core';
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
      patientId: patientData.patientName,
      age: patientData.age,
      gender: patientData.gender,
      medicalHistory: `Patient ID: ${patientData.patientId}, DOB: ${patientData.dateOfBirth?.toDateString()}`,
    };
    let upload$;
    // Handle synchronous errors (e.g., invalid age)
    try {
      upload$ = this.analysisService.uploadForAnalysis(file, submissionData);
    } catch (syncError: any) {
      console.error('Synchronous upload error:', syncError);
      this.snackBar.open(syncError.message || 'Upload failed', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      this.isUploading.set(false);
      return;
    }
    try {
      await new Promise((resolve, reject) => {
        upload$.subscribe({
          next: (result) => {
            this.snackBar.open('Analysis submitted successfully!', 'Close', {
              duration: 5000,
              panelClass: ['snackbar-success'],
            });
            setTimeout(() => this.router.navigate(['/dashboard']), 2000);
            resolve(result);
          },
          error: (err: any) => {
            console.error('Upload error:', err);
            const message =
              err?.error?.message || err.message || 'Upload failed';
            this.snackBar.open(message, 'Close', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
            reject(err);
          },
        });
      });
    } catch (error: any) {
      console.error('Submit error:', error);
      // Already shown detailed error above
    } finally {
      this.isUploading.set(false);
    }
  }

  // Method to reset the entire form
  resetForm() {
    this.uploadForm.reset();
    this.selectedFiles.set([]);
  }
}
