import { AfterViewInit, Component, effect, input, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [MatTableModule, MatSortModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements AfterViewInit {

  data = input<Array<any>>();

  displayedColumns = input<Array<string>>();

  dataSource = new MatTableDataSource();

  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      const data = this.data();
      this.dataSource.data = data ?? [];
    })
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
}
