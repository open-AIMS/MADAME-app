import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSliderComponent } from './time-slider.component';

describe('TimeSliderComponent', () => {
  let component: TimeSliderComponent;
  let fixture: ComponentFixture<TimeSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSliderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
