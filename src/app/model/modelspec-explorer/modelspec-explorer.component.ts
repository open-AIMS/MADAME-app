import { Component, computed, input, Signal } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { DataFrame } from '../../../types/api.type';
import { TableComponent } from "../../table/table.component";
import { dataframeToTable, SimpleTable } from '../../../util/dataframe-util';
import { CoralData, ModelSpecField, pivotCoralRows } from '../../../util/modelspec-util';

type ModelspecTable = SimpleTable<ModelSpecField>;

@Component({
  selector: 'app-modelspec-explorer',
  standalone: true,
  imports: [MatTabsModule, MatTableModule, TableComponent],
  templateUrl: './modelspec-explorer.component.html',
  styleUrl: './modelspec-explorer.component.scss'
})
export class ModelspecExplorerComponent {
  data = input.required<DataFrame | null>();
  modelspecTable: Signal<ModelspecTable>;
  displayedColumns: Signal<Array<string>>;

  coralDataSource = new MatTableDataSource<CoralData>();
  coralColumns: Array<keyof CoralData> = ["name", "fecundity", "growth_rate",
    "mean_colony_diameter_m", "mb_rate", "dist_mean", "dist_std"];

  componentRows: Signal<Record<string, Array<ModelSpecField>>>;

  constructor() {
    this.modelspecTable = computed(() => {
      const data = this.data();
      if (data == null) {
        return { rows: [], columns: [] };
      }
      return dataframeToTable(data);
    });

    this.displayedColumns = computed(() => {
      const allColumns = this.modelspecTable().columns;
      const removeCols = new Set(['component', 'name', 'fieldname']);
      const cols = allColumns.filter(name => !removeCols.has(name));
      cols.unshift("name");
      return cols;
    });


    this.componentRows = computed(() => {
      const rows = this.modelspecTable().rows;
      if (rows.length === 0) {
        return {};
      }

      const componentGroups = Object.groupBy(rows, (row) => row.component);

      const coralRows = componentGroups['Coral'];
      if (coralRows) {
        this.coralDataSource.data = pivotCoralRows(coralRows);
      } else {
        console.warn("component=Coral missing!");
      }

      return componentGroups as Record<string, Array<ModelSpecField>>;
    });
  }
}
