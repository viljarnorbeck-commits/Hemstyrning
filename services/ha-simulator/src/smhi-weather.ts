import express from 'express';
import type {SceneConfig} from './scene-config.js';
import type {SmhiForecast} from '../../../shared/weather-contract.js';

type Place={placeName:string;latitude:number;longitude:number};
type Point={time:string;intervalParametersStartTime?:string;data:Record<string,unknown>};
const descriptions=['','Klart','Nästan klart','Halvklart','Molnigt','Mycket moln','Mulet','Dimma','Lätta regnskurar','Regnskurar','Kraftiga regnskurar','Åskskurar','Lätta snöblandade regnskurar','Snöblandade regnskurar','Kraftiga snöblandade regnskurar','Lätta snöbyar','Snöbyar','Kraftiga snöbyar','Lätt regn','Regn','Kraftigt regn','Åska','Lätt snöblandat regn','Snöblandat regn','Kraftigt snöblandat regn','Lätt snöfall','Snöfall','Kraftigt snöfall'];
function condition(code:number){
 if(code===1)return 'sunny';if(code<=4)return 'partlycloudy';if(code<=6)return 'cloudy';if(code===7)return 'fog';
 if([11,21].includes(code))return 'lightning-rainy';if([12,13,14,22,23,24].includes(code))return 'snowy-rainy';
 if([15,16,17,25,26,27].includes(code))return 'snowy';return 'rainy';
}
async function readForecast(place:Place):Promise<SmhiForecast>{
 try{
  // SNOW1gv1 replaced the retired PMP3gv2 API. Fixed origin, no user-supplied URLs.
  const url=`https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${place.longitude.toFixed(4)}/lat/${place.latitude.toFixed(4)}/data.json`;
  const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('SMHI svarade '+response.status);
  const doc=await response.json() as {referenceTime?:string;timeSeries?:Point[]};const now=Date.now();
  const reference=Date.parse(doc.referenceTime??'');
  if(!Number.isFinite(reference)||now-reference>12*3600000||reference-now>3600000)throw Error('SMHI-prognosen är för gammal eller saknar giltig publiceringstid');
  const point=doc.timeSeries?.filter(p=>typeof p.time==='string'&&p.data&&Math.abs(Date.parse(p.time)-now)<=3600000).sort((a,b)=>Math.abs(Date.parse(a.time)-now)-Math.abs(Date.parse(b.time)-now))[0];
  if(!point)throw Error('SMHI saknar prognos för aktuell timme');
  const number=(key:string,min:number,max:number)=>{const v=point.data[key];return typeof v==='number'&&Number.isFinite(v)&&v!==9999&&v>=min&&v<=max?v:null;};
  const symbol=number('symbol_code',1,27);if(symbol===null||!Number.isInteger(symbol))throw Error('SMHI saknar väderförhållande');
  const cloud=number('cloud_area_fraction',0,8),amount=number('precipitation_amount_mean',0,500),frozen=number('precipitation_frozen_part',0,100);
  const hours=(Date.parse(point.time)-Date.parse(point.intervalParametersStartTime??''))/3600000;
  const rate=amount!==null&&Number.isFinite(hours)&&hours>0?amount/hours:null;
  return{source:'smhi',available:true,placeName:place.placeName,referenceTime:doc.referenceTime!,validTime:point.time,fetchedAt:new Date().toISOString(),condition:condition(symbol),description:descriptions[symbol]!,attributes:{
   temperature:number('air_temperature',-100,70),temperature_unit:'°C',wind_speed:number('wind_speed',0,150),wind_speed_unit:'m/s',wind_bearing:number('wind_from_direction',0,360),wind_gust_speed:number('wind_speed_of_gust',0,200),visibility:number('visibility_in_air',0,1000),visibility_unit:'km',
   cloud_coverage:cloud===null?null:cloud/8*100,humidity:number('relative_humidity',0,100),rain_intensity:rate===null||frozen===null?null:rate*(1-frozen/100),snow_intensity:rate===null||frozen===null?null:rate*frozen/100,
   forecast:true,forecast_valid_time:point.time,forecast_reference_time:doc.referenceTime,attribution:'SMHI · SNOW1gv1 · prognos',
  }};
 }catch(error){return{source:'smhi',available:false,placeName:place.placeName,message:error instanceof Error?error.message:'SMHI kunde inte hämtas'};}
}
export function smhiWeatherApi(load:()=>Promise<SceneConfig>,realMode:boolean){
 const router=express.Router(),cache=new Map<string,{until:number;value:SmhiForecast}>(),pending=new Map<string,Promise<SmhiForecast>>();
 router.get('/',async(_req,res)=>{
  const place=(await load()).weather;
  if(!realMode||place?.provider!=='smhi'){res.status(503).json({source:'smhi',available:false,placeName:place?.placeName??'',message:!realMode?'Simulatorns väder används':'SMHI är inte valt som väderkälla'});return;}
  const key=JSON.stringify([place.latitude,place.longitude,place.placeName]);let value=cache.get(key);
  if(!value||value.until<Date.now()){
   if(!pending.has(key))pending.set(key,readForecast(place).then(data=>{if(cache.size>=4)cache.delete(cache.keys().next().value!);cache.set(key,{value:data,until:Date.now()+(data.available?600000:60000)});return data;}).finally(()=>pending.delete(key)));
   const data=await pending.get(key)!;value={value:data,until:0};
  }
  res.set('Cache-Control','no-store').status(value.value.available?200:503).json(value.value);
 });
 return router;
}
