import { Routes } from '@angular/router';
import { ModelRunListComponent } from './model-run-list/model-run-list.component';
import { ModelRunComponent } from './model-run/model-run.component';
import { TestMapComponent } from './test/test-map/test-map.component';
import { LocationSelectionComponent } from './location-selection/location-selection.component';

export const routes: Routes = [
  {
    path: 'runs',
    component: ModelRunListComponent,
    title: 'MADAME - Model Runs',
  },
  {
    path: 'view-run/:id',
    component: ModelRunComponent,
    title: 'MADAME - View Run',
  },
  {
    path: 'reef-guide',
    component: LocationSelectionComponent,
    title: 'Reef Guide',
  },
  // for now, redirect root to location-selection
  // TODO main nav design and routing
  {
    path: '',
    redirectTo: 'reef-guide',
    pathMatch: 'full',
  },
  // Development
  // temporary routes used for development.
  {
    path: 'test-map',
    component: TestMapComponent,
    title: 'Test Map',
  },
];
