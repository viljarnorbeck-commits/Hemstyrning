/** Explicit, independently replaceable vehicle / charger assignments. Never infer vehicle telemetry from a charger. */
export interface VehicleBinding{id:string;name:string;year:number;objectId:string;charger:string;battery:string;range:string;remaining:string;connection:string}
export const vehicles:VehicleBinding[]=[{id:'ev6',name:'Kia EV6',year:2023,objectId:'ui-car-0',charger:'easee_vanster',battery:'',range:'',remaining:'',connection:''},{id:'egolf',name:'Volkswagen e-Golf',year:2017,objectId:'ui-car-1',charger:'easee_hoger',battery:'',range:'',remaining:'',connection:''}];
export const energyBindings={house:'sensor.ferroamp_consumption_power',solarTotal:'sensor.ferroamp_total_solar_energy',price:'sensor.electricity_price_bringasen_380'};
export const climateBindings={thermostat:'climate.vvb_kallaren_termostat',switch:'switch.vvb_kallaren_on_off',rooms:['sensor.uteknx_temperatur','sensor.storabadrummet_temperatur']};
export interface CameraBinding{id:string;name:string;entityId:string;streamPath:string}
/** Only same-origin authenticated backend paths may be used. No camera internal URLs. */
export const cameras:CameraBinding[]=[];
export function safeCameraPath(value:string){return /^\/camera-api\/[a-zA-Z0-9_-]+\/stream$/.test(value)?value:null;}
export type HistoryPoint={last_updated:string;state:string;attributes?:Record<string,unknown>};
export function seriesPoints(rows:HistoryPoint[],unit:string,start:number,end:number){return rows.flatMap(s=>{const t=Date.parse(s.last_updated),raw=s.state.trim(),n=raw?Number(raw):NaN,u=s.attributes?.unit_of_measurement;return Number.isFinite(t)&&t>=start&&t<=end?[{t,value:Number.isFinite(n)?u===unit?n:u==='W'&&unit==='kW'?n/1000:null:null}]:[];}).sort((a,b)=>a.t-b.t);}

export function restoreVehicles(){if(typeof localStorage==='undefined')return;try{const saved=JSON.parse(localStorage.getItem('hem-vehicles-v1')??'null');if(!Array.isArray(saved))return;for(const v of vehicles){const p=saved.find(p=>p.id===v.id);if(!p)continue;for(const key of ['name','objectId','battery','range','remaining','connection']as const)if(typeof p[key]==='string'&&p[key].length<=150)v[key]=p[key];if(Number.isInteger(p.year)&&p.year>=1990&&p.year<=2100)v.year=p.year;if(['easee_vanster','easee_hoger'].includes(p.charger))v.charger=p.charger;}}catch{}}
