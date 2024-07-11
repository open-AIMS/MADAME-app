import { Component, computed, effect, input, Signal } from '@angular/core';
import { DataFrame } from '../../types/api.type';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { dataframeToRowObjects } from '../../util/dataframe-util';

/**
 * Table view of Julia DataFrame data.
 */
@Component({
  selector: 'app-dataframe-table',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './dataframe-table.component.html',
  styleUrl: './dataframe-table.component.scss'
})
export class DataframeTableComponent {

  data = input<DataFrame | null | undefined>()

  displayedColumns: Signal<Array<string>>;

  datasource = new MatTableDataSource();

  constructor() {
    this.displayedColumns = computed(() => {
      // all columns
      return this.data()?.colindex.names ?? [];
    })

    effect(() => {
      const data = this.data();
      this.datasource.data = dataframeToRowObjects(data);
    })
  }
}
