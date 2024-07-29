import { Component, ViewChild } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';
import { ArcgisMap, ComponentLibraryModule } from '@arcgis/map-components-angular';
import Field from '@arcgis/core/layers/support/Field';
import { cloneFeatureLayerAsLocal, cloneRendererChangedField, updateLayerFeatureAttributes } from '../../util/arcgis/arcgis-layer-util';
import { BehaviorSubject, firstValueFrom, Subject, switchMap, tap } from 'rxjs';
import { experimentSimpleGraphicsLayer } from '../../util/arcgis/arcgis-layer-experiments';
import { ApiService } from '../api.service';
import { ResultSetService } from '../contexts/result-set.service';
import { dataframeFind } from '../../util/dataframe-util';
import { MatSliderModule } from '@angular/material/slider';
import { DataFrame } from '../../types/api.type';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reef-map',
  standalone: true,
  imports: [ComponentLibraryModule, MatSliderModule, MatProgressSpinnerModule, CommonModule],
  templateUrl: './reef-map.component.html',
  styleUrl: './reef-map.component.scss'
})
export class ReefMapComponent {

  // mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';
  // "MADAME App - Testing" map
  mapItemId = '43ef538d8be7412783eb7c5cfd3fdbe7';

  // year timestep
  timestep: number = -9999;
  timestep$ = new Subject<number>();
  timestepLoading$ = new BehaviorSubject<boolean>(false);

  @ViewChild(ArcgisMap) map!: ArcgisMap;

  private cloned = false;
  private reefLayer?: FeatureLayer;

  constructor(private api: ApiService, private resultSetContext: ResultSetService) {
  }

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready", this.map);
    const map = this.map;

    const simpleLayer = experimentSimpleGraphicsLayer();
    map.addLayer(simpleLayer);
  }

  arcgisViewLayerviewCreate(event: ArcgisMapCustomEvent<__esri.ViewLayerviewCreateEvent>) {
    const { layer, layerView } = event.detail;
    // console.log(`layer "${layer.title}" type=${layer.type}`, layer);
    // TODO refer by ID, this is brittle
    if (layer.type === 'feature' && layer.title?.includes("Relative Cover")) {
      this.cloneReefsLayer(layer as FeatureLayer, layerView);
    }
  }

  private async cloneReefsLayer(layer: __esri.FeatureLayer, layerView: __esri.LayerView) {
    // only do this once
    if (this.cloned) {
      return;
    }
    this.cloned = true;

    if (layer.type !== "feature") {
      throw new Error("expected feature layer");
    }

    const resultSetId = this.resultSetContext.getId();

    console.log("reef layer", layer, layerView);

    //const layerJSON = (layer as any).toJSON();
    //const popupInfo = layerJSON.popupInfo;

    // examples: depth_mean, depth_max, depth_min
    const field = 'relative_cover';
    const renderer = cloneRendererChangedField(layer.renderer, field);

    // hide original layer
    layer.visible = false;

    const relCoverData = await firstValueFrom(this.api.getMeanRelativeCover(resultSetId));

    let unique_id_matchCount = 0;
    // create a new local layer and add relative_cover field
    const newLayer = await cloneFeatureLayerAsLocal(layer,
      {
        title: layer.title,
        renderer,
      },
      {
        newFields: [
          new Field({
            name: field,
            alias: 'Relative Cover',
            type: 'double'
          })
        ],
        modifyAttributes: (attrs) => {
          const val = dataframeFind(relCoverData, 'UNIQUE_ID',
            (unique_id) => {
              const match = unique_id === attrs['UNIQUE_ID'];
              if (match) {
                unique_id_matchCount++;
              }
              return match;
            },
            'relative_cover');

/*           if (val) {
            console.log('rel cover', val);
          } */

          attrs[field] = val;
        }
      });

    console.log(`map.addLayer relative_cover, UNIQUE_ID matchCount=${unique_id_matchCount}`);
    this.map.addLayer(newLayer);
    this.reefLayer = newLayer;

    // start following timestep
    this.timestep$.pipe(
      tap(timestep => {
        this.timestep = timestep;
        this.timestepLoading$.next(true);
      }),
      switchMap(timestep => this.api.getMeanRelativeCover(resultSetId, timestep))
    ).subscribe((relCoverData) => this.loadTimestepRelativeCoverData(relCoverData));
  }

  private loadTimestepRelativeCoverData(relCoverData: DataFrame) {
    updateLayerFeatureAttributes(this.reefLayer!,
      (attrs, objectIdField) => {
        return {
          [objectIdField]: attrs[objectIdField],
          relative_cover: dataframeFind(relCoverData, 'UNIQUE_ID',
            (unique_id) => unique_id === attrs['UNIQUE_ID'],
            'relative_cover')
        }
      }
    );
    this.reefLayer!.title = `Reefs Relative Cover ${this.timestep}`;

    // probably race-condition here when overlaping updates
    this.reefLayer?.when(() => this.timestepLoading$.next(false));
  }

  async arcgisViewClick(event: ArcgisMapCustomEvent<__esri.ViewClickEvent>) {
    console.log("arcgis map click", event);
    const view = this.map.view;
    const resp = await view.hitTest(event.detail);
    console.log("resp", resp);

    /*
    view.hitTest(event).then(function(response) {
      var results = response.results;
      if (results.length > 0) {
        var graphic = results.filter(function(result) {
          return result.graphic.layer === featureLayer;
        })[0].graphic;

        console.log("Selected feature:", graphic);
        // Perform actions with the selected graphic
      }
    });
    */
  }

  /**
   * Create a new layer from a Feature service layer URL.
   * @param renderer
   */
  private testLayerFromUrl(layerUrl: string, renderer: any) {
    const newLayer = new FeatureLayer({
      title: "Reef Relative Cover",
      url: layerUrl,
      visible: true,
      renderer,
    });


    console.log("init fields", newLayer.fields);

    this.map.addLayer(newLayer);
  }

}
