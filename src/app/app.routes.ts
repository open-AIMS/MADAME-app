import {Routes} from '@angular/router';
import {ModelRunListComponent} from './model-run-list/model-run-list.component';
import {ModelRunComponent} from './model-run/model-run.component';
import {TestMapComponent} from './test/test-map/test-map.component';
import {LocationSelectionComponent} from "./location-selection/location-selection.component";
import {SelectionCriteriaComponent} from "./location-selection/selection-criteria/selection-criteria.component";

export const routes: Routes = [
  {
    path: 'runs',
    component: ModelRunListComponent
  },
  {
    path: 'view-run/:id',
    component: ModelRunComponent
  },
  {
    path: 'location-selection',
    component: LocationSelectionComponent
  },
  // for now, redirect root to location-selection
  // TODO main nav design and routing
  {
    path: '',
    redirectTo: 'location-selection',
    pathMatch: 'full'
  },
  // Development
  // temporary routes used for development.
  {
    path: 'test-map',
    component: TestMapComponent
  }
];
