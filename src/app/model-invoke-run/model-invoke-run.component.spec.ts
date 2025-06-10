import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelInvokeRunComponent } from './model-invoke-run.component';

describe('ModelInvokeRunComponent', () => {
  let component: ModelInvokeRunComponent;
  let fixture: ComponentFixture<ModelInvokeRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelInvokeRunComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModelInvokeRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
