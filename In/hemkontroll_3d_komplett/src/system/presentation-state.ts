import type {SceneConfig,EnvironmentFrame,HassState,StartPhoto,EnergyRoute} from './types';
/** Conservative visual fingerprint. Meter updates alone do not invalidate a photograph. */
export function visualSignature(c:SceneConfig,e:EnvironmentFrame,states:Map<string,HassState>){
 const text=JSON.stringify({model:c.models[e.season??c.activeModel],season:e.season??c.activeModel,camera:c.startView,appearance:c.appearance,sky:c.sky,panoramas:c.panoramas,location:c.location,objects:c.objects,
 light:[Math.round(e.elevation),Math.round(e.azimuth),Math.round((e.cloud??0)*20),Math.round(e.rain*10),Math.round(e.snow*10),Math.round(e.fog*1000),Math.round(e.direct*10),Math.round(e.ambient*10),Math.round((e.exposure??1)*10)],
 devices:c.objects.filter(o=>['light','car','mower'].includes(o.type)).map(o=>{const s=states.get(o.entityId),a=s?.attributes;return[o.id,s?.state,...['brightness','rgb_color','color_temp_kelvin','location','local_x','local_z','position_sampled_at'].map(k=>a?.[k]),Object.entries(o.bindings??{}).filter(([k])=>['presence','position'].includes(k)).map(([,id])=>states.get(id.split('@')[0]))];})});
 let a=2166136261,b=2246822519;for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b^text.charCodeAt(i),3266489917);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
export function photoUsable(photo:StartPhoto|undefined,signature:string,aspect:number,now=Date.now()){
 return !!photo&&photo.signature===signature&&now-Date.parse(photo.createdAt)>=0&&now-Date.parse(photo.createdAt)<300000&&Math.abs(photo.width/photo.height/aspect-1)<.003;
}
export function routePower(route:EnergyRoute,states:Map<string,HassState>,connected:boolean):number|null{
 if(!connected||!route.sensor)return null;const[id,attr]=route.sensor.split('@'),s=states.get(id);if(!s||['unknown','unavailable'].includes(s.state))return null;
 const raw=attr?s.attributes[attr]:s.state;if(raw===null||raw===undefined||raw===''||typeof raw==='boolean')return null;const n=Number(raw);if(!Number.isFinite(n))return null;
 const unit=attr?route.unit:s.attributes.unit_of_measurement??route.unit;return unit==='W'?n/1000:unit==='kW'?n:null;
}
