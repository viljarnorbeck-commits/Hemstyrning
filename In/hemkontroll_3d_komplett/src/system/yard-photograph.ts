import './yard-photograph.css';
import {Body,Observer,SearchRiseSet} from 'astronomy-engine';
import {yardPhoto,yardPhotoView,yardPhotoGround,selectYardPhoto} from './yard-photo-config';
import {weatherSnapshot} from './weather-source';
import {solarPosition} from './environment';
import type {Configuration} from './configuration';
import type {Connection} from './connection';
import type {GardenScene} from './scene';

/** One stable DOM image. Sensor events update atmosphere, never its URL or decode. */
export function yardPhotograph(config:Configuration,connection:Connection,garden:GardenScene){
 const stage=document.createElement('figure');stage.className='yard-photograph';stage.setAttribute('aria-label','Gården i Kyrkås');
 const image=document.createElement('img');image.alt='Gården i Kyrkås med bostadshuset, garaget, timmerbyggnaden och uppfarten';image.decoding='async';image.fetchPriority='high';
 image.srcset=yardPhoto.widths.map(w=>yardPhoto.image(w)+' '+w+'w').join(',');image.sizes='(max-width: 600px) 135vw, (max-width: 1100px) 100vw, calc(100vw - 200px)';image.src=yardPhoto.image(1920);image.width=yardPhoto.width;image.height=yardPhoto.height;
 const atmosphere=document.createElement('div');atmosphere.className='yard-atmosphere';const particles=document.createElement('canvas');particles.className='yard-weather-particles';particles.setAttribute('aria-hidden','true');const lights=document.createElement('div');lights.className='yard-photo-lights';lights.setAttribute('aria-hidden','true');stage.append(image,atmosphere,particles,lights);document.body.append(stage);document.body.classList.add('yard-photo-shell');
 let home=true,entering=false,disposed=false,failed=false,generation=0,frame=0,lastWeather=0,lastAnimation=0,condition='',solarKey='',sunrise='',sunset='',alignedKey='',lightKey='',variantId=yardPhoto.id;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const view=()=>yardPhotoView(config.value.models[config.value.activeModel]);
 const nap=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
 function crop(){const r=stage.getBoundingClientRect(),canvas=garden.renderer.domElement.getBoundingClientRect(),cover=innerWidth<=600,[fx,fy]=getComputedStyle(image).objectPosition.split(' ').map(v=>parseFloat(v)/100);const scale=(cover?Math.max:Math.min)(r.width/yardPhoto.width,r.height/yardPhoto.height),x=(r.width-yardPhoto.width*scale)*(fx??.5),y=(r.height-yardPhoto.height*scale)*(fy??.5),left=r.left+x,top=r.top+y;Object.assign(image.style,{width:yardPhoto.width*scale+'px',height:yardPhoto.height*scale+'px',left:x+'px',top:y+'px'});return{x:(canvas.left-left)/scale,y:(canvas.top-top)/scale,width:canvas.width/scale,height:canvas.height/scale};}
 function align(){const v=view();garden.setHomeCamera(v);garden.photographCamera(v,crop(),yardPhotoGround(config.value.models[config.value.activeModel]));}
 function updateWeather(){
  const now=new Date(),c=config.value,lat=c.weather?.latitude??c.location.latitude,lon=c.weather?.longitude??c.location.longitude,weather=weatherSnapshot(c,connection.states,connection.connected,connection.source),fresh=weather.connected&&weather.state&&!['unavailable','unknown'].includes(weather.state.state);condition=fresh?weather.state!.state:'';
  const elevation=solarPosition(now,lat,lon).elevation,day=Math.max(0,Math.min(1,(elevation+7)/15)),rain=['rainy','pouring','lightning-rainy','snowy-rainy'].includes(condition),snow=['snowy','snowy-rainy'].includes(condition),clear=['sunny','partlycloudy'].includes(condition);
  const variant=selectYardPhoto(c.activeModel,day<.3);if(variant.id!==variantId){variantId=variant.id;image.srcset=yardPhoto.widths.map(w=>variant.image(w)+' '+w+'w').join(',');image.src=variant.image(1920);}
  stage.dataset.weather=snow?'snow':rain?'rain':condition==='fog'?'fog':clear?'sunny':'neutral';stage.dataset.light=day<.3?'night':day<.75?'evening':'day';
  stage.style.setProperty('--photo-brightness',String((.67+.33*day)*(rain?.94:clear?1.035:1)));stage.style.setProperty('--photo-saturation',String(.88+day*.12));stage.style.setProperty('--photo-night',String((1-day)*.18));
  const localDay=new Intl.DateTimeFormat('sv-SE',{timeZone:c.location.timeZone??'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),key=localDay+lat+','+lon;
  if(key!==solarKey){solarKey=key;const start=new Date(localDay+'T00:00:00Z'),observer=new Observer(lat,lon,0),rise=SearchRiseSet(Body.Sun,observer,1,start,1),set=SearchRiseSet(Body.Sun,observer,-1,start,1);sunrise=rise?.date.toISOString()??'';sunset=set?.date.toISOString()??'';stage.dataset.sunrise=sunrise;stage.dataset.sunset=sunset;}
  stage.title='Fotografi · '+(fresh?weather.description+' · '+weather.label:'Väderdata saknas – neutral atmosfär')+' · astronomisk soluppgång '+(sunrise?new Date(sunrise).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit',timeZone:c.location.timeZone??'Europe/Stockholm'}):'saknas denna dag')+' / solnedgång '+(sunset?new Date(sunset).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit',timeZone:c.location.timeZone??'Europe/Stockholm'}):'saknas denna dag');
 }
 function updateLights(){
  const r=stage.getBoundingClientRect(),items=connection.connected?config.value.objects.filter(o=>o.type==='light'&&o.placementConfirmed===true&&connection.states.get(o.entityId)?.state==='on').map(o=>({o,p:garden.photographObject(o.id)})).filter(v=>v.p):[];
  const key=JSON.stringify(items.map(({o,p})=>[o.id,p!.x,p!.y,o.color]));if(key===lightKey)return;lightKey=key;lights.replaceChildren(...items.map(({o,p})=>{const dot=document.createElement('i');dot.style.left=p!.x-r.left+'px';dot.style.top=p!.y-r.top+'px';dot.style.background=o.color;return dot;}));
 }
 function refresh(){if(disposed)return;const active=home&&!failed&&(document.body.dataset.appRoute===undefined||document.body.dataset.appRoute==='/');
  stage.classList.toggle('is-home',active);document.body.classList.toggle('yard-photo-home',active);if(!active||entering)return;
  const desired=view(),actual=garden.captureView(),key=JSON.stringify([desired,crop()]);if(key!==alignedKey||actual.position.some((v,i)=>Math.abs(v-desired.position[i])>.01)){alignedKey=key;align();}
  if(image.complete&&image.naturalWidth)garden.pauseRendering(true);
  if(Date.now()-lastWeather>10000){lastWeather=Date.now();updateWeather();}updateLights();
 }
 const move=(e:PointerEvent)=>{if(!home||entering||reduced.matches||!fine.matches)return;const r=stage.getBoundingClientRect();image.style.setProperty('--photo-dx',((e.clientX-r.left)/r.width-.5)*3+'px');image.style.setProperty('--photo-dy',((e.clientY-r.top)/r.height-.5)*2+'px');};
 const resetMotion=()=>{image.style.setProperty('--photo-dx','0px');image.style.setProperty('--photo-dy','0px');};
 const drops=Array.from({length:46},(_,i)=>({x:((i*73+19)%997)/997,y:((i*137+17)%991)/991,s:.5+(i%5)/5}));
 function animate(t:number){frame=requestAnimationFrame(animate);if(t-lastAnimation<40)return;lastAnimation=t;const ctx=particles.getContext('2d');if(!ctx)return;const r=stage.getBoundingClientRect(),w=Math.ceil(r.width/2),h=Math.ceil(r.height/2);if(particles.width!==w||particles.height!==h){particles.width=w;particles.height=h;}ctx.clearRect(0,0,w,h);if(!home||reduced.matches||document.hidden||!['rain','snow'].includes(stage.dataset.weather??''))return;const snow=stage.dataset.weather==='snow';ctx.strokeStyle='#c3d3e94a';ctx.fillStyle='#ebf0f7a6';ctx.lineWidth=.55;
  for(const d of drops){const x=(d.x*w+(snow?Math.sin(t*.0004+d.x*5)*5:-t*.007*d.s))%w,y=(d.y*h+t*(snow?.012:.1)*d.s)%h;ctx.beginPath();if(snow){ctx.arc(x,y,.65+d.s*.55,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(x,y);ctx.lineTo(x-2,y+7+d.s*5);ctx.stroke();}}
 }
 image.onerror=()=>{failed=true;stage.classList.add('image-failed');refresh();garden.pauseRendering(false);};image.onload=()=>{stage.classList.add('image-ready');refresh();};
 const resize=()=>{alignedKey='';refresh();},motionChange=()=>resetMotion();document.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',resetMotion);window.addEventListener('resize',resize);reduced.addEventListener('change',motionChange);document.addEventListener('hem-route-changed',refresh);const timer=setInterval(refresh,500);frame=requestAnimationFrame(animate);refresh();
 return{
  home(value:boolean){home=value;entering=false;if(value){alignedKey='';refresh();}else{stage.classList.remove('is-home');document.body.classList.remove('yard-photo-home');}garden.controls.enabled=!value;if(!value)garden.pauseRendering(false);},
  async enter(action:()=>void){if(!home){await garden.ready();action();return;}const n=++generation;entering=true;resetMotion();if(innerWidth<=1100)window.scrollTo({top:0,behavior:'instant'});garden.pauseRendering(false);try{const c=config.value,exchange=(c as typeof c&{modelExchange?:{active?:{sourceFrameId?:string}}}).modelExchange;if(exchange?.active?.sourceFrameId!==yardPhoto.sourceFrame)throw Error('Gårdsmodellen som hör till startbilden är inte importerad på denna dator. Bilden ligger kvar.');await garden.models.select(c.activeModel,c.models[c.activeModel]);await garden.ready();if(n!==generation||disposed)return;align();await nap(80);if(n!==generation)return;stage.classList.add('is-leaving');if(!reduced.matches)await nap(850);if(n!==generation)return;home=false;stage.classList.remove('is-home','is-leaving');document.body.classList.remove('yard-photo-home');action();}finally{if(n===generation)entering=false;}},
  cancel(){++generation;entering=false;stage.classList.remove('is-leaving');},
  dispose(){disposed=true;++generation;clearInterval(timer);cancelAnimationFrame(frame);document.removeEventListener('pointermove',move);window.removeEventListener('blur',resetMotion);window.removeEventListener('resize',resize);reduced.removeEventListener('change',motionChange);document.removeEventListener('hem-route-changed',refresh);stage.remove();document.body.classList.remove('yard-photo-shell','yard-photo-home');}
 };
}
