import express from 'express';
import {fork, type ChildProcess} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile,rename,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import type {SceneConfig} from './scene-config.js';
import type {YardGrid} from '../../../shared/yard-types.js';
/** Analysis is isolated from both the renderer and the API event loop. */
export function yardApi(directory:string,load:()=>Promise<SceneConfig>){
 const router=express.Router();let child:ChildProcess|undefined,status='idle',error='',key='',signature='';let cached:Awaited<ReturnType<typeof compute>>|undefined;
 async function compute(path:string,model:SceneConfig['models'][string]){if(!model)throw new Error('Aktiv modell saknas');const bytes=await readFile(path);return{path,key:createHash('sha256').update(bytes).update(JSON.stringify([model.position,model.rotation,model.scale])).digest('hex'),model};}
 async function input(){const scene=await load(),model=scene.models[scene.activeModel]!,url=model.url;
  let path:string;if(/^\/models\/[\w.-]+\.glb$/.test(url))path=resolve(import.meta.dirname,'../../../In/hemkontroll_3d_komplett/public',url.slice(1));
  else if(/^\/workspace-api\/models\/[a-f0-9]{64}\.glb$/.test(url))path=resolve(directory,'models',url.split('/').at(-1)!);
  else throw new Error('Analysen kräver en lokalt importerad GLB');
  const info=await stat(path),next=JSON.stringify([path,info.size,info.mtimeMs,model.position,model.rotation,model.scale]);if(!cached||next!==signature){cached=await compute(path,model);signature=next;}key=cached.key;return cached;
 }
 const file=()=>resolve(directory,'analysis',`${key}.json`);
 router.get('/',async(_req,res)=>{try{const payload=await input();let result:YardGrid|undefined;try{result=JSON.parse(await readFile(file(),'utf8'));}catch{}res.json({status:result?'ready':status,key,error,result,model:payload.model});}catch(e){res.status(400).json({message:(e as Error).message});}});
 router.put('/decisions',express.json({limit:'512kb'}),async(req,res)=>{try{await input();const result:YardGrid=JSON.parse(await readFile(file(),'utf8'));if(req.body?.key!==result.key||!Array.isArray(req.body.proposals)||req.body.proposals.length>3000){res.sendStatus(400);return;}for(const decision of req.body.proposals){const proposal=result.proposals.find(p=>p.id===decision.id);if(!proposal||!['ground','obstacle','uncertain'].includes(decision.kind)||!['proposed','approved','rejected'].includes(decision.status)){res.sendStatus(400);return;}proposal.kind=decision.kind;proposal.status=decision.status;}await writeFile(file()+'.tmp',JSON.stringify(result));await rename(file()+'.tmp',file());res.json({saved:true});}catch{res.status(400).json({message:'Analysbesluten kunde inte sparas'});}});
 router.post('/',async(_req,res)=>{if(child){res.status(409).json({message:'Analys pågår'});return;}try{const payload=await input();try{const result=JSON.parse(await readFile(file(),'utf8'));res.json({status:'ready',result});return;}catch{}
  status='running';error='';const output=file();const worker=new URL('./yard-analysis-worker'+(import.meta.url.endsWith('.ts')?'.ts':'.js'),import.meta.url);child=fork(worker,[],{execArgv:import.meta.url.endsWith('.ts')?['--import','tsx']:[],stdio:['ignore','ignore','ignore','ipc']});
  child.on('message',(message:{ready?:boolean;result?:YardGrid;error?:string})=>{if(message.ready){child?.send(payload);return;}if(message.error){status='failed';error=message.error;}else if(message.result){status='saving';void(async()=>{await mkdir(resolve(directory,'analysis'),{recursive:true});await writeFile(output+'.tmp',JSON.stringify(message.result));await rename(output+'.tmp',output);status='ready';})().catch(()=>{status='failed';error='Analysen kunde inte sparas';});}});
  child.on('error',()=>{status='failed';error='Analysprocessen kunde inte startas';});child.on('exit',code=>{child=undefined;if(status==='running'){status='failed';error='Analysprocessen avbröts';}});res.status(202).json({status});
 }catch(e){res.status(400).json({message:(e as Error).message});}});
 return{router,close:()=>child?.kill()};
}
