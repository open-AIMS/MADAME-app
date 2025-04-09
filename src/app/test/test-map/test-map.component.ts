import { Component } from '@angular/core';
import { ReefMapComponent } from '../../reef-map/reef-map.component';
import { ResultSetService } from '../../contexts/result-set.service';

/**
 * Development component for focusing on map development.
 */
@Component({
  selector: 'app-test-map',
  imports: [ReefMapComponent],
  templateUrl: './test-map.component.html',
  styleUrl: './test-map.component.scss',
  providers: [ResultSetService],
})
export class TestMapComponent {
  constructor(private resultSetContext: ResultSetService) {
    resultSetContext.id =
      'Moore_2024-02-14_v060_rc1__RCPs_45__2024-06-04_14_31_45_209';
  }
}
