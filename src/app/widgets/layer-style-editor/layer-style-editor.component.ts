import { Component, computed, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import Layer from '@arcgis/core/layers/Layer';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import {
  changePolygonLayerColor,
  getPolygonLayerColor,
} from '../../../util/arcgis/arcgis-layer-util';

// BlendLayer has no default export
type BlendLayer = __esri.BlendLayer;
type BlendModes = BlendLayer['blendMode'];

export type StylableLayer = Pick<
  Layer & BlendLayer,
  'opacity' | 'blendMode' | 'id' | 'title'
>;

const BLEND_MODES = [
  'average',
  'color-burn',
  'color-dodge',
  'color',
  'darken',
  'destination-atop',
  'destination-in',
  'destination-out',
  'destination-over',
  'difference',
  'exclusion',
  'hard-light',
  'hue',
  'invert',
  'lighten',
  'lighter',
  'luminosity',
  'minus',
  'multiply',
  'normal', // default
  'overlay',
  'plus',
  'reflect',
  'saturation',
  'screen',
  'soft-light',
  'source-atop',
  'source-in',
  'source-out',
  'vivid-light',
  'xor',
];

@Component({
    selector: 'app-layer-style-editor',
    imports: [MatFormFieldModule, MatSelectModule, MatSliderModule],
    templateUrl: './layer-style-editor.component.html',
    styleUrl: './layer-style-editor.component.scss'
})
export class LayerStyleEditorComponent {
  layer = input.required<StylableLayer>();

  blendModes = BLEND_MODES;

  supportsColor = computed(() => {
    // HACK until we abstract layers properly.
    return this.layer().title.startsWith('Assessed Regions');
  });

  currentColor = computed(() => {
    const layer = this.layer();
    let color: string | undefined;
    if (layer) {
      this.iteratePolygonLayers(layer, graphicsLayer => {
        color = getPolygonLayerColor(graphicsLayer);
        return false;
      });
    }

    return color;
  });

  constructor() {}

  onBlendModeChange(value: BlendModes) {
    const layer = this.layer();
    layer.blendMode = value;
  }

  onOpacityInput($event: Event) {
    const inputEl = $event.target as HTMLInputElement;
    this.layer().opacity = Number(inputEl.value);
  }

  onColorChange(event: Event) {
    const el = event.target! as HTMLInputElement;
    const color = el.value;
    this.iteratePolygonLayers(this.layer(), graphicsLayer => {
      changePolygonLayerColor(graphicsLayer, color);
      return true;
    });
  }

  // HACK for tile layers until abstraction work
  private iteratePolygonLayers(
    layer: StylableLayer,
    fn: (graphicsLayer: GraphicsLayer) => boolean
  ) {
    if (layer instanceof GroupLayer) {
      layer.layers.forEach(subGroup => {
        if (subGroup instanceof GroupLayer) {
          const colorLayer = subGroup.findLayerById('global_polygon_layer');
          if (colorLayer instanceof GraphicsLayer) {
            if (!fn(colorLayer)) {
              return;
            }
          }
        }
      });
    }
  }
}
