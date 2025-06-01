import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

const routes: Routes = [{ path: '', component: LandingComponent }];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    LandingComponent,
    NavbarComponent,
    FooterComponent,
  ],
})
export class LandingModule {}
