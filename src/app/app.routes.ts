import { Routes } from '@angular/router';
import { ModelRunListComponent } from './model-run-list/model-run-list.component';
import { ModelRunComponent } from './model-run/model-run.component';

export const routes: Routes = [
    {
        path: 'runs',
        component: ModelRunListComponent
    },
    {
        path: 'view-run/:id',
        component: ModelRunComponent
    }
];
