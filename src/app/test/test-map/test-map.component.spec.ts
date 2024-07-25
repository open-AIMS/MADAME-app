import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestMapComponent } from './test-map.component';

describe('TestMapComponent', () => {
  let component: TestMapComponent;
  let fixture: ComponentFixture<TestMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
