import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Field from "@arcgis/core/layers/support/Field";
import {ClassBreaksRenderer} from "@arcgis/core/renderers";
import RasterFunction from "@arcgis/core/layers/support/RasterFunction";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import Graphic from "@arcgis/core/Graphic";

type FeatureAttributes = Record<string, any>;

export type ColorRGBA = [number, number, number, number];

export interface FieldAdditions {
  newFields: Array<Field>;
  // mutate the attributes from the features query prior to constructing the FeatureLayer
  modifyAttributes?: (attributes: FeatureAttributes) => void;
}

/**
 * Create a new local FeatureLayer with the source from the given layer.
 * @param layer
 * @param mixin FeatureLayer construction props to mixin
 */
export async function cloneFeatureLayerAsLocal(layer: FeatureLayer, mixin: __esri.FeatureLayerProperties, addFields?: FieldAdditions): Promise<FeatureLayer> {
  await layer.when();
  // maybe layer.load() instead?

  const featureSet = await layer.queryFeatures();

  const fields = [...layer.fields];
  if (addFields) {
    const {newFields, modifyAttributes} = addFields;
    fields.push(...newFields);

    if (modifyAttributes) {
      for (let f of featureSet.features) {
        modifyAttributes(f.attributes);
      }
    }
  }

  const props: __esri.FeatureLayerProperties = {
    source: featureSet.features,
    fields,
    objectIdField: layer.objectIdField,
    renderer: layer.renderer,
    spatialReference: layer.spatialReference,
    ...mixin
  };

  return new FeatureLayer(props);
}

export async function updateLayerFeatureAttributes(layer: FeatureLayer,
                                                   updateFeature: (currentAttributes: FeatureAttributes, objectIdField: string) => FeatureAttributes) {

  if (layer.url != null || layer.serviceItemId != null) {
    // paranoid check, not planning to update server-side layers for now.
    throw new Error("layer is not local!");
  }

  const featureSet = await layer.queryFeatures();

  // Note: mutating featureSet.features works, but it's much faster
  // to create a partial object.
  const objectIdField = layer.objectIdField;
  const features = featureSet.features.map(f => {
    return {
      attributes: updateFeature(f.attributes, objectIdField)
    }
  })

  await layer.applyEdits({
    // types expect a full Graphic, but a partial JSON object is supported
    // and much faster than working with all properties and attributes.
    // @ts-expect-error
    updateFeatures: features
  });
}

/**
 * Clone the renederer and change the field it uses.
 * FIXME current impl only works for ClassBreaksRenderer
 * @param renderer
 * @param field
 */
export function cloneRendererChangedField(renderer: __esri.Renderer, field: string): ClassBreaksRenderer {
  const rendererJSON = renderer.toJSON()
  rendererJSON.field = field;
  const colorVizVar = rendererJSON.visualVariables.find((x: any) => x.type === 'colorInfo');
  colorVizVar.field = field;
  // TODO should use arcgis jsonUtils
  return ClassBreaksRenderer.fromJSON(rendererJSON);
}

/**
 * Create a single color raster function.
 * @param color alpha, r, g, b 0:255
 */
export function createSingleColorRasterFunction(color: ColorRGBA) {
  // RGBA to ARGB
  const colorARGB = [color[3], color[0], color[1], color[2]];
  return new RasterFunction({
    functionName: "Colormap",
    functionArguments: {
      Colormap: [
        colorARGB
      ]
    }
  });
}

/**
 * Create a polygon that extends around the world and give it a color.
 * Useful for blending layers.
 * @param color
 */
export function createGlobalPolygonLayer(color: ColorRGBA) {
  const graphicsLayer = new GraphicsLayer({
    title: ''
  });

  const polygon = new Polygon({
    rings: [
      // @ts-expect-error
      [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
    ]
  });

  const fillSymbol = new SimpleFillSymbol({
    color,
  });

  const polygonGraphic = new Graphic({
    geometry: polygon,
    symbol: fillSymbol
  });

  graphicsLayer.add(polygonGraphic);

  return graphicsLayer;
}
