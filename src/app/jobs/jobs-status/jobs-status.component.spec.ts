import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsStatusComponent } from './jobs-status.component';

describe('JobsStatusComponent', () => {
  let component: JobsStatusComponent;
  let fixture: ComponentFixture<JobsStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobsStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
