import {jannePhoto,jannePhotoView} from './janne-photo';
import {photoSky} from './photo-sky';
import './yard-photograph.css';
import {yardEnergyCables} from './yard-energy-cables';
import {yardHouse,dwellingOutline} from './yard-house';
import {yardPhotoLighting} from './yard-photo-lighting';
import {yardChimneySmoke} from './yard-chimney-smoke';
import {freshYardWeather,yardWeatherAppearance} from './yard-weather';
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
 let photoId:'home'|'janne'='home';const currentPhoto=()=>photoId==='janne'?jannePhoto:yardPhoto;
 const sky=photoSky();
 const smoke=yardChimneySmoke();
 const nightShade=document.createElementNS('http://www.w3.org/2000/svg','svg');nightShade.classList.add('yard-night-shade');nightShade.setAttribute('aria-hidden','true');nightShade.setAttribute('viewBox','0 0 1920 1080');nightShade.setAttribute('preserveAspectRatio','none');
 // A uniform night grade outside the exact same building outline as the house hotspot.
 // The cutout contains the entire white building, including garage and sunroom.
 const nightSurroundings=document.createElementNS('http://www.w3.org/2000/svg','path');nightSurroundings.setAttribute('d','M0 0H1920V1080H0Z M'+dwellingOutline.trim().split(/\s+/).join('L')+'Z');nightSurroundings.setAttribute('fill-rule','evenodd');nightSurroundings.setAttribute('fill','#080d14');nightSurroundings.setAttribute('fill-opacity','.38');nightShade.append(nightSurroundings);
 const polish=document.createElement('div');polish.className='yard-photo-polish';polish.setAttribute('aria-hidden','true');const atmosphere=document.createElement('div');atmosphere.className='yard-atmosphere';const particles=document.createElement('canvas');particles.className='yard-weather-particles';particles.setAttribute('aria-hidden','true');const lights=document.createElement('div');lights.className='yard-photo-lights';lights.setAttribute('aria-hidden','true');const skyMask=document.createElement('div');skyMask.className='yard-sky-mask';const calibratedPhotoLights=yardPhotoLighting(),house=yardHouse(connection),cableFlow=yardEnergyCables(connection),cables=cableFlow.root,cableNote=document.createElement('small');cableNote.className='yard-cable-note';cableNote.textContent='Energiflöde · schematiska kabelvägar';stage.append(sky.root,image,polish,cables,atmosphere,particles,nightShade,calibratedPhotoLights.fixturesRoot,calibratedPhotoLights.root,lights,skyMask,smoke,house.root,cableNote);document.body.append(stage);document.body.classList.add('yard-photo-shell');
 let home=true,entering=false,disposed=false,failed=false,generation=0,frame=0,lastWeather=0,lastAnimation=0,condition='',solarKey='',sunrise='',sunset='',alignedKey='',lightKey='',variantId=yardPhoto.id,lastHaCondition='';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const view=()=>photoId==='janne'?jannePhotoView(config.value.models[config.value.activeModel]):yardPhotoView(config.value.models[config.value.activeModel]);
 const nap=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
 function crop(){const r=stage.getBoundingClientRect(),canvas=garden.renderer.domElement.getBoundingClientRect(),[fx,fy]=getComputedStyle(image).objectPosition.split(' ').map(v=>parseFloat(v)/100);const scale=Math.min(r.width/currentPhoto().width,r.height/currentPhoto().height),x=(r.width-currentPhoto().width*scale)*(fx??.5),y=(r.height-currentPhoto().height*scale)*(fy??.5),left=r.left+x,top=r.top+y;const rectangle={width:currentPhoto().width*scale+'px',height:currentPhoto().height*scale+'px',left:x+'px',top:y+'px'};Object.assign(image.style,rectangle);Object.assign(polish.style,rectangle);Object.assign(sky.root.style,rectangle);Object.assign(nightShade.style,rectangle);Object.assign(calibratedPhotoLights.root.style,rectangle);Object.assign(calibratedPhotoLights.fixturesRoot.style,rectangle);Object.assign(cables.style,rectangle);Object.assign(skyMask.style,rectangle);Object.assign(smoke.style,rectangle);Object.assign(house.root.style,rectangle);cables.style.setProperty('--cable-unit',String(1000/(currentPhoto().width*scale)));document.body.classList.toggle('photo-map-layout',r.width>=980&&innerHeight>=600&&innerWidth>1100);const imageWidth=currentPhoto().width*scale,cardBaseWidth=Math.max(1600,imageWidth);document.body.style.setProperty('--photo-card-base-width',cardBaseWidth+'px');document.body.style.setProperty('--photo-card-scale',String(imageWidth/cardBaseWidth));document.body.classList.toggle('compact-photo-map',r.width<1250);for(const [name,value]of Object.entries({left,top,width:currentPhoto().width*scale,height:currentPhoto().height*scale}))document.body.style.setProperty('--yard-image-'+name,value+'px');return{x:(canvas.left-left)/scale,y:(canvas.top-top)/scale,width:canvas.width/scale,height:canvas.height/scale};}
 function align(){const v=view();garden.setHomeCamera(yardPhotoView(config.value.models[config.value.activeModel]));garden.photographCamera(v,crop(),yardPhotoGround(config.value.models[config.value.activeModel]),currentPhoto());}
 function updateWeather(){
  const now=new Date(),c=config.value,lat=c.weather?.latitude??c.location.latitude,lon=c.weather?.longitude??c.location.longitude,weather=weatherSnapshot(c,connection.states,connection.connected,connection.source),fresh=freshYardWeather(weather,now.getTime());condition=fresh?weather.state!.state:'';
  const appearance=yardWeatherAppearance(condition,solarPosition(now,lat,lon).elevation),janneVariant=jannePhoto.variants.find(v=>v.light===appearance.light),variant=photoId==='janne'?{...jannePhoto,id:jannePhoto.id+'-'+(janneVariant?.light??'all'),image:janneVariant?.image??jannePhoto.image}:selectYardPhoto(c.activeModel,appearance.day<.3);
  if(variant.id!==variantId){variantId=variant.id;image.srcset=currentPhoto().widths.map(w=>variant.image(w)+' '+w+'w').join(',');image.src=variant.image(photoId==='janne'?1672:1920);}
  stage.dataset.weather=appearance.kind;stage.dataset.light=appearance.light;
  stage.dataset.weatherSource=fresh?(connection.source==='simulator'?'simulator':weather.source):'unavailable';stage.dataset.weatherCondition=condition||'unknown';stage.dataset.weatherValidTime=String(weather.state?.attributes.forecast_valid_time??weather.state?.last_reported??weather.state?.last_updated??'');
  for(const [name,value]of Object.entries({brightness:appearance.brightness,saturation:appearance.saturation,contrast:appearance.contrast,night:appearance.night,sunlight:appearance.sunlight,'night-strength':appearance.nightStrength}))stage.style.setProperty('--photo-'+name,String(value));
  if(photoId==='janne'){stage.style.setProperty('--photo-brightness',String(.30+.70*appearance.day));stage.style.setProperty('--photo-saturation',String(.60+.40*appearance.day));}
  const localDay=new Intl.DateTimeFormat('sv-SE',{timeZone:c.location.timeZone??'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),key=localDay+lat+','+lon;
  if(key!==solarKey){solarKey=key;const start=new Date(localDay+'T00:00:00Z'),observer=new Observer(lat,lon,0),rise=SearchRiseSet(Body.Sun,observer,1,start,1),set=SearchRiseSet(Body.Sun,observer,-1,start,1);sunrise=rise?.date.toISOString()??'';sunset=set?.date.toISOString()??'';stage.dataset.sunrise=sunrise;stage.dataset.sunset=sunset;}
  stage.title='Fotografi · '+(fresh?weather.description+' · '+weather.label:'Väderdata saknas – neutral atmosfär')+' · astronomisk soluppgång '+(sunrise?new Date(sunrise).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit',timeZone:c.location.timeZone??'Europe/Stockholm'}):'saknas denna dag')+' / solnedgång '+(sunset?new Date(sunset).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit',timeZone:c.location.timeZone??'Europe/Stockholm'}):'saknas denna dag');
 }
 function updateLights(){
  const handled=calibratedPhotoLights.update(config.value,connection.states,connection.connected),r=stage.getBoundingClientRect(),items=connection.connected?config.value.objects.filter(o=>o.type==='light'&&!handled.has(o.entityId)&&o.placementConfirmed===true&&connection.states.get(o.entityId)?.state==='on').map(o=>({o,p:garden.photographObject(o.id)})).filter(v=>v.p):[];
  const key=JSON.stringify(items.map(({o,p})=>[o.id,p!.x,p!.y,o.color]));if(key===lightKey)return;lightKey=key;lights.replaceChildren(...items.map(({o,p})=>{const dot=document.createElement('i');dot.style.left=p!.x-r.left+'px';dot.style.top=p!.y-r.top+'px';dot.style.background=o.color;return dot;}));
 }
 function refresh(){if(disposed)return;const active=home&&!failed&&(document.body.dataset.appRoute===undefined||document.body.dataset.appRoute==='/');
  house.update(active&&!entering&&photoId==='home');stage.classList.toggle('is-home',active);document.body.classList.toggle('yard-photo-home',active);if(!active||entering)return;
  const desired=view(),actual=garden.captureView(),key=JSON.stringify([desired,crop()]);if(key!==alignedKey||actual.position.some((v,i)=>Math.abs(v-desired.position[i])>.01)){alignedKey=key;align();}
  if(image.complete&&image.naturalWidth)garden.pauseRendering(true);
  const haCondition=connection.states.get(connection.source==='simulator'?'weather.home':config.value.bindings.weather)?.state??'';if(haCondition!==lastHaCondition){lastHaCondition=haCondition;lastWeather=0;}if(Date.now()-lastWeather>10000){lastWeather=Date.now();updateWeather();}if(photoId==='home'){updateLights();cableFlow.update();}sky.update(config.value,connection.states,connection.connected,connection.source,view(),photoId==='janne',stage.dataset.weatherSource!=='unavailable');
 }
 const move=(e:PointerEvent)=>{if(!home||entering||reduced.matches||!fine.matches)return;const r=stage.getBoundingClientRect();stage.style.setProperty('--photo-dx',((e.clientX-r.left)/r.width-.5)*3+'px');stage.style.setProperty('--photo-dy',((e.clientY-r.top)/r.height-.5)*2+'px');};
 const resetMotion=()=>{stage.style.setProperty('--photo-dx','0px');stage.style.setProperty('--photo-dy','0px');};
 const drops=Array.from({length:46},(_,i)=>({x:((i*73+19)%997)/997,y:((i*137+17)%991)/991,s:.5+(i%5)/5}));
 function animate(t:number){frame=requestAnimationFrame(animate);if(t-lastAnimation<40)return;lastAnimation=t;const ctx=particles.getContext('2d');if(!ctx)return;const r=stage.getBoundingClientRect(),w=Math.ceil(r.width/2),h=Math.ceil(r.height/2);if(particles.width!==w||particles.height!==h){particles.width=w;particles.height=h;}ctx.clearRect(0,0,w,h);if(!home||reduced.matches||document.hidden||!['rain','snow','sleet'].includes(stage.dataset.weather??''))return;const snow=stage.dataset.weather==='snow',sleet=stage.dataset.weather==='sleet';ctx.strokeStyle='#c3d3e94a';ctx.fillStyle='#ebf0f7a6';ctx.lineWidth=.55;
  for(const d of drops){const flake=snow||sleet&&d.s>.9,x=(d.x*w+(flake?Math.sin(t*.0004+d.x*5)*5:-t*.007*d.s))%w,y=(d.y*h+t*(flake?.012:.1)*d.s)%h;ctx.beginPath();if(flake){ctx.arc(x,y,.65+d.s*.55,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(x,y);ctx.lineTo(x-2,y+7+d.s*5);ctx.stroke();}}
 }
 image.onerror=()=>{failed=true;stage.classList.add('image-failed');refresh();garden.pauseRendering(false);};image.onload=()=>{stage.classList.add('image-ready');refresh();};
 const weatherChanged=()=>{lastWeather=0;refresh();};window.addEventListener('hem-weather-updated',weatherChanged);const resize=()=>{alignedKey='';refresh();},motionChange=()=>resetMotion();document.addEventListener('pointermove',move,{passive:true});window.addEventListener('blur',resetMotion);window.addEventListener('resize',resize);reduced.addEventListener('change',motionChange);document.addEventListener('hem-route-changed',refresh);const timer=setInterval(refresh,500);const preloadTimer=setTimeout(()=>{if(!disposed&&!document.hidden){const preview=new Image();preview.src=jannePhoto.image(960);}},2000);frame=requestAnimationFrame(animate);refresh();
 async function showPhoto(id:'home'|'janne'){
  if(photoId===id&&!entering){home=true;refresh();return;}
  const n=++generation;entering=true;house.update(false);resetMotion();garden.controls.enabled=false;
  try{
   const model=config.value.models[config.value.activeModel],exchange=(config.value as typeof config.value&{modelExchange?:{active?:{sourceFrameId?:string}}}).modelExchange?.active;
   if(exchange?.sourceFrameId!==yardPhoto.sourceFrame)throw Error('Fotovyn saknar motsvarande kalibrerad källram.');
   const target=id==='janne'?jannePhotoView(model):yardPhotoView(model),definition=id==='janne'?jannePhoto:yardPhoto;
   const preload=new Image();preload.src=definition.image(id==='janne'?1672:1920);await preload.decode();
   if(n!==generation||disposed)return;
   if(garden.models.active!==config.value.activeModel)await garden.models.select(config.value.activeModel,model);
   await garden.ready();if(n!==generation||disposed)return;
   align();garden.pauseRendering(false);stage.classList.add('is-leaving');
   if(!reduced.matches)await nap(850);if(n!==generation||disposed)return;
   if(reduced.matches)garden.photographCamera(target,crop(),yardPhotoGround(model),currentPhoto());
   else await Promise.race([new Promise<void>(resolve=>garden.photoTransition(target,resolve)),nap(6500)]);
   if(n!==generation||disposed)return;
   photoId=id;stage.dataset.photoView=id;stage.dataset.calibration=id==='janne'?'preliminary-roof-landmark-fit':'approximate-manual-landmark-fit';
   document.body.dataset.yardPhotoView=id;image.width=definition.width;image.height=definition.height;
   image.alt=id==='janne'?'Hus 2 med solpaneler och väderstyrd himmel':'Gården i Kyrkås med bostadshuset och garaget';
   image.srcset=definition.widths.map(w=>definition.image(w)+' '+w+'w').join(',');image.src=definition.image(id==='janne'?1672:1920);await image.decode();
   if(n!==generation||disposed)return;
   home=true;failed=false;stage.classList.remove('image-failed');lastWeather=0;variantId='';alignedKey='';align();entering=false;refresh();
   stage.classList.remove('is-leaving');
  }catch(error){if(n===generation){stage.classList.remove('is-leaving');throw error;}}
  finally{if(n===generation){entering=false;refresh();}}
 }
 return{showPhoto,
  home(value:boolean){if(value&&photoId==='janne'){void showPhoto('home').catch(()=>{});return;}home=value;entering=false;house.update(value&&photoId==='home');if(value){alignedKey='';refresh();}else{stage.classList.remove('is-home');document.body.classList.remove('yard-photo-home');}garden.controls.enabled=!value;if(!value)garden.pauseRendering(false);},
  async enter(action:()=>void){if(!home){await garden.ready();action();return;}const n=++generation;entering=true;house.update(false);resetMotion();if(innerWidth<=1100)window.scrollTo({top:0,behavior:'instant'});garden.pauseRendering(false);try{const c=config.value,exchange=(c as typeof c&{modelExchange?:{active?:{sourceFrameId?:string}}}).modelExchange;if(exchange?.active?.sourceFrameId!==yardPhoto.sourceFrame)throw Error('Gårdsmodellen som hör till startbilden är inte importerad på denna dator. Bilden ligger kvar.');await garden.models.select(c.activeModel,c.models[c.activeModel]);await garden.ready();if(n!==generation||disposed)return;align();await nap(80);if(n!==generation)return;stage.classList.add('is-leaving');if(!reduced.matches)await nap(850);if(n!==generation)return;home=false;stage.classList.remove('is-home','is-leaving');document.body.classList.remove('yard-photo-home');action();}finally{if(n===generation)entering=false;}},
  cancel(){++generation;garden.cancelFollow();entering=false;stage.classList.remove('is-leaving');},
  dispose(){disposed=true;++generation;clearInterval(timer);clearTimeout(preloadTimer);sky.dispose();delete document.body.dataset.yardPhotoView;calibratedPhotoLights.dispose();house.dispose();window.removeEventListener('hem-weather-updated',weatherChanged);cancelAnimationFrame(frame);document.removeEventListener('pointermove',move);window.removeEventListener('blur',resetMotion);window.removeEventListener('resize',resize);reduced.removeEventListener('change',motionChange);document.removeEventListener('hem-route-changed',refresh);stage.remove();document.body.classList.remove('yard-photo-shell','yard-photo-home','photo-map-layout','compact-photo-map');}
 };
}
