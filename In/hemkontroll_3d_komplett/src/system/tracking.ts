import {learnedDestination} from './learned-routes';
import type {LearnedGraph} from '../../../../shared/yard-types';
export interface Fix {timeBasis?:'sample'|'entity';x:number;z:number;t:number;accuracy?:number;speed?:number;heading?:number}
export class MowerTrackingService {
 graph?:LearnedGraph;history:Fix[]=[];private rendered?:{x:number;z:number};private rejected=false;private safePosition=false;
 accept(fix:Fix,now=Date.now()){
  if(fix.t>now+5000||![fix.x,fix.z,fix.t].every(Number.isFinite)||fix.accuracy!==undefined&&(!Number.isFinite(fix.accuracy)||fix.accuracy>15||fix.accuracy<0))return false;
  if(fix.heading!==undefined&&!Number.isFinite(fix.heading))fix={...fix,heading:undefined};if(fix.speed!==undefined&&(!Number.isFinite(fix.speed)||fix.speed<0))fix={...fix,speed:undefined};
  const last=this.history.at(-1);
  if(last&&fix.timeBasis==='entity'&&Math.hypot(fix.x-last.x,fix.z-last.z)<1e-6)return false;
  if(last&&fix.t===last.t)return false;
  if(last&&(fix.t<last.t||Math.hypot(fix.x-last.x,fix.z-last.z)>Math.max(2,(fix.t-last.t)/1000*3))){this.rejected=true;return false;}
  this.history.push(fix);this.history=this.history.filter(f=>fix.t-f.t<=180000);this.rejected=false;return true;
 }
 update(now:number,activity:string,connected:boolean,dt:number,allowed:(from:{x:number;z:number},to:{x:number;z:number})=>boolean=()=>true){
  const last=this.history.at(-1);if(!last)return null;
  const age=Math.max(0,(now-last.t)/1000),moving=connected&&['mowing','returning'].includes(activity),previous=this.history.at(-2);
  let vx=0,vz=0;
  if(previous){const seconds=(last.t-previous.t)/1000;vx=(last.x-previous.x)/seconds;vz=(last.z-previous.z)/seconds;}
  const instant={x:vx,z:vz};
  // Retain minutes of history, but use only recent segments for live direction.
  const recent=this.history.filter(f=>last.t-f.t<=8000);if(recent.length>2){const velocities=recent.slice(1).map((f,i)=>{const seconds=(f.t-recent[i].t)/1000;return{x:(f.x-recent[i].x)/seconds,z:(f.z-recent[i].z)/seconds};});const median=(a:number[])=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];vx=median(velocities.map(v=>v.x));vz=median(velocities.map(v=>v.z));}
  if(Math.hypot(instant.x,instant.z)>.03&&(vx*instant.x+vz*instant.z)/Math.max(1e-9,Math.hypot(vx,vz)*Math.hypot(instant.x,instant.z))<.7){vx=instant.x;vz=instant.z;}
  const speed=Math.hypot(vx,vz);if(speed>1.5){vx*=1.5/speed;vz*=1.5/speed;}
  const seconds=moving&&age<6?Math.min(age,6,3/Math.max(Math.hypot(vx,vz),0.001)):0;
  let destination=(!connected||age>=6)&&this.rendered?{...this.rendered}:{x:last.x+vx*seconds,z:last.z+vz*seconds};
  const learned=moving&&age<=6?learnedDestination(this.graph,last,{x:vx,z:vz},Math.hypot(vx,vz)*seconds,activity):null;
  const usedLearned=!!learned&&learned.path.slice(1).every((p,i)=>allowed({x:learned.path[i][0],z:learned.path[i][2]},{x:p[0],z:p[2]}));if(usedLearned&&learned)destination={x:learned.x,z:learned.z};
  const blocked=this.rendered&&this.safePosition?!allowed(this.rendered,destination):!allowed(destination,destination);if(!blocked&&!this.safePosition){this.rendered={...destination};this.safePosition=true;}if(blocked&&this.rendered){destination.x=this.rendered.x;destination.z=this.rendered.z;}
  if(!this.rendered)this.rendered=blocked?{x:last.x,z:last.z}:{...destination};
  const blend=1-Math.exp(-Math.max(0,dt)/0.5);this.rendered.x+=(destination.x-this.rendered.x)*blend;this.rendered.z+=(destination.z-this.rendered.z)*blend;
  const interpolated=seconds===0&&age<6&&Math.hypot(this.rendered.x-last.x,this.rendered.z-last.z)>.02;
  return {...this.rendered,safePosition:this.safePosition,measured:{...last},provenance:!connected?'unavailable':age>=6?'stale':usedLearned&&!blocked?'learned':seconds>0?'estimated':interpolated?'interpolated':'measured',routeId:usedLearned?learned?.routeId:undefined,confidence:usedLearned?learned?.confidence:undefined,heading:Math.hypot(vx,vz)>.03?Math.atan2(vx,-vz):last.heading!==undefined?last.heading*Math.PI/180:undefined,blocked,ageSeconds:age,estimated:!blocked&&moving&&age>0.3&&age<6,stale:age>=6||!connected,rejected:this.rejected,label:`${this.rendered.x.toFixed(1)} / ${this.rendered.z.toFixed(1)} m · ${age>=6||!connected?'gammal position · osäker':blocked?'utanför körbar yta · osäker':usedLearned&&!blocked?'uppskattad längs inlärt körstråk':seconds>0?'uppskattad':interpolated?'interpolerad':'uppmätt'}`};
 }
}
