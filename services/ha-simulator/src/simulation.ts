import {demoPresets} from './demo-presets.js';
import {advanceMedia} from './music.js';
import {MoonPhase,Illumination,Equator,Horizon,Observer,Body} from 'astronomy-engine';
import { z } from 'zod';
import type { StateStore } from './store.js';

const n=z.number().finite();
const carSchema=z.object({id:z.string().regex(/^[a-z][a-z0-9_]{0,40}$/),name:z.string().max(80),capacity:n.min(10).max(200),battery:n.min(0).max(100),limit:n.min(10).max(100),plugged:z.boolean(),home:z.boolean(),charging:z.boolean(),climate:z.boolean(),amps:n.min(0).max(32),voltage:n.min(100).max(500),phases:n.int().min(1).max(3),range:n.min(50).max(1000)});
export const simulationSchema=z.object({
  date:z.string().datetime().refine(value=>Number.isFinite(Date.parse(value))),timeScale:n.min(0).max(3600),running:z.boolean(),latitude:n.min(-90).max(90),longitude:n.min(-180).max(180),
  season:z.enum(['summer','autumn','firstSnow','winter']),cloud:n.min(0).max(100),temperature:n.min(-50).max(50),rain:n.min(0).max(1),snow:n.min(0).max(1),wind:n.min(0).max(50),windDirection:n.min(0).max(360),gust:n.min(0).max(80),visibility:n.min(0.05).max(100),snowCover:n.min(0).max(200),
  luxMode:z.enum(['auto','manual','unavailable','unknown','outlier','frozen']),lux:n.min(0).max(200000),luxInterval:n.min(0.5).max(120),
  panelCount:n.int().min(0).max(200),panelWatts:n.min(100).max(800),houseLoad:n.min(0).max(30),price:n.min(-5).max(20),
  mowerRoute:z.array(z.tuple([n,n,n])).max(100).default([]),mowerLight:z.enum(['auto','on','off','unknown']).default('auto'),
  mowerInterval:n.min(0.5).max(30),mowerJitter:n.min(0).max(10),gpsFault:z.enum(['none','lost','jump','delayed','dropout']),cars:z.array(carSchema).min(1).max(8),
}).superRefine((v,ctx)=>{if(new Set(v.cars.map(c=>c.id)).size!==v.cars.length)ctx.addIssue({code:'custom',message:'Bil-ID måste vara unika'});});
export type SimulationSettings=z.infer<typeof simulationSchema>;
export const scenarios=[['normal-day','Normal dag'],['winter-evening','Vinterkväll'],['halloween','Halloween'],['high-price','Högt elpris'],['communication-error','Kommunikationsfel'],['summer','Solig sommardag'],['sunset','Solnedgång'],['winter','Mörk vinterkväll med gårdsbelysning'],['rain','Kraftigt regn'],['snow','Kraftigt snöfall'],['blizzard','Snöstorm med hård vind'],['fog','Tät dimma'],['rapid','Snabba väderförändringar'],['car-arrives','Bil anländer och börjar laddas'],['car-climate','Bil startar klimatisering'],['mower-job','Gräsklippare · helt arbetspass'],['gps-loss','Gräsklippare · GPS-bortfall'],['solar','Varierande solproduktion'],['offline','Enheter tappar anslutningen'],['mower-slope','Gräsklippare · testsluttning'],['mower-driveway','Gräsklippare · passage över uppfart'],['mower-return','Gräsklippare · åter till laddstation'],['mower-normal','LUBA A · normal körning'],['mower-repeat','LUBA B · upprepade körningar'],['mower-changed','LUBA C · förändrad rutt'],['mower-bad-gps','LUBA D · dålig GPS'],['mower-obstacles','LUBA E · hinder och sluttning'],['mower-restart','LUBA F · historik före omstart']] as const;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
/** NOAA solar geometry; mirrored contract tests against the frontend implementation. */
export function solar(date:Date,latitude:number,longitude:number){
 const year=date.getUTCFullYear(),days=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000,day=Math.floor((+date-Date.UTC(year,0,1))/86400000)+1,h=date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600,g=2*Math.PI/days*(day-1+(h-12)/24),r=Math.PI/180;
 const eq=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
 const d=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g),a=((h*60+eq+4*longitude)/4-180)*r,lat=latitude*r;
 return {elevation:Math.asin(clamp(Math.sin(lat)*Math.sin(d)+Math.cos(lat)*Math.cos(d)*Math.cos(a),-1,1))/r,azimuth:(Math.atan2(Math.sin(a),Math.cos(a)*Math.sin(lat)-Math.tan(d)*Math.cos(lat))/r+540)%360};
}
export class Simulation {
 settings:SimulationSettings=simulationSchema.parse({date:'2026-06-21T12:00:00.000Z',timeScale:1,running:true,latitude:63.18,longitude:14.64,season:'summer',cloud:35,temperature:18,rain:0,snow:0,wind:3,windDirection:210,gust:5,visibility:25,snowCover:0,luxMode:'auto',lux:1000,luxInterval:3,panelCount:24,panelWatts:420,houseLoad:2.5,price:1.32,mowerInterval:4.5,mowerJitter:0,gpsFault:'none',cars:[{id:'car_one',name:'Bil 1',capacity:75,battery:72,limit:85,plugged:true,home:true,charging:false,climate:false,amps:11,voltage:230,phases:3,range:450},{id:'car_two',name:'Bil 2',capacity:60,battery:62,limit:80,plugged:false,home:true,charging:false,climate:false,amps:10,voltage:230,phases:1,range:350}]});
 private overrides = new Set<string>();
 override(id:string,input:{state:string;attributes?:Record<string,unknown>}|null){if(input){this.overrides.add(id);this.store.set(id,input.state,input.attributes??{});}else{this.overrides.delete(id);if(id.startsWith('calendar.'))this.calendarDay='';this.luxElapsed=999;this.publish(0);}}
 scenario='';private elapsed=0;private clock=Date.now();private timer:ReturnType<typeof setInterval>|undefined;private luxElapsed=999;private mowerElapsed=0;private mowerTravel=0;private positionHistory:{x:number;z:number;sampled_at:string}[]=[];private jobProgress=0;private delayed:{at:number;attributes:Record<string,unknown>}[]=[];private lastSunDay='';private sunTimes:Record<string,unknown>={};
 private day='';private daily={solar:0,house:0,import:0,export:0,self:0,cost:0};
 totals={solar:0,house:0,import:0,export:0,self:0,cost:0};
 constructor(readonly store:StateStore){this.publish(0);}
 start(){if(this.timer)return;let last=Date.now();this.timer=setInterval(()=>{const now=Date.now();this.tick(Math.min(5,(now-last)/1000));last=now;},500);this.timer.unref();}
 stop(){clearInterval(this.timer);this.timer=undefined;}
 configure(input:unknown){this.settings=simulationSchema.parse(input);this.scenario='';for(const c of this.settings.cars){this.store.set(`switch.${c.id}_charging`,c.charging?'on':'off');this.store.set(`climate.${c.id}`,c.climate?'heat':'off');}this.luxElapsed=999;this.publish(0);}
 runScenario(id:string){
  if(!scenarios.some(s=>s[0]===id))throw new Error('Okänt scenario');this.scenario=id;this.elapsed=0;this.delayed=[];
  const s=this.settings;Object.assign(s,{date:'2026-06-21T12:00:00.000Z',timeScale:60,running:true,cloud:10,rain:0,snow:0,wind:3,gust:5,visibility:25,season:'summer',temperature:18,snowCover:0,luxMode:'auto',gpsFault:'none',mowerRoute:[],mowerLight:'auto'});
  if(id==='sunset'){s.date='2026-09-21T16:00:00.000Z';s.timeScale=240;}
  if(id==='winter'||id==='snow'||id==='blizzard'){Object.assign(s,{date:'2026-12-21T18:00:00.000Z',season:'winter',temperature:-8,snowCover:25,cloud:90});}
  if(id==='winter')for(const state of this.store.all().filter(s=>s.entity_id.startsWith('light.')))this.store.set(state.entity_id,'on',{brightness:220});
  if(id==='rain')Object.assign(s,{rain:1,cloud:100,wind:9,gust:15,visibility:3});
  if(id==='snow')s.snow=0.8;
  if(id==='blizzard')Object.assign(s,{snow:1,wind:22,gust:35,visibility:0.3});
  if(id==='fog')Object.assign(s,{visibility:0.08,cloud:100});
  if(id==='car-arrives'){const c=s.cars[0]!;Object.assign(c,{home:false,plugged:false,charging:false});this.store.set(`switch.${c.id}_charging`,'off');}
  if(id==='car-climate'){const c=s.cars[0]!;c.climate=false;this.store.set(`climate.${c.id}`,'off');}
  if(id==='mower-job'||id==='gps-loss'||id.startsWith('mower-')){this.jobProgress=0;this.store.set('lawn_mower.luba_3_awd','mowing',{progress:0,error:null});s.mowerJitter=2;}
  if(id==='mower-obstacles')s.mowerRoute=[[-17,0,7],[-10,1.2,7],[-10,1.2,-5],[-2,0,-5],[-2,0,7]];
  if(id==='mower-repeat'||id==='mower-changed'||id==='mower-restart')this.mowerTravel=0;
  if(id==='normal-day'){s.cars[0]!.charging=true;s.cars[0]!.plugged=true;this.store.set('switch.car_one_charging','on');this.store.set('lawn_mower.luba_3_awd','mowing');}
  if(id==='winter-evening'){s.date='2026-12-20T19:00:00Z';s.houseLoad=5;s.cars.forEach(c=>{c.climate=true;this.store.set('climate.'+c.id,'heat');});demoPresets(this.store).activate('scene.evening');}
  if(id==='halloween'){s.date='2026-10-31T20:00:00Z';demoPresets(this.store).activate('script.halloween');}
  if(id==='high-price')s.price=7.5;
  if(id==='communication-error'){this.store.set('light.garage','unavailable');s.luxMode='unavailable';}
  if(id==='mower-slope')s.mowerRoute=[[-17,0,7],[-10,1.2,7],[-2,0,7],[-2,0,22],[-17,0,22]];
  if(id==='mower-driveway')s.mowerRoute=[[-17,0,7],[-10,0,7],[-10,0,-5],[-2,0,-5],[-2,0,7]];
  if(id==='mower-return'){this.mowerTravel=20;this.store.set('lawn_mower.luba_3_awd','returning');}
  this.luxElapsed=999;this.publish(0);
 }
 tick(seconds:number){if(!this.settings.running)return;const dt=clamp(seconds,0,3600);advanceMedia(this.store,dt);demoPresets(this.store).tick(dt);this.elapsed+=dt;this.clock+=dt*1000;this.timeline();let remaining=dt*this.settings.timeScale;
  while(remaining>1e-6){const time=Date.parse(this.settings.date),midnight=Date.parse(this.settings.date.slice(0,10)+'T00:00:00Z')+86400000,seconds=Math.min(remaining,(midnight-time)/1000);this.settings.date=new Date(time+seconds*1000-(seconds*1000===midnight-time?1:0)).toISOString();this.publish(seconds/3600);remaining-=seconds;if(seconds*1000===midnight-time){this.settings.date=new Date(midnight).toISOString();this.publish(0);}}
  if(dt*this.settings.timeScale===0)this.publish(0);this.luxElapsed+=dt;this.mowerElapsed+=dt;this.updateMower(dt);}
 private timeline(){const s=this.settings,t=this.elapsed;
  if(this.scenario==='normal-day'){s.price=1.1+.35*Math.sin(t/120);s.houseLoad=2.8+.35*Math.sin(t/60);if(s.cars[0])s.cars[0].amps=10+2*Math.sin(t/90);}
  if(this.scenario==='rapid'){s.cloud=(Math.sin(t/5)+1)*50;s.rain=(Math.sin(t/9)+1)/2;s.snow=0;}
  if(this.scenario==='solar')s.cloud=(Math.sin(t/10)+1)*50;
  if(this.scenario==='car-arrives'&&t>=5){const c=s.cars[0]!;c.home=true;c.plugged=t>=8;if(t>=10)this.store.set(`switch.${c.id}_charging`,'on');}
  if(this.scenario==='car-climate'&&t>=3)this.store.set(`climate.${s.cars[0]!.id}`,'heat');
  if(this.scenario==='mower-bad-gps'){const faults=['none','jump','delayed','dropout','lost'] as const;s.gpsFault=faults[Math.floor(t/15)%faults.length]!;}
  if(this.scenario==='mower-changed'&&t>200)s.mowerRoute=[[-17,0,7],[-10,0,5],[-2,0,7],[-2,0,22],[-17,0,22]];
  if(this.scenario==='gps-loss')s.gpsFault=t>=8&&t<25?'lost':'none';
  if(this.scenario==='offline'){const lost=t>=5&&t<20;this.store.set('light.altan',lost?'unavailable':'off');s.luxMode=lost?'unavailable':'auto';}
 }
 private set(id:string,value:number|string,attributes:Record<string,unknown>={}){if(this.overrides.has(id))return;this.store.set(id,String(typeof value==='number'?Number(value.toFixed(5)):value),{...attributes,simulated:true});}
 private calendarDay='';
 private publish(hours:number){
  const s=this.settings,date=new Date(s.date),sun=solar(date,s.latitude,s.longitude),day=s.date.slice(0,10);
  if(day+s.latitude+','+s.longitude!==this.lastSunDay){this.lastSunDay=day+s.latitude+','+s.longitude;const start=Date.parse(day+'T00:00:00Z');const crossings: {time:string;up:boolean;twilight:boolean}[]=[];let prev=solar(new Date(start),s.latitude,s.longitude).elevation;
   for(let i=1;i<=288;i++){const time=start+i*300000,e=solar(new Date(time),s.latitude,s.longitude).elevation;for(const threshold of [-0.833,-6])if((prev<threshold&&e>=threshold)||(prev>=threshold&&e<threshold))crossings.push({time:new Date(time-300000+300000*(threshold-prev)/(e-prev)).toISOString(),up:e>prev,twilight:threshold===-6});prev=e;}
   this.sunTimes={sunrise:crossings.find(c=>c.up&&!c.twilight)?.time??null,sunset:crossings.find(c=>!c.up&&!c.twilight)?.time??null,dawn:crossings.find(c=>c.up&&c.twilight)?.time??null,dusk:crossings.find(c=>!c.up&&c.twilight)?.time??null};
  }
  if(day!==this.day){this.day=day;this.daily={solar:0,house:0,import:0,export:0,self:0,cost:0};}
  let carLoad=0;
  for(const c of s.cars){
   const entity=`sensor.${c.id}_battery`,climate=`climate.${c.id}`,charging=`switch.${c.id}_charging`;
   if(!this.store.get(charging))this.set(charging,c.charging?'on':'off',{friendly_name:c.name+' laddning'});
   if(!this.store.get(climate))this.set(climate,c.climate?'heat':'off',{friendly_name:c.name+' klimat',temperature:21,current_temperature:16});
   this.set(climate,this.store.get(climate)?.state??'off',{supported_features:384,hvac_modes:['off','heat'],friendly_name:c.name+' klimat'});
   c.charging=this.store.get(charging)!.state==='on'&&c.plugged&&c.home&&c.battery<c.limit;c.climate=['heat','cool','heat_cool','auto','fan_only','dry'].includes(this.store.get(climate)!.state);
   let power=c.charging?c.amps*c.voltage*c.phases/1000:0;
   if(hours>0){const energy=Math.min(power*hours,Math.max(0,(c.limit-c.battery)/100*c.capacity));power=energy/hours;c.battery=clamp(c.battery+energy/c.capacity*100,0,100);}
   carLoad+=power+(c.climate?1.2:0);
   this.set(entity,c.battery,{friendly_name:c.name,unit_of_measurement:'%',battery_level:c.battery,range_km:c.range*c.battery/100,charging_power_kw:power,charging_current:power>0?c.amps:0,charging_voltage:c.plugged?c.voltage:null,charge_limit:c.limit,remaining_minutes:power>0?(c.limit-c.battery)/100*c.capacity/power*60:null,plugged_in:c.plugged,charging:power>0,climate_on:c.climate,cabin_temperature:c.climate?21:16,location:c.home?'Hemma':'Borta',error:null,supported_commands:['climate_on','climate_off','charge_on','charge_off'],command_entities:{climate,charging}});
  }
  const solarPower=s.panelCount*s.panelWatts/1000*Math.max(0,Math.sin(sun.elevation*Math.PI/180))*(1-s.cloud/100*0.82)*(1-s.rain*0.2),house=s.houseLoad+carLoad,own=Math.min(house,solarPower),buy=Math.max(0,house-solarPower),sell=Math.max(0,solarPower-house);
  if(hours>0)for(const totals of [this.totals,this.daily]){totals.solar+=solarPower*hours;totals.house+=house*hours;totals.import+=buy*hours;totals.export+=sell*hours;totals.self+=own*hours;totals.cost+=(buy-sell)*s.price*hours;}
  this.set('sensor.solar_power',solarPower,{friendly_name:'Solproduktion',unit_of_measurement:'kW',production_kw:solarPower,energy_today:this.daily.solar,energy_total:10000+this.totals.solar,inverter_status:sun.elevation>0?'Produktion':'Viloläge',panel_count:s.panelCount,panel_values:Array.from({length:s.panelCount},(_,i)=>({id:`P${i+1}`,power_w:s.panelCount?solarPower*1000/s.panelCount:0})),sampled_at:s.date});
  this.set('sensor.house_power',house,{friendly_name:'Husets energi',unit_of_measurement:'kW',house_power_kw:house,grid_import_kw:buy,grid_export_kw:sell,self_consumption_kw:own,energy_today:this.daily.house,energy_total:30000+this.totals.house,cost_today:this.daily.cost,price:s.price,price_resolution_minutes:60,prices:Array.from({length:24},(_,i)=>({start:new Date(Date.parse(day+'T00:00Z')+i*3600000).toISOString(),price:s.price})),sampled_at:s.date});
  for(const [id,value,unit]of [['grid_import_power',buy,'kW'],['grid_export_power',sell,'kW'],['solar_energy_today',this.daily.solar,'kWh'],['house_energy_today',this.daily.house,'kWh'],['grid_import_energy',this.totals.import,'kWh'],['grid_export_energy',this.totals.export,'kWh'],['self_consumption_energy',this.totals.self,'kWh'],['cost_today',this.daily.cost,'SEK']]as const)this.set('sensor.'+id,value,{unit_of_measurement:unit,sampled_at:s.date});
  const condition=s.visibility<1?'fog':s.snow>0.05&&s.rain>0.05?'snowy-rainy':s.snow>0.05?'snowy':s.rain>0.75?'pouring':s.rain>0.05?'rainy':s.cloud>75?'cloudy':s.cloud>20?'partlycloudy':'sunny';
  this.set('weather.home',condition,{friendly_name:'SMHI-liknande väder · simulering',temperature:s.temperature,cloud_coverage:s.cloud,wind_speed:s.wind,wind_speed_unit:'m/s',wind_bearing:s.windDirection,wind_gust_speed:s.gust,visibility:s.visibility,visibility_unit:'km',rain_intensity:s.rain,snow_intensity:s.snow,snow_cover_cm:s.snowCover,season_model:s.season,simulated_datetime:s.date,time_scale:s.timeScale,solar_elevation:sun.elevation,solar_azimuth:sun.azimuth,...this.sunTimes});
  const moonPhase=MoonPhase(date),observer=new Observer(s.latitude,s.longitude,0),eq=Equator(Body.Moon,date,observer,true,true),moon=Horizon(date,observer,eq.ra,eq.dec,'normal'),phaseNames=['new_moon','waxing_crescent','first_quarter','waxing_gibbous','full_moon','waning_gibbous','last_quarter','waning_crescent'];
  this.set('sensor.moon_phase',phaseNames[Math.round(moonPhase/45)%8]!,{friendly_name:'Månfas',illumination:Illumination(Body.Moon,date).phase_fraction,phase_angle:moonPhase,altitude:moon.altitude,azimuth:moon.azimuth,simulated_datetime:s.date});
  if(this.calendarDay!==day){this.calendarDay=day;
    for(const [id,name,events]of [
      ['calendar.family','Familjen',[{summary:'Middag tillsammans',start:{dateTime:day+'T17:00:00Z'},end:{dateTime:day+'T18:00:00Z'},location:'Hemma'},{summary:'Trädgårdsdag',start:{date:new Date(Date.parse(day)+86400000).toISOString().slice(0,10)},end:{date:new Date(Date.parse(day)+2*86400000).toISOString().slice(0,10)}}]],
      ['calendar.work','Arbete',[{summary:'Planeringsmöte',start:{dateTime:day+'T13:00:00Z'},end:{dateTime:day+'T14:00:00Z'},location:'Digitalt'}]],
    ]as const)this.set(id,'off',{friendly_name:name,events:[...events]});
  }
  for(const calendar of this.store.all().filter(state=>state.entity_id.startsWith('calendar.'))){
    const events=calendar.attributes.events;if(!Array.isArray(events))continue;
    const timestamp=(value:unknown)=>{const event=value as {dateTime?:string;date?:string}|undefined;return Date.parse(event?.dateTime??event?.date??'');};
    const next=events.filter(event=>timestamp(event.end)>date.getTime()).sort((a,b)=>timestamp(a.start)-timestamp(b.start))[0],active=next&&timestamp(next.start)<=date.getTime(),state=active?'on':'off',start=next?.start?.dateTime??next?.start?.date??null,end=next?.end?.dateTime??next?.end?.date??null;
    if(calendar.state!==state||calendar.attributes.start_time!==start||calendar.attributes.end_time!==end||calendar.attributes.message!==(next?.summary??null))this.set(calendar.entity_id,state,{message:next?.summary??null,start_time:start,end_time:end,all_day:!!next?.start?.date});
  }
  this.set('sun.sun',sun.elevation> -0.833?'above_horizon':'below_horizon',{elevation:sun.elevation,azimuth:sun.azimuth,...this.sunTimes});
  this.set('sensor.garden_snow_depth',s.snowCover,{unit_of_measurement:'cm'});
  if(this.luxElapsed>=s.luxInterval&&s.luxMode!=='frozen'){
   const lamps=this.store.all().filter(l=>l.entity_id.startsWith('light.')&&l.state==='on').length;
   const lux=s.luxMode==='auto'?Math.max(0,85000*Math.max(0,Math.sin(sun.elevation*Math.PI/180))*(1-s.cloud/100*0.75))+lamps*50:s.luxMode==='outlier'?999999999:s.lux;
   this.set('sensor.outdoor_illuminance',['unavailable','unknown'].includes(s.luxMode)?s.luxMode:lux,{unit_of_measurement:'lx',device_class:'illuminance'});this.luxElapsed=0;
  }
  const vacuum=this.store.get('vacuum.downstairs');if(vacuum){const progress=clamp(Number(vacuum.attributes.progress??0)+(vacuum.state==='cleaning'?hours*60:0),0,100);this.set(vacuum.entity_id,vacuum.state==='returning'?'docked':progress>=100&&vacuum.state==='cleaning'?'returning':vacuum.state,{battery_level:clamp(Number(vacuum.attributes.battery_level??100)+(vacuum.state==='docked'?hours*30:vacuum.state==='cleaning'?-hours*10:0),0,100),charging:vacuum.state==='docked',progress,task:'Nedervåning',error:null,supported_commands:['vacuum_start','vacuum_pause','vacuum_dock']});}
 }
 private updateMower(dt:number){
  const s=this.settings,m=this.store.get('lawn_mower.luba_3_awd');if(!m)return;let activity=m.state;
  if(activity==='mowing'){this.mowerTravel+=dt*0.65;this.jobProgress=clamp(this.jobProgress+dt/1.8,0,100);if(this.jobProgress>=100&&!['mower-repeat','mower-changed','mower-restart'].includes(this.scenario))activity='returning';}
  if(activity==='returning'){this.mowerTravel=Math.max(0,this.mowerTravel-dt*1.2);if(this.mowerTravel===0)activity='docked';}
  const period=Math.max(0.5,s.mowerInterval+Math.sin(this.elapsed*0.7)*s.mowerJitter);
  if(this.mowerElapsed>=period){this.mowerElapsed=0;
   const d=this.mowerTravel%60,side=Math.floor(d/15),offset=d%15,x=side===0?-17+offset:side===1?-2:side===2?-2-offset:-17,z=side===0?7:side===1?7+offset:side===2?22:22-offset;
   let px=x,pz=z,py=0;if(s.mowerRoute.length>1){const route=[...s.mowerRoute,s.mowerRoute[0]!],lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i]![0],p[2]-route[i]![2])),total=lengths.reduce((a,b)=>a+b,0);let travel=total>0?this.mowerTravel%total:0;for(let i=0;i<lengths.length;i++){const length=lengths[i]!;if(travel<=length&&length>0){const a=route[i]!,b=route[i+1]!,f=travel/length;px=a[0]+(b[0]-a[0])*f;py=a[1]+(b[1]-a[1])*f;pz=a[2]+(b[2]-a[2])*f;break;}travel-=length;}}
   const attributes={job_id:`${this.scenario}:${Math.floor(this.mowerTravel/60)}`,local_y:py,local_x:px+(s.gpsFault==='jump'?150:Math.sin(this.elapsed)*0.05),local_z:pz,position_sampled_at:new Date(this.clock).toISOString(),accuracy_m:0.15,speed_mps:activity==='mowing'?0.65:0,heading_deg:[90,180,270,0][side]??0};
   if(s.gpsFault==='delayed')this.delayed.push({at:this.clock+10000,attributes});
   else if(s.gpsFault!=='lost'&&!(s.gpsFault==='dropout'&&Math.floor(this.elapsed/8)%2)){this.positionHistory.push({x:attributes.local_x,z:attributes.local_z,sampled_at:attributes.position_sampled_at});this.positionHistory=this.positionHistory.filter(p=>this.clock-Date.parse(p.sampled_at)<=180000);this.set(m.entity_id,activity,{...attributes,position_history:this.positionHistory});}
  }
  while(this.delayed[0]&&this.delayed[0].at<=this.clock){const sample=this.delayed.shift()!;this.set(m.entity_id,activity,sample.attributes);}
  const light=s.mowerLight==='unknown'?null:s.mowerLight==='on'?true:s.mowerLight==='off'?false:solar(new Date(s.date),s.latitude,s.longitude).elevation< -4&&['mowing','returning'].includes(activity);
  this.set(m.entity_id,activity,{telemetry_now:new Date(this.clock).toISOString(),headlight:light,position_source:'simulated',route_profile:this.scenario||'rectangle',progress:this.jobProgress,battery_level:Math.max(0,91-this.jobProgress*0.35),charging:activity==='docked',task:'Gårdens gräsyta',area:'Trädgård',error:s.gpsFault==='lost'?'GPS saknas':null,supported_commands:['mower_start','mower_pause','mower_dock']});
 }
 forecast(){return Array.from({length:24},(_,i)=>({datetime:new Date(Date.parse(this.settings.date)+(i+1)*3600000).toISOString(),condition:this.store.get('weather.home')?.state??'unknown',temperature:this.settings.temperature,cloud_coverage:this.settings.cloud,precipitation:this.settings.rain*8+this.settings.snow*3,wind_speed:this.settings.wind,wind_bearing:this.settings.windDirection}));}
}
