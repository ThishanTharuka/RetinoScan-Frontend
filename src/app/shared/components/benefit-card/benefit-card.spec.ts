import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BenefitCard } from './benefit-card';

describe('BenefitCard', () => {
  let component: BenefitCard;
  let fixture: ComponentFixture<BenefitCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefitCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BenefitCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
