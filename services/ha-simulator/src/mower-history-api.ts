import express from 'express';
import type {SceneConfig} from './scene-config.js';
import type {MowerHistory} from './mower-history.js';
export function mowerHistoryApi(history:MowerHistory,source:string,load:()=>Promise<SceneConfig>){const router=express.Router();let building=false;
 router.use((req,res,next)=>{if(req.headers.origin&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)){res.sendStatus(403);return;}next();});router.use(express.json({limit:'4kb'}));
 router.get('/',async(req,res)=>{const before=req.query.before===undefined?Number.MAX_VALUE:Number(req.query.before);if(!Number.isFinite(before)){res.sendStatus(400);return;}res.json({source,stats:history.stats(source),runs:history.runs(source,200,before),graph:history.graph(source,await load()),building});});
 router.get('/runs/:id',async(req,res)=>res.json(history.samples(source,req.params.id,await load())));
 router.post('/rebuild',async(_req,res)=>{if(building){res.sendStatus(409);return;}building=true;try{res.json(await history.rebuild(source,await load()));}finally{building=false;}});
 router.delete('/runs/:id',(req,res)=>{if(req.body?.confirm!=='DELETE'){res.sendStatus(400);return;}history.deleteRun(source,req.params.id);res.json({deleted:true});});
 router.delete('/learning',(req,res)=>{if(req.body?.confirm!=='DELETE'){res.sendStatus(400);return;}history.clearLearning(source);res.json({deleted:true});});return router;
}
