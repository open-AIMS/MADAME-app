import { Component, ViewChild } from '@angular/core';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { ArcgisMapCustomEvent } from '@arcgis/map-components';
import { ArcgisMap, ComponentLibraryModule } from '@arcgis/map-components-angular';
import Field from '@arcgis/core/layers/support/Field';
import { cloneFeatureLayerAsLocal, cloneRendererChangedField, updateLayerFeatureAttributes } from '../../util/arcgis/arcgis-layer-util';
import { concatMap, delay, from, tap } from 'rxjs';
import { experimentSimpleGraphicsLayer } from '../../util/arcgis/arcgis-layer-experiments';

@Component({
  selector: 'app-reef-map',
  standalone: true,
  imports: [ComponentLibraryModule],
  templateUrl: './reef-map.component.html',
  styleUrl: './reef-map.component.scss'
})
export class ReefMapComponent {

  // mapItemId = '94fe3f59dcc64b9eb94576a1f1f17ec9';
  // Arlo Reef Depth
  mapItemId = '43ef538d8be7412783eb7c5cfd3fdbe7';

  @ViewChild(ArcgisMap) map!: ArcgisMap;

  private cloned = false;

  arcgisViewReadyChange(event: ArcgisMapCustomEvent<void>) {
    console.log("ArcGis ready", this.map);
    const map = this.map;

    const simpleLayer = experimentSimpleGraphicsLayer();
    map.addLayer(simpleLayer);
  }

  arcgisViewLayerviewCreate(event: ArcgisMapCustomEvent<__esri.ViewLayerviewCreateEvent>) {
    const { layer, layerView } = event.detail;
    // console.log(`layer "${layer.title}" type=${layer.type}`, layer);
    if (layer.type === 'feature' && layer.title?.startsWith("ReefMod Reefs")) {
      this.cloneReefsLayer(layer as FeatureLayer, layerView);
    }
  }

  private cloneReefsLayer(layer: __esri.FeatureLayer, layerView: __esri.LayerView) {
    if (this.cloned) {
      return;
    }
    this.cloned = true;

    if (layer.type !== "feature") {
      throw new Error("expected feature layer");
    }

    console.log("reef layer", layer, layerView);

    //const layerJSON = (layer as any).toJSON();
    //const popupInfo = layerJSON.popupInfo;

    // examples: depth_mean, depth_max, depth_min
    const field = 'foo';
    const renderer = cloneRendererChangedField(layer.renderer, field);

    // hide original layer
    layer.visible = false;

    this.testNewLayer(layer, renderer).then(reefLayer => {
      // set different foo values
      from([2, 5, 7, 12]).pipe(
        tap(x => console.log("set foo", x)),
        concatMap((x) => from(updateLayerFeatureAttributes(reefLayer,
          (currentAttrs, objectFieldId) => {
            return {
              [objectFieldId]: currentAttrs[objectFieldId],
              foo: x
            }
          }
          // delay a bit to see the render
          // Note that though attributes updated, view still loading, would be better
          // to have a Promise for that for future UI busy indicator.
        )).pipe(delay(500))
      ),
      ).subscribe(() => console.log('done setting foo'));
    });
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
  private testLayerFromUrl(renderer: any) {
    const newLayer = new FeatureLayer({
      title: "Reef Relative Cover",
      url: "https://services3.arcgis.com/wfyOCawpdks4prqC/arcgis/rest/services/ReefMod_Reefs/FeatureServer/17",
      visible: true,
      renderer,
    });


    console.log("init fields", newLayer.fields);

    this.map.addLayer(newLayer);
  }

  private async testNewLayer(layer: FeatureLayer, renderer: any) {
    const newLayer = await cloneFeatureLayerAsLocal(layer,
      {
        title: "Hello",
        renderer,
      },
      {
        newFields: [
          new Field({
            name: 'foo',
            type: 'double'
          })
        ],
        modifyAttributes: (attrs) => {
          attrs['foo'] = 1;
        }
      });

    this.map.addLayer(newLayer);
    console.log("new layer", newLayer);

    return newLayer;
  }

}
