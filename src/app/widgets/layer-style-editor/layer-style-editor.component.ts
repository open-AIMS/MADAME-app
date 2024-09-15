import {Component, input} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import BlendLayer from "@arcgis/core/layers/mixins/BlendLayer";
import {MatSliderModule} from "@angular/material/slider";
import Layer from "@arcgis/core/layers/Layer";

type BlendModes = BlendLayer["blendMode"];

type GenericLayer = Pick<Layer & BlendLayer, "opacity" | "blendMode">;

const BLEND_MODES = ["average",
  "color-burn",
  "color-dodge",
  "color",
  "darken",
  "destination-atop",
  "destination-in",
  "destination-out",
  "destination-over",
  "difference",
  "exclusion",
  "hard-light",
  "hue",
  "invert",
  "lighten",
  "lighter",
  "luminosity",
  "minus",
  "multiply",
  "normal", // default
  "overlay",
  "plus",
  "reflect",
  "saturation",
  "screen",
  "soft-light",
  "source-atop",
  "source-in",
  "source-out",
  "vivid-light",
  "xor"];

@Component({
  selector: 'app-layer-style-editor',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
  ],
  templateUrl: './layer-style-editor.component.html',
  styleUrl: './layer-style-editor.component.scss'
})
export class LayerStyleEditorComponent {
  layer = input.required<GenericLayer>();

  blendModes = BLEND_MODES;

  constructor() {
  }

  onBlendModeChange(value: BlendModes) {
    const layer = this.layer();
    layer.blendMode = value;
  }

  onOpacityInput($event: Event) {
    const inputEl = $event.target as HTMLInputElement;
    this.layer().opacity = Number(inputEl.value);
  }
}
