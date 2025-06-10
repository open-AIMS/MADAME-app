import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelRunComponent } from './model-run.component';

describe('ModelRunComponent', () => {
  let component: ModelRunComponent;
  let fixture: ComponentFixture<ModelRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelRunComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModelRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
