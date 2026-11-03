import type {WeatherView} from './weather-source';

export function freshYardWeather(weather:WeatherView,now=Date.now()){
 const state=weather.state,stamp=Date.parse(state?.last_reported??state?.last_updated??'');
 return !!(weather.connected&&state&&!['unavailable','unknown'].includes(state.state)&&(weather.source==='smhi'||Number.isFinite(stamp)&&now-stamp>=-60000&&now-stamp<=5400000));
}
/** Photographic grade and weather cues are separate: cloud/night never create sun or rain. */
export function yardWeatherAppearance(condition:string,elevation:number){
 const day=Math.max(0,Math.min(1,((Number.isFinite(elevation)?elevation:-7)+7)/15));
 const rain=['rainy','pouring','lightning-rainy','snowy-rainy'].includes(condition),snow=['snowy','snowy-rainy'].includes(condition),clear=['sunny','clear-night'].includes(condition);
 const sunlight=['sunny','partlycloudy'].includes(condition)&&day>.5?(condition==='partlycloudy'?.35:1):0;
 const kind=rain&&snow?'sleet':snow?'snow':rain?'rain':condition==='fog'?'fog':condition==='cloudy'?'cloudy':condition==='partlycloudy'?'partlycloudy':sunlight>0?'sunny':clear?'clear-night':condition==='windy'?'windy':'neutral';
 return{day,kind,light:day<.3?'night':day<.75?'evening':'day',sunlight,brightness:(.97+.07*day)*(rain?.99:condition==='cloudy'?1.015:1)+sunlight*.02,saturation:1.09+day*.05,contrast:1.065+day*.02,night:(1-day)*.07};
}
