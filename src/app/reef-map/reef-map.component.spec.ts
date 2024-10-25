import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReefMapComponent } from './reef-map.component';

describe('ReefMapComponent', () => {
  let component: ReefMapComponent;
  let fixture: ComponentFixture<ReefMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReefMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReefMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
