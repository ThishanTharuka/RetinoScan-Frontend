import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-benefit-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './benefit-card.html',
  styleUrls: ['./benefit-card.scss']
})
export class BenefitCard {
  @Input() text: string = '';
}
