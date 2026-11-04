import type {EnvironmentFrame,SceneConfig} from './types';
import {yardWeatherAppearance} from './yard-weather';
import {yardPhoto} from './yard-photo-config';
import {appearanceFor} from './appearance';

/** Presentation compensation for an already photographed texture, not a new physical light. */
export function yardSceneLighting(config:SceneConfig,frame:EnvironmentFrame){
 const source=(config as SceneConfig&{modelExchange?:{active?:{sourceFrameId?:string}}}).modelExchange?.active?.sourceFrameId;
 if(source!==yardPhoto.sourceFrame||!config.models[config.activeModel].url.startsWith('/workspace-api/models/'))return null;
 const condition=frame.weatherCondition??(frame.snow>.05?'snowy':frame.rain>.05?'rainy':(frame.cloud??0)>.65?'cloudy':(frame.cloud??0)>.2?'partlycloudy':'sunny');
 const photo=yardWeatherAppearance(condition,frame.elevation),grade=appearanceFor(config,frame),day=photo.day;
 const nightExposure=Math.min(2.5,Math.max(1,1+((config.appearance?.nightExposure??2.2)-1)*.5));
 return{
  grade:{warmth:grade.warmth*(.35+.65*day),saturation:photo.saturation*grade.saturation/1.08,contrast:photo.contrast*grade.contrast/1.04},
  exposure:grade.exposure*(nightExposure*(1-day)+1.18*day),
  ambient:Math.max(frame.ambient,.70+1.65*day),
  direct:frame.direct*.65,
  // Retain some baked photographic diffuse detail; real lights still add normally.
  photographicFloor:.12+.18*day,
 };
}
