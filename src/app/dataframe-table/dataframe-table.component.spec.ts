import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataframeTableComponent } from './dataframe-table.component';

describe('DataframeTableComponent', () => {
  let component: DataframeTableComponent;
  let fixture: ComponentFixture<DataframeTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataframeTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataframeTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
