import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelRunListItemComponent } from './model-run-list-item.component';

describe('ModelRunListItemComponent', () => {
  let component: ModelRunListItemComponent;
  let fixture: ComponentFixture<ModelRunListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelRunListItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelRunListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
