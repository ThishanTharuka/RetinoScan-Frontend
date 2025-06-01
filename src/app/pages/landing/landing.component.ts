import { Component } from '@angular/core';
import { AnimationOptions, LottieComponent } from 'ngx-lottie'; // Changed import to LottieComponent
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  imports: [NavbarComponent, FooterComponent, LottieComponent],
})
export class LandingComponent {
  options: AnimationOptions = {
    path: '/assets/animations/retina-scan.json',
    loop: true,
    autoplay: true,
  };
}
