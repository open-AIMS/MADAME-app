import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelspecExplorerComponent } from './modelspec-explorer.component';

describe('ModelspecExplorerComponent', () => {
  let component: ModelspecExplorerComponent;
  let fixture: ComponentFixture<ModelspecExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelspecExplorerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelspecExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
