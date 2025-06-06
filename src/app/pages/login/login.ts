import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-login',
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {}
