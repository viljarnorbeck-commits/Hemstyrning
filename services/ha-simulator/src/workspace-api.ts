import {allowedOrigin} from './access.js';
import {yardApi} from './yard-api.js';
import {resolveJamLink} from './music.js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import express from 'express';
import sharp from 'sharp';
import { defaultScene, sceneSchema, type SceneConfig } from './scene-config.js';

/** Local authoring API. Data lives outside public/ and survives server restarts. */
export function workspaceApi(directory: string,onSaved:()=>void=()=>{}) {
  const router = express.Router();
  const configPath = resolve(directory, 'scene.json');
  let pending: Promise<unknown> = Promise.resolve();
  async function load(): Promise<SceneConfig> {
    try {
      const raw = JSON.parse(await readFile(configPath, 'utf8'));
      if (!raw.layoutVersion) {
        if(raw.objects.length===1&&raw.objects[0].id==='lamp-first')raw.quality='auto';
        const existing = new Set(raw.objects.map((o: {entityId:string}) => o.entityId));
        raw.objects.push(...defaultScene().objects.filter(o => !existing.has(o.entityId)));
        raw.layoutVersion = 2;
      }
      for(const object of raw.objects){if(object.id==='lamp-first'&&object.name==='Testlampa · placera på gården')object.name='Altan';if(object.type==='car'&&!object.representation)object.representation='embedded';}
      return sceneSchema.parse(raw);
    }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return defaultScene(); throw error; }
  }
  router.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !allowedOrigin(origin)) { res.sendStatus(403); return; }
    next();
  });
  const yard=yardApi(directory,load);router.use('/yard-analysis',yard.router);
  router.post('/music/jam/resolve',express.json({limit:'4kb'}),async(req,res)=>{try{res.json({url:await resolveJamLink(req.body?.url),verifiedSession:false});}catch(error){res.status(400).json({message:error instanceof Error?error.message:'Länken kunde inte verifieras'});}});
  router.get('/scene', async (_req, res) => { res.json(await load()); });
  router.put('/scene', express.json({ limit: '2mb' }), async (req, res) => {
    const result = sceneSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ message: 'Ogiltig scenkonfiguration', errors: result.error.issues }); return; }
    if (!req.is('application/json')) { res.sendStatus(415); return; }
    const save = async () => {
      await mkdir(directory, { recursive: true });
      const temp = `${configPath}.${crypto.randomUUID()}.tmp`;
      await writeFile(temp, JSON.stringify(result.data, null, 2));
      await rename(temp, configPath);
    };
    pending = pending.catch(() => {}).then(save);
    await pending;onSaved();
    res.json({ saved: true });
  });
  router.post('/start-images',express.raw({type:'image/png',limit:'40mb'}),async(req,res)=>{
    if(!Buffer.isBuffer(req.body)){res.sendStatus(415);return;}
    try{const m=await sharp(req.body,{limitInputPixels:17000000}).metadata();if(m.format!=='png'||!m.width||!m.height||m.width>4096||m.height>4096||m.width<320||m.height<240)throw new Error();
      const id=createHash('sha256').update(req.body).digest('hex');await mkdir(resolve(directory,'start-images'),{recursive:true});await writeFile(resolve(directory,'start-images',id+'.png'),req.body);res.status(201).json({url:'/workspace-api/start-images/'+id+'.png',width:m.width,height:m.height});
    }catch{res.status(400).json({message:'Startbilden måste vara en PNG, 320–4096 ×240–4096 px'});}
  });
  router.get('/start-images/:file',(req,res)=>{if(!/^[a-f0-9]{64}\.png$/.test(req.params.file)){res.sendStatus(404);return;}res.sendFile(resolve(directory,'start-images',req.params.file),{headers:{'Cache-Control':'private,max-age=0'}});});
  router.post('/panoramas',express.raw({type:['image/jpeg','image/png'],limit:'80mb'}),async(req,res)=>{
    if(!Buffer.isBuffer(req.body)){res.status(415).json({message:'Använd JPEG eller PNG'});return;}
    try{const image=await sharp(req.body,{limitInputPixels:150000000}).metadata();
      if(!image.width||!image.height||!['jpeg','png'].includes(image.format??'')||Math.abs(image.width/image.height-2)>.03||image.width>16384||image.width<512)throw new Error();
      const ext=image.format==='jpeg'?'jpg':'png',id=createHash('sha256').update(req.body).digest('hex');await mkdir(resolve(directory,'panoramas'),{recursive:true});await writeFile(resolve(directory,'panoramas',`${id}.${ext}`),req.body);
      res.status(201).json({url:`/workspace-api/panoramas/${id}.${ext}`,width:image.width,height:image.height});
    }catch{res.status(400).json({message:'Kräver equirectangular JPEG/PNG, 2:1, bredd 512–16384 px och högst 150 megapixlar'});}
  });
  router.get('/panoramas/:file',(req,res)=>{if(!/^[a-f0-9]{64}\.(png|jpg)$/.test(req.params.file)){res.sendStatus(404);return;}res.sendFile(resolve(directory,'panoramas',req.params.file),{headers:{'Cache-Control':'public,max-age=31536000,immutable'}});});
  router.post('/models', express.raw({ type: 'model/gltf-binary', limit: '256mb' }), async (req, res) => {
    const data: unknown = req.body;
    if (!Buffer.isBuffer(data) || data.length < 20 || data.toString('ascii', 0, 4) !== 'glTF' || data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) {
      res.status(400).json({ message: 'Importera en giltig GLB 2.0-fil, högst 256 MB' }); return;
    }
    // Embedded resources only: importing must never fetch arbitrary URLs from a model.
    try {
      const size = data.readUInt32LE(12);
      const json = JSON.parse(data.toString('utf8', 20, 20 + size)) as { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
      if ([...(json.buffers ?? []), ...(json.images ?? [])].some(item => item.uri && !item.uri.startsWith('data:'))) throw new Error();
    } catch { res.status(400).json({ message: 'GLB måste innehålla alla texturer och buffertar' }); return; }
    const id = createHash('sha256').update(data).digest('hex');
    await mkdir(resolve(directory, 'models'), { recursive: true });
    await writeFile(resolve(directory, 'models', `${id}.glb`), data);
    res.status(201).json({ url: `/workspace-api/models/${id}.glb` });
  });
  router.get('/models/:file', async (req, res) => {
    if (!/^[a-f0-9]{64}\.glb$/.test(req.params.file)) { res.sendStatus(404); return; }
    res.sendFile(resolve(directory, 'models', req.params.file), { headers: { 'Cache-Control': 'public,max-age=31536000,immutable' } });
  });
  return { router, load, close:yard.close };
}
