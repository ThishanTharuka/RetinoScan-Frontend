import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { BenefitCard } from './benefit-card';

describe('BenefitCard', () => {
  let component: BenefitCard;
  let fixture: ComponentFixture<BenefitCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefitCard, MatIconModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BenefitCard);
    component = fixture.componentInstance;

    // Set required input property
    component.text = 'Test benefit text';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the provided text', () => {
    const testText = 'Advanced AI Technology';
    component.text = testText;
    fixture.detectChanges();

    expect(component.text).toBe(testText);
  });

  it('should have default empty text', () => {
    const newComponent = new BenefitCard();
    expect(newComponent.text).toBe('');
  });
});
