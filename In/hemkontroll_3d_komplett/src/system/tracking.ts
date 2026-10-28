export interface Fix {x:number;z:number;t:number;accuracy?:number;speed?:number;heading?:number}
export class MowerTrackingService {
 history:Fix[]=[];private rendered?:{x:number;z:number};private rejected=false;
 accept(fix:Fix,now=Date.now()){
  if(fix.t>now+5000||![fix.x,fix.z,fix.t].every(Number.isFinite)||fix.accuracy!==undefined&&(!Number.isFinite(fix.accuracy)||fix.accuracy>15||fix.accuracy<0))return false;
  const last=this.history.at(-1);
  if(last&&fix.t===last.t)return false;
  if(last&&(fix.t<last.t||Math.hypot(fix.x-last.x,fix.z-last.z)>Math.max(2,(fix.t-last.t)/1000*3))){this.rejected=true;return false;}
  this.history.push(fix);this.history=this.history.filter(f=>fix.t-f.t<=180000);this.rejected=false;return true;
 }
 update(now:number,activity:string,connected:boolean,dt:number,allowed:(from:{x:number;z:number},to:{x:number;z:number})=>boolean=()=>true){
  const last=this.history.at(-1);if(!last)return null;
  const age=Math.max(0,(now-last.t)/1000),moving=connected&&['mowing','returning'].includes(activity),previous=this.history.at(-2);
  let vx=0,vz=0;
  if(previous){const seconds=(last.t-previous.t)/1000;vx=(last.x-previous.x)/seconds;vz=(last.z-previous.z)/seconds;}
  // Retain minutes of history, but use only recent segments for live direction.
  const recent=this.history.filter(f=>last.t-f.t<=8000);if(recent.length>2){const velocities=recent.slice(1).map((f,i)=>{const seconds=(f.t-recent[i].t)/1000;return{x:(f.x-recent[i].x)/seconds,z:(f.z-recent[i].z)/seconds};});const median=(a:number[])=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];vx=median(velocities.map(v=>v.x));vz=median(velocities.map(v=>v.z));}
  const speed=Math.hypot(vx,vz);if(speed>1.5){vx*=1.5/speed;vz*=1.5/speed;}
  const seconds=moving&&age<15?Math.min(age,6,3/Math.max(Math.hypot(vx,vz),0.001)):0;
  const destination=(!connected||age>=15)&&this.rendered?{...this.rendered}:{x:last.x+vx*seconds,z:last.z+vz*seconds};
  const blocked=this.rendered?!allowed(this.rendered,destination):!allowed(destination,destination);if(blocked&&this.rendered){destination.x=this.rendered.x;destination.z=this.rendered.z;}
  if(!this.rendered){if(blocked)return null;this.rendered={...destination};}
  const blend=1-Math.exp(-Math.max(0,dt)/0.5);this.rendered.x+=(destination.x-this.rendered.x)*blend;this.rendered.z+=(destination.z-this.rendered.z)*blend;
  return {...this.rendered,heading:Math.hypot(vx,vz)>.03?Math.atan2(vx,-vz):last.heading!==undefined?last.heading*Math.PI/180:undefined,blocked,ageSeconds:age,estimated:!blocked&&moving&&age>0.3&&age<15,stale:age>=15||!connected,rejected:this.rejected,label:`${this.rendered.x.toFixed(1)} / ${this.rendered.z.toFixed(1)} m · ${age>=15||!connected?'senast känd':blocked?'utanför körbar yta · osäker':seconds>0?'uppskattad':'uppmätt'}`};
 }
}
