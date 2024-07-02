import { Component } from '@angular/core';
import { ModelRunListItemComponent } from "../model-run-list-item/model-run-list-item.component";
import { MODEL_RUNS } from '../../mock-data/model-runs.mockdata';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-model-run-list',
    standalone: true,
    templateUrl: './model-run-list.component.html',
    styleUrl: './model-run-list.component.scss',
    imports: [ModelRunListItemComponent, MatCardModule, MatButtonModule, MatRippleModule, MatIconModule, RouterLink]
})
export class ModelRunListComponent {

    runs = MODEL_RUNS;

}
