import { Component, effect, input } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { DataFrame } from '../../../types/api.type';
import { DataframeTableComponent } from "../../dataframe-table/dataframe-table.component";
import { dataframeToRowObjects } from '../../../util/dataframe-util';
import { CoralData, pivotCoralRows } from '../../../util/modelspec-util';


@Component({
  selector: 'app-modelspec-explorer',
  standalone: true,
  imports: [MatTabsModule, MatTableModule, DataframeTableComponent],
  templateUrl: './modelspec-explorer.component.html',
  styleUrl: './modelspec-explorer.component.scss'
})
export class ModelspecExplorerComponent {
  data = input.required<DataFrame | null>();

  coralDataSource = new MatTableDataSource<CoralData>();
  coralColumns: Array<keyof CoralData> = ["name", "fecundity", "growth_rate",
    "mean_colony_diameter_m", "mb_rate", "dist_mean", "dist_std"];

  constructor() {

    effect(() => {
      const data = this.data();
      if (data == null) {
        this.coralDataSource.data = [];
        return;
      }


      const { columns, colindex } = data;
      const { lookup, names } = colindex;

      const componentCol = columns[lookup["component"] - 1];

      const coralIndexes: Array<number> = [];
      componentCol.forEach((val, idx) => {
        // component == 'Coral'
        if (val === 'Coral') {
          coralIndexes.push(idx);
        }
      })

      const coralRows = dataframeToRowObjects(data, coralIndexes);

      this.coralDataSource.data = pivotCoralRows(coralRows);
    });
  }
}
