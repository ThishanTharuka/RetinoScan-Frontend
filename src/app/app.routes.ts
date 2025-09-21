import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/landing/landing.module').then((m) => m.LandingModule),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword,
      ),
    canActivate: [NoAuthGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [AuthGuard],
  },
  {
    path: 'upload',
    loadComponent: () =>
      import('./pages/upload/upload.component').then((m) => m.UploadComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'analysis/:id',
    loadComponent: () =>
      import('./pages/analysis-detail/analysis-detail.component').then(
        (m) => m.AnalysisDetailComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
