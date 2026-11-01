import type {SceneConfig,HassState} from './types';
import type {SmhiForecast} from '../../../../shared/weather-contract';
let key='',nextFetch=0,pending=false,data:SmhiForecast|undefined;
const conditions:Record<string,string>={sunny:'Klart','clear-night':'Klart',partlycloudy:'Halvklart',cloudy:'Molnigt',rainy:'Regn',pouring:'Kraftigt regn',snowy:'Snöfall','snowy-rainy':'Snöblandat regn',fog:'Dimma','lightning-rainy':'Åska',lightning:'Åska',windy:'Blåsigt'};
export interface WeatherView{state:HassState|undefined;connected:boolean;source:'smhi'|'ha';label:string;description:string}
/** Local view adapter only: never inserts a fabricated weather entity in HA's state stream/catalogue. */
export function weatherSnapshot(config:SceneConfig,states:Map<string,HassState>,connected:boolean,source='home-assistant',now=Date.now()):WeatherView{
 if(source==='simulator'||config.weather?.provider!=='smhi'){
  const state=states.get(source==='simulator'&&config.weather?.provider==='smhi'?'weather.home':config.bindings.weather);return{state,connected,source:'ha',label:source==='simulator'?'Simulerat väder':'Home Assistant',description:!connected?'Frånkopplad':!state?'Saknar väderkälla':state.state==='unavailable'?'Otillgänglig':conditions[state.state]??state.state};
 }
 const wanted=JSON.stringify(config.weather);if(wanted!==key){key=wanted;data=undefined;nextFetch=0;pending=false;}
 if(!pending&&now>=nextFetch&&typeof window!=='undefined'){
  pending=true;nextFetch=now+60000;const requested=key;
  void fetch('/connection-api/weather',{signal:AbortSignal.timeout(15000)}).then(async r=>{const result=await r.json() as SmhiForecast;if(requested!==key)return;data=result;nextFetch=Date.now()+(r.ok&&result.available?600000:60000);}).catch(()=>{if(requested===key)data={available:false,source:'smhi',placeName:config.weather!.placeName,message:'SMHI kunde inte nås'};}).finally(()=>{if(requested===key)pending=false;});
 }
 const label='SMHI · '+config.weather.placeName;
 const d=data,received=Date.parse(data?.fetchedAt??''),valid=Date.parse(data?.validTime??'');
 if(!d?.available||!d.fetchedAt||!d.validTime||!d.condition||!Number.isFinite(received)||!Number.isFinite(valid)||now-received< -60000||now-received>1200000||Math.abs(now-valid)>5400000)return{state:undefined,connected:false,source:'smhi',label,description:d?.message??(d?.available?'Gammal SMHI-prognos':'Hämtar SMHI-prognos…')};
 return{state:{entity_id:'local.smhi_forecast',state:d.condition,last_updated:d.fetchedAt,last_reported:d.fetchedAt,attributes:{...d.attributes,attribution:label,forecast:true,forecast_valid_time:d.validTime}},connected:true,source:'smhi',label,description:d.description??conditions[d.condition]??'Saknar väderförhållande'};
}
