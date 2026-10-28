import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {geographicToLocal,localToGeographic} from '../../../shared/geography.js';
import type {SceneConfig} from './scene-config.js';
import type {HassState} from './types.js';
import type {LearnedGraph,RouteEdge,Point} from '../../../shared/yard-types.js';
export const referenceKey=(c:SceneConfig)=>createHash('sha256').update(JSON.stringify([c.location.latitude,c.location.longitude,c.location.northOffset,c.geography.altitude])).digest('hex');
export interface Sample {id:number;source:string;entity:string;run:string;measured:number;received:number;latitude:number;longitude:number;altitude:number;x:number;y:number;z:number;accuracy:number|null;speed:number|null;heading:number|null;activity:string;area:string;job:string;basis:string;accepted:number;reason:string;reference:string}
/** Raw measurements and rejected measurements are retained; only accepted measurements train routes. */
export class MowerHistory{
 readonly db:DatabaseSync;
 constructor(path:string){if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});this.db=new DatabaseSync(path);this.db.exec(`PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS fixes(id INTEGER PRIMARY KEY,source TEXT,entity TEXT,run TEXT,measured REAL,received REAL,latitude REAL,longitude REAL,altitude REAL,x REAL,y REAL,z REAL,accuracy REAL,speed REAL,heading REAL,activity TEXT,area TEXT,job TEXT,basis TEXT,accepted INTEGER,reason TEXT,reference TEXT,UNIQUE(source,entity,measured,x,z));CREATE INDEX IF NOT EXISTS fixes_source_time ON fixes(source,entity,measured);CREATE INDEX IF NOT EXISTS fixes_source_run ON fixes(source,run,measured);CREATE TABLE IF NOT EXISTS graphs(source TEXT PRIMARY KEY,json TEXT);`);}
 record(source:string,state:HassState,c:SceneConfig,received=Date.now()){
  const a=state.attributes,origin={...c.location,altitude:c.geography.altitude},hasGeo=typeof a.latitude==='number'&&typeof a.longitude==='number',hasLocal=typeof a.local_x==='number'&&typeof a.local_z==='number';if(!hasGeo&&!hasLocal||['unavailable','unknown'].includes(state.state))return false;
  let p:Point,geo:{latitude:number;longitude:number;altitude?:number};if(hasGeo){geo={latitude:Number(a.latitude),longitude:Number(a.longitude),altitude:typeof a.altitude==='number'?a.altitude:origin.altitude};p=geographicToLocal(geo,origin,c.location.northOffset);}else{p=[Number(a.local_x),typeof a.local_y==='number'?a.local_y:0,Number(a.local_z)];geo=localToGeographic(p,origin,c.location.northOffset);}
  const measured=Date.parse(typeof a.position_sampled_at==='string'?a.position_sampled_at:state.last_updated),accuracy=typeof(a.accuracy_m??a.gps_accuracy)==='number'?Number(a.accuracy_m??a.gps_accuracy):null;
  if(![...p,geo.latitude,geo.longitude,measured].every(Number.isFinite))return false;
  const previous=this.db.prepare('SELECT * FROM fixes WHERE source=? AND entity=? AND accepted=1 ORDER BY measured DESC LIMIT 1').get(source,state.entity_id) as unknown as Sample|undefined;
  if(previous&&previous.measured===measured)return false;
  const gap=previous?(measured-previous.measured)/1000:Infinity,key=referenceKey(c);let reason='';
  if(previous&&typeof a.position_sampled_at!=='string'&&Math.abs(previous.latitude-geo.latitude)<1e-10&&Math.abs(previous.longitude-geo.longitude)<1e-10)return false;
  if(Math.abs(geo.latitude)>90||Math.abs(geo.longitude)>180)reason='coordinates';else if(source!=='simulator'&&measured>received+5000)reason='future';else if(accuracy!==null&&(!Number.isFinite(accuracy)||accuracy<0||accuracy>15))reason='accuracy';else if(previous&&gap<=0)reason='out-of-order';else if(previous&&previous.reference===key&&gap<60&&Math.hypot(p[0]-previous.x,p[2]-previous.z)>Math.max(2,gap*3))reason='jump';
  const job=String(a.job_id??a.task??''),area=String(a.area??''),run=previous&&gap<60&&previous.job===job?previous.run:crypto.randomUUID();
  this.db.prepare('INSERT OR IGNORE INTO fixes(source,entity,run,measured,received,latitude,longitude,altitude,x,y,z,accuracy,speed,heading,activity,area,job,basis,accepted,reason,reference) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(source,state.entity_id,run,measured,received,geo.latitude,geo.longitude,geo.altitude??0,...p,accuracy,typeof a.speed_mps==='number'&&Number.isFinite(a.speed_mps)&&a.speed_mps>=0?a.speed_mps:null,typeof a.heading_deg==='number'&&Number.isFinite(a.heading_deg)?a.heading_deg:null,state.state,area,job,`${hasGeo?'gps':'derived-geography'}:${typeof a.position_sampled_at==='string'?'sample-time':'entity-time'}`,reason?0:1,reason,key);
  return !reason;
 }
 stats(source:string){return this.db.prepare("SELECT COUNT(*) samples,COUNT(DISTINCT CASE WHEN accepted=1 AND activity IN ('mowing','returning') THEN run END) runs, SUM(accepted) accepted,MAX(measured) latest FROM fixes WHERE source=?").get(source);}
 runs(source:string,limit=200,before=Number.MAX_VALUE){return this.db.prepare("SELECT run,entity,MIN(measured) start,MAX(measured) end,COUNT(*) samples,SUM(accepted) accepted,activity,area FROM fixes WHERE source=? AND activity IN ('mowing','returning') GROUP BY run HAVING MIN(measured)<? ORDER BY start DESC LIMIT ?").all(source,before,limit);}
 samples(source:string,run:string,c:SceneConfig){return (this.db.prepare('SELECT * FROM fixes WHERE source=? AND run=? ORDER BY measured LIMIT 20000').all(source,run) as unknown as Sample[]).map(s=>{const p=geographicToLocal({latitude:s.latitude,longitude:s.longitude,altitude:s.altitude},{...c.location,altitude:c.geography.altitude},c.location.northOffset);return{...s,x:p[0],y:p[1],z:p[2]};});}
 graph(source:string,c:SceneConfig):LearnedGraph{const row=this.db.prepare('SELECT json FROM graphs WHERE source=?').get(source) as {json:string}|undefined;const graph:LearnedGraph=row?JSON.parse(row.json):{source,referenceKey:referenceKey(c),builtAt:'',edges:[],samples:0,runs:0};return{...graph,stale:graph.referenceKey!==referenceKey(c)};}
 async rebuild(source:string,c:SceneConfig){
  const edges=new Map<string,{from:Point;to:Point;runs:Set<string>;lastSeen:number;activity:string;area:string}>();let count=0;const runs=this.runs(source,100000);
  for(const run of runs){let previous:Sample|undefined;for(const s of this.samples(source,String(run.run),c)){if(!s.accepted||s.accuracy!==null&&s.accuracy>3||!['mowing','returning'].includes(s.activity)){previous=undefined;continue;}count++;if(previous){const d=Math.hypot(s.x-previous.x,s.z-previous.z),dt=(s.measured-previous.measured)/1000;if(dt>0&&dt<=15&&d>.15&&d<=Math.min(8,dt*1.5+.5)){const steps=Math.max(1,Math.ceil(d)),points:Point[]=[];for(let i=0;i<=steps;i++)points.push([previous.x+(s.x-previous.x)*i/steps,previous.y+(s.y-previous.y)*i/steps,previous.z+(s.z-previous.z)*i/steps]);for(let i=1;i<points.length;i++){const from=points[i-1]!,to=points[i]!,id=[Math.round(from[0]),Math.round(from[2]),Math.round(to[0]),Math.round(to[2]),s.activity,s.area].join(':');const edge=edges.get(id)??{from,to,runs:new Set<string>(),lastSeen:0,activity:s.activity,area:s.area};edge.runs.add(s.run);edge.lastSeen=Math.max(edge.lastSeen,s.measured);edges.set(id,edge);}}}previous=s;}
   await new Promise<void>(r=>setImmediate(r));
  }
  const now=Date.now(),result:RouteEdge[]=[];for(const [id,e]of edges){if(e.runs.size<3)continue;const confidence=Math.min(.95,.5+e.runs.size*.06)*Math.exp(-Math.max(0,now-e.lastSeen)/(90*86400000));result.push({id,from:e.from,to:e.to,runs:e.runs.size,confidence,lastSeen:e.lastSeen,activity:e.activity,area:e.area,changed:e.runs.size<5});}
  const graph:LearnedGraph={source,referenceKey:referenceKey(c),builtAt:new Date().toISOString(),edges:result,samples:count,runs:runs.length};this.db.prepare('INSERT OR REPLACE INTO graphs(source,json) VALUES (?,?)').run(source,JSON.stringify(graph));return graph;
 }
 deleteRun(source:string,run:string){this.db.prepare('DELETE FROM fixes WHERE source=? AND run=?').run(source,run);this.clearLearning(source);}
 clearLearning(source:string){this.db.prepare('DELETE FROM graphs WHERE source=?').run(source);}
 close(){this.db.close();}
}
