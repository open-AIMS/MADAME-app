import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';

export function experimentSimpleGraphicsLayer(): GraphicsLayer {
  const gl = new GraphicsLayer();

  // works, but types not happy
  const point: any = {
    type: 'point',
    longitude: 146.809998,
    latitude: -19.168182,
  };

  const simpleMarkerSymbol = {
    type: 'simple-marker',
    color: [0, 0, 0],
    outline: {
      color: [255, 255, 255],
      width: 1,
    },
  };

  const attributes = {
    name: 'Point',
    description: 'I am a point',
  };

  const pointGraphic = new Graphic({
    geometry: point,
    symbol: simpleMarkerSymbol,
    attributes: attributes,
    popupTemplate: {
      title: attributes.name,
      content: attributes.description,
    },
  });

  gl.add(pointGraphic);

  return gl;
}
