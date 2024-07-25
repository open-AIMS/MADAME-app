import { Routes } from '@angular/router';
import { ModelRunListComponent } from './model-run-list/model-run-list.component';
import { ModelRunComponent } from './model-run/model-run.component';
import { TestMapComponent } from './test/test-map/test-map.component';

export const routes: Routes = [
    {
        path: 'runs',
        component: ModelRunListComponent
    },
    {
        path: 'view-run/:id',
        component: ModelRunComponent
    },
    // Development
    // temporary routes used for development.
    {
        path: 'test-map',
        component: TestMapComponent
    }
];
