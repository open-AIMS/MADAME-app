import {Component, inject} from '@angular/core';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatListOption, MatSelectionList} from "@angular/material/list";
import {ALL_REGIONS, MAPS, ReefGuideConfigService} from "../reef-guide-config.service";
import {MatButton} from "@angular/material/button";

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
    MatButton
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

  constructor() {
    this.arcgisMap = new FormControl(this.config.arcgisMap());
    // TODO required if arcgisMap=CUSTOM
    this.mapItemId = new FormControl(this.config.customArcgisMapItemId());
    this.regions = new FormControl(this.config.enabledRegions());
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
      this.config.enabledRegions.set(this.regions.value);
    }

    this.dialogRef.close();
  }
}
