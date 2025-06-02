import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { MatIconModule } from '@angular/material/icon';
import { BenefitCard } from '../../shared/components/benefit-card/benefit-card';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    LottieComponent,
    MatIconModule,
    BenefitCard,
  ],
  standalone: true,
})
export class LandingComponent implements OnInit {
  options: AnimationOptions = {
    path: '/assets/animations/retina-scan.json',
    loop: true,
    autoplay: true,
  };

  benefits: string[] = [
    'Fast, accurate, and easy to use',
    'Clinically validated AI',
    'Secure and private',
    'Designed for low-resource settings',
  ];

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
