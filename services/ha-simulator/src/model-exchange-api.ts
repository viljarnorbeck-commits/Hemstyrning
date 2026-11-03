import express from 'express';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import type {SceneConfig} from './scene-config.js';
import {coordinateFrameSchema,displayPlacementSchema,exchangeActivationSchema,exchangeModelSchema} from './model-exchange-contract.js';
export const modelRevision=(scene:SceneConfig)=>createHash('sha256').update(JSON.stringify([scene.models,scene.modelExchange?.active??null,scene.modelExchange?.displayPlacement??null])).digest('hex');
export function modelExchangeApi(directory:string,load:()=>Promise<SceneConfig>,commit:(change:(scene:SceneConfig)=>SceneConfig)=>Promise<SceneConfig>){
 const router=express.Router();
 router.get('/',async(_req,res)=>{const scene=await load();res.json({modelRevision:modelRevision(scene),models:scene.models,activeModel:scene.activeModel,exchange:scene.modelExchange??null});});
 router.post('/initialize',async(req,res)=>{try{
  const frame=coordinateFrameSchema.parse(req.body.frame),expected=req.body.expectedModelRevision;
  const current=await load();
  if(current.modelExchange){res.json({frame:current.modelExchange.frame});return;}
  const url=current.models[current.activeModel]!.url;
  const file=url.startsWith('/models/')?resolve(import.meta.dirname,'../../../In/hemkontroll_3d_komplett/public',url.slice(1)):resolve(directory,'models',url.split('/').at(-1)!);
  if(createHash('sha256').update(await readFile(file)).digest('hex')!==frame.baseline.sha256)throw Error('Den frysta referensens fil stämmer inte med den befintliga modellen.');
  const scene=await commit(current=>{
   if(current.modelExchange)return current;
   if(modelRevision(current)!==expected)throw Error('Modellen ändrades under förberedelsen. Försök igen.');
   const active=current.models[current.activeModel]!;
   if(JSON.stringify(exchangeModelSchema.parse(active))!==JSON.stringify(frame.baseline.model))throw Error('Referensmodellen matchar inte nuvarande modell.');
   return {...current,modelExchange:{frame,imports:[]}};
  });res.json({frame:scene.modelExchange!.frame});
 }catch(error){res.status(409).json({message:error instanceof Error?error.message:'Koordinatsystemet kunde inte frysas.'});}});
 router.post('/display-placement',async(req,res)=>{try{
  const policy=displayPlacementSchema.parse(req.body.placement);
  const saved=await commit(current=>{
   if(!current.modelExchange||modelRevision(current)!==req.body.expectedModelRevision)throw Error('Scenen ändrades. Läs om före placering.');
   return {...current,modelExchange:{...current.modelExchange,displayPlacement:policy},...(req.body.clearPlacements===true?{objects:current.objects.map(o=>({...o,placementConfirmed:false,position:[0,0,0] as [number,number,number],rotation:[0,0,0] as [number,number,number],points:[],trackingOffset:[0,0,0] as [number,number,number]})),energyRoutes:[]}:{} )};
  });res.json({placement:saved.modelExchange!.displayPlacement,modelRevision:modelRevision(saved)});
 }catch(error){res.status(409).json({message:error instanceof Error?error.message:'Visningsplaceringen kunde inte sparas.'});}});
 router.post('/activate',async(req,res)=>{try{
  const input=exchangeActivationSchema.parse(req.body),file=input.model.url.match(/^\/workspace-api\/models\/([a-f0-9]{64})\.glb$/);
  if(!file)throw Error('Kräver en lokalt importerad modell.');
  const bytes=await readFile(resolve(directory,'models',file[1]+'.glb'));
  if(createHash('sha256').update(bytes).digest('hex')!==file[1])throw Error('Importerad modell matchar inte sin kontrollsumma.');
  const saved=await commit(current=>{
   const exchange=current.modelExchange;if(!exchange||exchange.frame.id!==input.frameId)throw Error('Fel permanent koordinatsystem.');
   const previous=exchange.imports.find(item=>item.version===input.version);
   if(previous){if(previous.manifestSha256!==input.manifestSha256)throw Error('En publicerad version har ändrats. Publicera en ny version.');return current;}
   if(modelRevision(current)!==input.expectedModelRevision)throw Error('Modellinställningarna ändrades under importen. Försök igen.');
   if(exchange.active&&Date.parse(input.publishedAt)<=Date.parse(exchange.active.publishedAt))throw Error('En äldre publicering får inte ersätta den aktiva modellen.');
   if(input.placementKind==='user-approved-provisional'){
    const policy=exchange.displayPlacement;
    if(!policy||policy.sourceFrameId!==input.sourceFrameId||JSON.stringify([policy.position,policy.rotation,policy.scale])!==JSON.stringify([input.model.position,input.model.rotation,input.model.scale]))throw Error('Provisorisk placering saknar motsvarande lokalt godkännande.');
   }
   const record={placementKind:input.placementKind,sourceFrameId:input.sourceFrameId,version:input.version,publishedAt:input.publishedAt,manifestSha256:input.manifestSha256,calibrationSha256:input.calibrationSha256,sourceSha256:input.sourceSha256,importedSha256:file[1]!,frameId:input.frameId,activatedAt:new Date().toISOString(),complete:input.complete,seasons:input.seasons};
   const models={...current.models};for(const season of input.seasons){const next={...current.models[season],...input.model};if(input.placementKind==='user-approved-provisional'&&current.models[season]!.url===exchange.frame.baseline.model.url)delete next.fallback;else next.fallback=exchangeModelSchema.parse(current.models[season]);models[season]=next;};
   return {...current,models,modelExchange:{...exchange,active:record,imports:[...exchange.imports,record],previousModels:Object.fromEntries(Object.entries(current.models).map(([season,model])=>[season,exchangeModelSchema.parse(model)]))}};
  });res.json({active:saved.modelExchange!.active,modelRevision:modelRevision(saved)});
 }catch(error){res.status(409).json({message:error instanceof Error?error.message:'Modellen kunde inte aktiveras.'});}});
 return router;
}
