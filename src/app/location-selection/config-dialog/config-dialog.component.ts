import {Component, inject} from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListOption, MatSelectionList} from "@angular/material/list";
import {ALL_REGIONS, MAPS, ReefGuideConfigService} from "../reef-guide-config.service";
import {MatButton, MatIconAnchor, MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatTooltip} from "@angular/material/tooltip";
import {combineLatest, map, Observable, startWith} from "rxjs";
import {AsyncPipe} from "@angular/common";
import {MatCheckbox} from "@angular/material/checkbox";
import {MatTabsModule} from "@angular/material/tabs";


@Component({
  selector: 'app-config-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelect,
    MatOption,
    MatSelectionList,
    MatListOption,
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    MatIconAnchor,
    AsyncPipe,
    MatCheckbox,
    MatTabsModule
  ],
  templateUrl: './config-dialog.component.html',
  styleUrl: './config-dialog.component.scss'
})
export class ConfigDialogComponent {
  readonly config = inject(ReefGuideConfigService);
  readonly dialogRef = inject(MatDialogRef<ConfigDialogComponent>)

  mapChoices = MAPS;
  regionChoices = ALL_REGIONS;

  arcgisMap: FormControl;
  mapItemId: FormControl;
  regions: FormControl;
  parallelRegionRequests: FormControl;
  assessLayerTypes: FormControl;

  arcgisItemUrl: Observable<string | undefined>;

  constructor() {
    this.arcgisMap = new FormControl(this.config.arcgisMap());
    // TODO required if arcgisMap=CUSTOM
    this.mapItemId = new FormControl(this.config.customArcgisMapItemId());
    this.regions = new FormControl(this.config.enabledRegions());
    this.parallelRegionRequests = new FormControl(this.config.parallelRegionRequests());
    this.assessLayerTypes = new FormControl(this.config.assessLayerTypes());

    // determine ArcGIS item URL for the current selection.
    this.arcgisItemUrl = combineLatest([
      this.arcgisMap.valueChanges.pipe(startWith(this.arcgisMap.value)),
      this.mapItemId.valueChanges.pipe(startWith(this.mapItemId.value))
    ]).pipe(map(([mapId, customItemId]) => {
      let itemId: string;
      if (mapId === 'CUSTOM') {
        itemId = customItemId;
      } else {
        const map = MAPS.find(m => m.id === mapId);
        if (map === undefined) {
          return undefined;
        }
        itemId = map.arcgisItemId;
      }
      return `https://aimsgov.maps.arcgis.com/home/item.html?id=${itemId}`;
    }));
  }

  save() {
    const config = this.config;

    if (this.arcgisMap.dirty) {
      config.arcgisMap.set(this.arcgisMap.value);
    }

    if (this.mapItemId.dirty) {
      config.customArcgisMapItemId.set(this.mapItemId.value);
    }

    if (this.regions.dirty) {
      config.enabledRegions.set(this.regions.value);
    }

    if (this.parallelRegionRequests.dirty) {
      config.parallelRegionRequests.set(this.parallelRegionRequests.value);
    }

    if (this.assessLayerTypes.dirty) {
      config.assessLayerTypes.set(this.assessLayerTypes.value);
    }

    this.dialogRef.close();
  }
}
