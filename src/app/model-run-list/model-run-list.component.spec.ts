import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelRunListComponent } from './model-run-list.component';

describe('ModelRunListComponent', () => {
  let component: ModelRunListComponent;
  let fixture: ComponentFixture<ModelRunListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelRunListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModelRunListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
