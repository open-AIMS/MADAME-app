import { Component, computed, effect, input, Signal } from '@angular/core';
import { DataFrame } from '../../types/api.type';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

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
        if (data == null || data.columns.length === 0) {
          this.datasource.data = [];
          return;
        }

        // reformat into row objects
        const rows: Array<Record<string, any>> = [];
        const { columns, colindex } = data;
        const { lookup, names } = colindex;
        const numRows = data.columns[0].length;
        for (let i = 0; i < numRows; i++) {
          const row: Record<string, any> = {};
          for (let colname of names) {
            // lookup values are 1-based index
            row[colname] = columns[lookup[colname] - 1][i];
          }
          rows.push(row)
        }

        this.datasource.data = rows;
      })
    }
}
