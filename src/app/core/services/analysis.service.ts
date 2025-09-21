import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface PatientInfo {
  patientId: string;
  age: number;
  gender: string;
  medicalHistory?: string;
}

// FastAPI Model API Response Interface
export interface FastAPIResponse {
  status: string;
  patient_id: string;
  patient_name: string;
  predictions: Array<{
    condition: string;
    confidence: number;
    probability: number;
  }>;
  primary_diagnosis: string;
  confidence_score: number;
  processing_time: number;
  timestamp: string;
  metadata?: {
    model_version: string;
    model_architecture: string;
    preprocessing: string;
    image_size?: number[];
    file_name?: string;
    file_size?: number;
  };
}

export interface AnalysisResult {
  id: string;
  userId: string;
  originalImageUrl: string;
  analyzedImageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  patientInfo?: {
    name: string;
    age?: number;
    gender?: string;
    notes?: string;
  };
  prediction?: {
    severity: 'mild' | 'moderate' | 'severe';
    confidence: number;
    affectedAreas?: Array<{
      x: number;
      y: number;
      radius: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    processingTime?: number;
  };
  uploadDate: string;
  analysisDate?: string;
  errorMessage?: string;
}

export interface CreateAnalysisDto {
  patientInfo: PatientInfo;
}

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private readonly apiUrl = `${environment.apiUrl}/analysis`;
  private readonly fastApiUrl = 'http://localhost:8001/api/v1'; // Your FastAPI Model API

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.getIdToken()).pipe(
      map(
        (token) =>
          new HttpHeaders({
            Authorization: `Bearer ${token}`,
          }),
      ),
    );
  }

  /**
   * Send image directly to FastAPI Model API for prediction
   */
  uploadToFastAPI(
    file: File,
    patientInfo: PatientInfo,
  ): Observable<FastAPIResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientInfo.patientId);
    formData.append('patient_name', patientInfo.patientId); // Using patientId as name

    // Call FastAPI directly (no auth needed for model API)
    return this.http.post<FastAPIResponse>(
      `${this.fastApiUrl}/predict/upload`,
      formData,
    );
  }

  /**
   * Get FastAPI model information
   */
  getFastAPIModelInfo(): Observable<any> {
    return this.http.get(`${this.fastApiUrl}/model/info`);
  }

  /**
   * Check FastAPI health
   */
  checkFastAPIHealth(): Observable<any> {
    return this.http.get(`${this.fastApiUrl}/health`);
  }

  /**
   * Upload retinal image for analysis (Original NestJS backend)
   */
  uploadForAnalysis(
    file: File,
    patientInfo: PatientInfo,
  ): Observable<AnalysisResult> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientName', patientInfo.patientId); // Using patientId as name for now

    // Ensure age is a valid number
    const age = Number(patientInfo.age);
    if (isNaN(age) || age <= 0) {
      throw new Error('Invalid age provided');
    }
    formData.append('patientAge', age.toString());
    formData.append('patientGender', patientInfo.gender);

    if (patientInfo.medicalHistory) {
      formData.append('patientNotes', patientInfo.medicalHistory);
    }

    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<AnalysisResult>(`${this.apiUrl}/upload`, formData, {
          headers,
        }),
      ),
    );
  }

  /**
   * Get all analyses for the current user
   */
  getAnalyses(): Observable<AnalysisResult[]> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<AnalysisResult[]>(this.apiUrl, { headers }),
      ),
    );
  }

  /**
   * Get specific analysis by ID
   */
  getAnalysis(id: string): Observable<AnalysisResult> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<AnalysisResult>(`${this.apiUrl}/${id}`, { headers }),
      ),
    );
  }

  /**
   * Delete analysis by ID
   */
  deleteAnalysis(id: string): Observable<void> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }),
      ),
    );
  }
}
