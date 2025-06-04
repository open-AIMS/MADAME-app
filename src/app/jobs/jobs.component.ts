import { Component, inject, ViewChild } from '@angular/core';
import { WebApiService } from '../../api/web-api.service';
import { Observable } from 'rxjs';
import { ListJobsResponse } from '../../api/web-api.types';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-jobs',
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatToolbarModule
  ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss'
})
export class JobsComponent {

  api = inject(WebApiService);
  jobs$: Observable<ListJobsResponse>;

  dataSource = new MatTableDataSource()
  displayedColumns: string[] = ['actions', 'id', 'type', 'status', 'created_at', 'updated_at', 'input_payload'];

  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.jobs$ = this.api.listJobs();

    this.jobs$.subscribe(resp => {
      this.dataSource.data = resp.jobs;
    })
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  downloadResults(jobId: number) {
    this.api.downloadJobResults(jobId).subscribe(x => {
      console.info(`Job ${jobId} download results`, x);
    });
  }

  viewDetails(jobId: number) {
    this.api.getJob(jobId).subscribe(x => {
      console.info(`Job id=${jobId} details`, x);
    })
  }

}
