import {PerspectiveCamera,Vector3} from 'three';
import {starDirection} from './astronomy';
import {environmentTarget,liveInputs} from './environment';
import type {CameraView,SceneConfig,HassState} from './types';

/** A low-frequency photo sky using the same weather, astronomy and HYG catalogue as 3D. */
export function photoSky(){
 const root=document.createElement('canvas');root.className='yard-dynamic-sky';root.setAttribute('aria-hidden','true');root.hidden=true;
 let catalogue:number[][]=[],disposed=false,last=0,gradedCloud:number|undefined;
 void fetch('/config/stars.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then((data:{stars:number[][]})=>{if(!disposed)catalogue=data.stars;}).catch(()=>{/* Missing real catalogue means no substitute stars. */});
 const camera=new PerspectiveCamera(),cloud=document.createElement('canvas');cloud.width=160;cloud.height=90;
 // Fixed procedural cloud texture, not a fabricated star field.
 const cloudContext=cloud.getContext('2d')!,pixels=cloudContext.createImageData(160,90);
 const hash=(x:number,y:number)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
 const noise=(x:number,y:number)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;};
 for(let y=0;y<90;y++)for(let x=0;x<160;x++){let sum=0,weight=0;for(let octave=0;octave<4;octave++){const f=2**octave,w=1/f;sum+=noise(x*f*.035+octave*17,y*f*.04+octave*7)*w;weight+=w;}const i=(y*160+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=200;pixels.data[i+3]=Math.round(Math.max(0,Math.min(1,(sum/weight-.23)*1.9))*220);}
 cloudContext.putImageData(pixels,0,0);
 function update(config:SceneConfig,states:Map<string,HassState>,connected:boolean,source:string,view:CameraView,visible:boolean,weatherFresh:boolean){
  root.hidden=!visible;if(!visible||document.hidden||disposed||Date.now()-last<1000)return;last=Date.now();
  const width=Math.min(1672,Math.max(960,Math.round(root.getBoundingClientRect().width))),height=Math.round(width*941/1672);
  if(root.width!==width||root.height!==height){root.width=width;root.height=height;}
  const ctx=root.getContext('2d');if(!ctx)return;
  const date=new Date(),input=liveInputs(config,states,connected,+date,source),targetCloud=weatherFresh?input.cloud:1;gradedCloud=gradedCloud===undefined?targetCloud:gradedCloud+(targetCloud-gradedCloud)*.12;const cloudCover=gradedCloud;
  const frame=environmentTarget({...input,date,latitude:config.weather?.latitude??config.location.latitude,longitude:config.weather?.longitude??config.location.longitude,northOffset:config.location.northOffset,cloud:cloudCover,sensorWeight:0,brightness:1});
  camera.fov=view.fov;camera.aspect=1672/941;camera.position.fromArray(view.position);camera.lookAt(new Vector3(...view.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const project=(direction:readonly number[])=>{const point=new Vector3(...direction as [number,number,number]).multiplyScalar(1000).add(camera.position).project(camera);return point.z>1||point.z< -1||Math.abs(point.x)>1.1||Math.abs(point.y)>1.1?null:{x:(point.x*.5+.5)*width,y:(.5-point.y*.5)*height};};
  const day=frame.daylight,dusk=Math.max(0,1-Math.abs(frame.elevation+2)/11),mix=(a:number[],b:number[],t:number)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t)),rgb=(c:number[])=>'rgb('+c.join(',')+')';
  const top=mix([5,10,23],mix([44,111,184],[112,123,137],cloudCover),day).map(v=>Math.round(v*(frame.rain>.05?.72:1))),bottom=mix([27,32,48],mix([163,200,222],[176,181,187],cloudCover),day).map(v=>Math.round(v*(frame.rain>.05?.85:1)));
  const gradient=ctx.createLinearGradient(0,0,0,height*.58);gradient.addColorStop(0,rgb(top));gradient.addColorStop(1,rgb(bottom));ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  const sun=project(frame.sunDirection);
  if(dusk>.01){const glow=ctx.createRadialGradient(sun?.x??width*.5,height*.43,0,sun?.x??width*.5,height*.43,width*.65);glow.addColorStop(0,'rgba(234,139,114,'+(dusk*(1-cloudCover*.65)*.65)+')');glow.addColorStop(1,'rgba(234,139,114,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);}
  if((frame.starVisibility??0)>.015&&cloudCover<.78){
   for(const star of catalogue){const dir=starDirection(star[0],star[1],date,config.location.latitude,config.location.longitude,config.location.northOffset);if(dir[1]<.015)continue;const p=project(dir);if(!p)continue;const opacity=Math.min(1,(frame.starVisibility??0)*(1.25-star[2]/8));if(opacity<.015)continue;ctx.fillStyle='rgba(225,235,255,'+opacity+')';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.45,(2-star[2]*.22)*width/1672),0,Math.PI*2);ctx.fill();}
  }
  if(sun&&frame.elevation>-.5&&cloudCover<.78){const radius=Math.max(2,height/(2*Math.tan(view.fov*Math.PI/360))*Math.tan(.27*Math.PI/180));const halo=ctx.createRadialGradient(sun.x,sun.y,0,sun.x,sun.y,radius*10);halo.addColorStop(0,'rgba(255,241,202,'+(1-cloudCover)+')');halo.addColorStop(1,'rgba(255,241,202,0)');ctx.fillStyle=halo;ctx.fillRect(sun.x-radius*10,sun.y-radius*10,radius*20,radius*20);ctx.fillStyle='#fff4d8';ctx.beginPath();ctx.arc(sun.x,sun.y,radius,0,Math.PI*2);ctx.fill();}
  const moon=frame.moonDirection&&project(frame.moonDirection);
  if(moon&&(frame.moonAltitude??-90)>0&&cloudCover<.85){
   const radius=Math.max(3,height/(2*Math.tan(view.fov*Math.PI/360))*Math.tan(.26*Math.PI/180));
   // Illuminate a spherical disc from the actual solar direction in camera space.
   const right=new Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new Vector3(0,1,0).applyQuaternion(camera.quaternion),front=new Vector3(...frame.moonDirection!).negate(),sunDirection=new Vector3(...frame.sunDirection);
   const light=new Vector3(sunDirection.dot(right),sunDirection.dot(up),sunDirection.dot(front)).normalize();
   ctx.globalAlpha=(1-cloudCover)*(1-day*.65);for(let y=-Math.ceil(radius);y<=radius;y++)for(let x=-Math.ceil(radius);x<=radius;x++){const nx=x/radius,ny=-y/radius,r=nx*nx+ny*ny;if(r>1)continue;const brightness=Math.max(.035,nx*light.x+ny*light.y+Math.sqrt(1-r)*light.z),v=Math.round(220*brightness);ctx.fillStyle=`rgb(${v},${Math.min(255,v+3)},${Math.min(255,v+9)})`;ctx.fillRect(moon.x+x,moon.y+y,1,1);}ctx.globalAlpha=1;
  }
  // Cloud coverage obscures stars and moon as well as changing the daylight grade.
  ctx.globalAlpha=cloudCover*(.3+.55*day);ctx.globalCompositeOperation=day>.25?'source-over':'multiply';const drift=matchMedia('(prefers-reduced-motion:reduce)').matches?0:(+date/180000)%1;ctx.drawImage(cloud,-drift*width,0,width*2,height*.65);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  root.dataset.weatherFresh=String(weatherFresh);root.dataset.starCount=String(catalogue.length);root.dataset.moonFraction=String(frame.moonFraction??0);root.dataset.sunElevation=String(frame.elevation);
 }
 return{root,update,dispose(){disposed=true;root.remove();}};
}
