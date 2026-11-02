import {readFile,writeFile,mkdir,readdir,access,rename} from 'node:fs/promises';
import path from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {sha256,baselineFrame,safeFile,validateRelease} from './model-exchange-lib.mjs';
const root=path.resolve(process.env.HEM_MODEL_EXCHANGE_DIR??'C:/Hemstyrning-3D-utbyte');
const parsed=new URL(process.env.HEM_MODEL_EXCHANGE_API??'http://127.0.0.1:5173');if(!['http:','https:'].includes(parsed.protocol)||!['127.0.0.1','localhost','[::1]'].includes(parsed.hostname)||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)throw Error('Importören kräver en lokal Hemstyrning-adress.');const base=parsed.origin;
const endpoint='/workspace-api/model-exchange',observed=new Map();let previousStatus='';
async function api(route,options={}){const response=await fetch(base+route,{signal:AbortSignal.timeout(120000),...options});const body=await response.json();if(!response.ok)throw Object.assign(Error(body.message??'Hemstyrning svarade '+response.status),{retryable:response.status>=500||response.status===409});return body;}
const post=(route,body)=>api(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
async function jsonFile(relative,value,immutable=false){const filename=path.join(root,relative);await mkdir(path.dirname(filename),{recursive:true});const content=JSON.stringify(value,null,2)+'\n';if(immutable){try{await writeFile(filename,content,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;const previous=JSON.parse(await readFile(filename,'utf8'));if(JSON.stringify(previous)!==JSON.stringify(value))throw Error('Den frysta utbytesreferensen har ändrats: '+relative);}return;}try{if(await readFile(filename,'utf8')===content)return;}catch(error){if(error.code!=='ENOENT')throw error;}const temporary=filename+'.'+process.pid+'.tmp';await writeFile(temporary,content);await rename(temporary,filename);}
async function request(key,description,version){const id=('hemstyrning-'+key).replace(/[^a-zA-Z0-9_.-]/g,'-').slice(0,99);const file=path.join(root,'requests',id+'.json');try{await access(file);return;}catch{}await jsonFile('requests/'+id+'.json',{id,category:'calibration',description,modelVersion:version,createdAt:new Date().toISOString()});}
function status(message){if(message!==previousStatus){console.log(new Date().toISOString()+' · '+message);previousStatus=message;}}
async function receipt(relative,value){await jsonFile('access-checks/'+relative,value);}
async function prepare(){
 await mkdir(path.join(root,'consumer'),{recursive:true});await mkdir(path.join(root,'requests'),{recursive:true});
 let state=await api(endpoint);let frame=state.exchange?.frame;
 if(!frame){
  const active=state.models[state.activeModel];if(!/^\/(?:models\/[\w.-]+|workspace-api\/models\/[a-f0-9]{64})\.glb$/.test(active.url))throw Error('Referensmodellen måste vara en lokal GLB.');
  const response=await fetch(base+active.url,{signal:AbortSignal.timeout(120000)});if(!response.ok)throw Error('Nuvarande referensmodell går inte att läsa.');const bytes=Buffer.from(await response.arrayBuffer());
  const model=Object.fromEntries(['url','label','verified','position','rotation','scale','appearance'].filter(key=>active[key]!==undefined).map(key=>[key,active[key]]));
  const candidate=await baselineFrame(bytes,model);frame=(await post(endpoint+'/initialize',{frame:candidate,expectedModelRevision:state.modelRevision})).frame;
  if(frame.baseline.sha256===sha256(bytes))await writeFile(path.join(root,'consumer','yard-reference.glb'),bytes,{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
  state=await api(endpoint);
 }
 // Export the original immutable reference even after another model becomes active.
 const reference=path.join(root,'consumer','yard-reference.glb');try{if(sha256(await readFile(reference))!==frame.baseline.sha256)throw Error('Referensfilens SHA256 har ändrats.');}catch(error){if(error.code!=='ENOENT')throw error;const response=await fetch(base+frame.baseline.model.url,{signal:AbortSignal.timeout(120000)});const bytes=Buffer.from(await response.arrayBuffer());if(!response.ok||sha256(bytes)!==frame.baseline.sha256)throw Error('Den ursprungliga frysta referensmodellen saknas.');await writeFile(reference,bytes,{flag:'wx'});}
 await jsonFile('consumer/coordinate-system.json',frame,true);
 await jsonFile('consumer/status.json',{frameId:frame.id,selectedVersion:state.exchange?.active?.version??'legacy-reference',selected:state.exchange?.active??null,referenceSha256:frame.baseline.sha256,activeModel:state.activeModel});
 const scene=await api('/workspace-api/scene');
 await jsonFile('consumer/current-placements.json',{frameId:frame.id,description:'Existing local positions, not surveyed GPS. Do not move these objects when registering new geometry.',objects:scene.objects.map(o=>({id:o.id,name:o.name,type:o.type,position:o.position,rotation:o.rotation,scale:o.scale,placementConfirmed:o.placementConfirmed===true}))});
 try{const probeBytes=await readFile(path.join(root,'access-checks','probe.json')),probe=JSON.parse(probeBytes);await receipt('hemstyrning-probe.json',{schemaVersion:1,project:'Hemstyrning',cwd:process.cwd(),nonce:probe.nonce,readAt:new Date().toISOString(),files:[{path:'access-checks/probe.json',sha256:sha256(probeBytes)},{path:'consumer/coordinate-system.json',sha256:sha256(await readFile(path.join(root,'consumer','coordinate-system.json')))}],completeDeliveryRead:false});}catch(error){if(error.code!=='ENOENT')throw error;}
 return {state,frame};
}
async function sync(){
 const {state,frame}=await prepare();const candidates=[];
 let fingerprints={};try{fingerprints=JSON.parse(await readFile(path.join(root,'consumer','seen-manifests.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 for(const folder of ['versions','releases']){
  let entries;try{entries=await readdir(path.join(root,folder),{withFileTypes:true});}catch(error){if(error.code==='ENOENT')continue;throw error;}
  for(const entry of entries){if(!entry.isDirectory()||!(/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/).test(entry.name))continue;
   const directory=path.join(root,folder,entry.name);let bytes,manifest;try{bytes=await safeFile(directory,'manifest.json',1024*1024);manifest=JSON.parse(bytes.toString('utf8'));}catch{continue;}
   if(!(manifest.status==='published'||manifest.ready===true&&manifest.status==='complete'))continue;
   const digest=sha256(bytes),version=manifest.version??manifest.modelVersion;
   const publication=folder+'/'+entry.name;
   if(fingerprints[publication]&&fingerprints[publication]!==digest){await request(entry.name+'-republished','En färdigpublicerad versions manifest har ändrats sedan det först lästes. Publicera en ny version.',entry.name);continue;}
   if(!fingerprints[publication]){fingerprints[publication]=digest;await jsonFile('consumer/seen-manifests.json',fingerprints);}
   const imported=state.exchange?.imports.find(item=>item.version===version);
   if(imported){if(imported.manifestSha256!==digest)await request(entry.name+'-mutated','En redan importerad oföränderlig version har ändrats. Publicera en ny version.',entry.name);continue;}
   if(state.exchange?.active&&Date.parse(manifest.publishedAt??manifest.createdAt)<=Date.parse(state.exchange.active.publishedAt))continue;
   if(observed.has(directory)){if(observed.get(directory)!==digest)await request(entry.name+'-republished','En tidigare färdigpublicerad version ändrades. Publicera en ny version, även om den gamla inte kunde aktiveras.',entry.name);continue;}candidates.push({directory,bytes,digest,manifest});
  }
 }
 candidates.sort((a,b)=>Date.parse(b.manifest.publishedAt??b.manifest.createdAt)-Date.parse(a.manifest.publishedAt??a.manifest.createdAt));
 for(const candidate of candidates){
  const version=path.basename(candidate.directory);let readReceipt;
  try{
   const result=await validateRelease(candidate.directory,candidate.bytes,frame,{onFilesRead:async proof=>{let nonce;try{nonce=JSON.parse(await readFile(path.join(root,'access-checks','probe.json'),'utf8')).nonce;}catch{}readReceipt={...proof,nonce,project:'Hemstyrning',cwd:process.cwd(),readAt:new Date().toISOString(),validationPassed:null,activated:false};await receipt('hemstyrning-'+version+'.json',readReceipt);}});
   // A receipt states actual reads, never a claim that geometry is complete.
   await receipt('hemstyrning-'+version+'.json',{...readReceipt,validationPassed:true,activated:false});
   const fresh=await api(endpoint);if(fresh.exchange?.imports.some(item=>item.version===result.version))return;
   const response=await fetch(base+'/workspace-api/models',{method:'POST',headers:{'Content-Type':'model/gltf-binary'},body:result.embedded,signal:AbortSignal.timeout(120000)}),uploaded=await response.json();if(!response.ok)throw Error(uploaded.message??'Modelluppladdningen misslyckades.');
   await post(endpoint+'/activate',{expectedModelRevision:fresh.modelRevision,frameId:frame.id,version:result.version,publishedAt:result.publishedAt,manifestSha256:result.manifestSha256,calibrationSha256:result.calibrationSha256,sourceSha256:result.sourceSha256,model:{...result.model,url:uploaded.url,label:('Gården · '+result.version+(result.complete?'':' · ofullständig')).slice(0,120),verified:false},complete:result.complete,seasons:result.seasons??[fresh.activeModel]});
   await receipt('hemstyrning-'+version+'.json',{...readReceipt,validationPassed:true,activated:true});status('Aktiverad modell '+version+'; befintliga objekt och ljusinställningar bevarade.');return;
  }catch(error){if(!error.retryable&&!error.cause)observed.set(candidate.directory,candidate.digest);if(readReceipt)await receipt('hemstyrning-'+version+'.json',{...readReceipt,validationPassed:false,activated:false,reason:error.message});await request(version+'-'+candidate.digest.slice(0,10),error.message,version);status('Behåller nuvarande modell. '+version+': '+error.message);}
 }
 if(!candidates.length){await request('awaiting-publication','Publicera en färdig texturerad GLB och kalibrering mot consumer/coordinate-system.json. Manifest skrivs sist. Ofullständig geometri accepteras med complete=false; uppskattad GPS utan verifierad lokal inpassning accepteras inte.');status('Ingen ny godkänd publicering. Befintlig modell och objekt behålls.');}
}
do{try{await sync();}catch(error){status('Modellutbyte avvaktar: '+error.message);await request('setup-'+sha256(error.message).slice(0,10),error.message).catch(()=>{});if(!process.argv.includes('--watch'))process.exitCode=1;}if(!process.argv.includes('--watch'))break;await pause(15000);}while(true);
