import {allowedOrigin} from './access.js';
import {mediaSupports,robotSupports,available} from '../../../shared/ha-contract.js';
import express from 'express';
import {calendarEvents} from './calendar.js';
import { WebSocket } from 'ws';
import type { StateStore } from './store.js';
import { callService } from './services.js';
import type { SceneConfig } from './scene-config.js';

export interface LiveTarget { url: string; token: string; commandsEnabled?: boolean }
export function bridgeApi(store: StateStore, load: () => Promise<SceneConfig>, delay: number, live?: LiveTarget) {
  const router = express.Router();
  router.use((req, res, next) => {
    if (req.headers.origin && !allowedOrigin(req.headers.origin)) { res.sendStatus(403); return; }
    next();
  });
  router.use((req, res, next) => {
    if (live && req.method !== 'GET' && live.commandsEnabled !== true) {
      res.status(403).json({message:'Home Assistant är skrivskyddad. Verifiera läsanslutningen innan lokal styrning aktiveras.'}); return;
    }
    next();
  });
  router.get('/info', (_req, res) => res.json({ mode: live ? 'home-assistant' : 'simulator', commandsEnabled: res.locals.hemRole!=='viewer'&&(!live||live.commandsEnabled===true),controlBlockReason:res.locals.hemRole==='viewer'?'viewer':live&&live.commandsEnabled!==true?'read-only':null }));
  const read = async (path: string) => {
    if(!live){if(path==='states')return store.all();const scene=await load();return{latitude:scene.location.latitude,longitude:scene.location.longitude,time_zone:scene.location.timeZone};}
    const response = await fetch(`${live.url}/api/${path}`, { headers: { Authorization: `Bearer ${live.token}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Home Assistant svarade ${response.status}`);
    return response.json();
  };
  router.get('/status', async (_req,res) => {
    if(!live){res.json({mode:'simulator',authenticated:true,commandsEnabled:true});return;}
    try {
      await read('config');
      const states=await read('states');
      res.json({mode:'real',authenticated:true,commandsEnabled:live.commandsEnabled===true,entityCount:Array.isArray(states)?states.length:0});
    } catch {
      res.status(503).json({mode:'real',authenticated:false,commandsEnabled:false,message:'Home Assistant kunde inte verifieras. Kontrollera URL, token och nätverk lokalt.'});
    }
  });
  router.get('/services',async(_req,res)=>{
    if(!live){res.json([]);return;}
    try{res.json(await read('services'));}catch{res.status(503).json({message:'Tjänstekatalogen kunde inte hämtas'});}
  });
  router.post('/media',async(req,res)=>{
    if(req.headers['x-hemkontroll-mode']!=='live'){res.sendStatus(403);return;}
    const config=await load(),id=req.body?.entity_id,service=req.body?.action;
    if(typeof id!=='string'||!config.music.entities.includes(id)||!/^media_player\.[a-z0-9_]+$/.test(id)||typeof service!=='string'){res.sendStatus(403);return;}
    const states=await read('states') as {entity_id:string;state:string;attributes:Record<string,unknown>}[],state=states.find(s=>s.entity_id===id);
    if(!mediaSupports(state,service)){res.status(400).json({message:'Spelaren saknar stöd för kommandot eller är otillgänglig'});return;}
    const data:Record<string,unknown>={entity_id:id};
    if(service==='volume_set'){const value=req.body.volume_level;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1){res.sendStatus(400);return;}data.volume_level=value;}
    if(service==='select_source'){const value=req.body.source;if(typeof value!=='string'||!Array.isArray(state?.attributes.source_list)||!state.attributes.source_list.includes(value)){res.sendStatus(400);return;}data.source=value;}
    if(live){const response=await fetch(`${live.url}/api/services/media_player/${service}`,{method:'POST',headers:{Authorization:`Bearer ${live.token}`,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});if(!response.ok){res.status(502).json({message:'Home Assistant avvisade musikkommandot'});return;}}
    else await callService(store,{domain:'media_player',service,serviceData:data},delay);
    res.json({accepted:true});
  });
  router.post('/presets/:id',async(req,res)=>{
    if(req.headers['x-hemkontroll-mode']!=='live'){res.sendStatus(403);return;}
    const config=await load(),preset=config.presets.find(p=>p.id===req.params.id&&!p.hidden),stop=req.body?.action==='stop';
    if(!preset||!['activate','stop'].includes(req.body?.action)||stop&&(!preset.canStop||!preset.entityId.startsWith('script.'))){res.sendStatus(403);return;}
    const domain=preset.entityId.split('.')[0]!,service=stop?'turn_off':'turn_on',target=(await read('states') as {entity_id:string;state:string}[]).find(s=>s.entity_id===preset.entityId);
    if(!target||target.state==='unavailable'||target.state==='unknown'&&domain==='script'){res.status(400).json({message:'Scenen eller skriptet är otillgängligt'});return;}
    if(live){const response=await fetch(`${live.url}/api/services/${domain}/${service}`,{method:'POST',headers:{Authorization:`Bearer ${live.token}`,'Content-Type':'application/json'},body:JSON.stringify({entity_id:preset.entityId}),signal:AbortSignal.timeout(10000)});if(!response.ok){res.sendStatus(502);return;}}
    else await callService(store,{domain,service,serviceData:{entity_id:preset.entityId}},delay);
    res.json({accepted:true,confirmed:false});
  });
  router.post('/light',async(req,res)=>{
    const c=await load(),o=c.objects.find(o=>o.id===req.body?.object_id&&o.type==='light'),a=req.body;
    if(req.headers['x-hemkontroll-mode']!=='live'||!o||!/^light\.[a-z0-9_]+$/.test(o.entityId)||typeof a.on!=='boolean'){res.sendStatus(403);return;}
    const state=(await read('states') as {entity_id:string;state:string;attributes:Record<string,unknown>}[]).find(s=>s.entity_id===o.entityId),modes=state?.attributes.supported_color_modes as string[]|undefined;
    if(!available(state)){res.sendStatus(400);return;}const payload:Record<string,unknown>={entity_id:o.entityId};
    if(a.brightness!==undefined){if(typeof a.brightness!=='number'||!Number.isFinite(a.brightness)||a.brightness<0||a.brightness>255||!modes?.some(m=>m!=='onoff')){res.sendStatus(400);return;}payload.brightness=Math.round(a.brightness);}
    if(a.kelvin!==undefined){if(typeof a.kelvin!=='number'||!Number.isFinite(a.kelvin)||a.kelvin<2000||a.kelvin>6500||!modes?.includes('color_temp')){res.sendStatus(400);return;}payload.color_temp_kelvin=a.kelvin;}
    if(a.rgb!==undefined){if(!Array.isArray(a.rgb)||a.rgb.length!==3||!a.rgb.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=255)||!modes?.some(m=>['rgb','rgbw','rgbww','xy','hs'].includes(m))){res.sendStatus(400);return;}payload.rgb_color=a.rgb;}
    const service=a.on?'turn_on':'turn_off';if(live){const r=await fetch(`${live.url}/api/services/light/${service}`,{method:'POST',headers:{Authorization:`Bearer ${live.token}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});if(!r.ok){res.sendStatus(502);return;}}else await callService(store,{domain:'light',service,serviceData:payload},delay);res.json({accepted:true});
  });
  router.get('/artwork',async(req,res)=>{
    const config=await load(),id=String(req.query.entity_id??'');
    if(!live||!config.music.entities.includes(id)){res.sendStatus(404);return;}
    try{
      const states=await read('states') as {entity_id:string;attributes:Record<string,unknown>}[],state=states.find(s=>s.entity_id===id),picture=state?.attributes.entity_picture;
      if(typeof picture!=='string'){res.sendStatus(404);return;}
      const url=new URL(picture,live.url),base=new URL(live.url),local=url.origin===base.origin&&url.pathname.startsWith('/api/media_player_proxy/'),spotify=url.protocol==='https:'&&!url.port&&['i.scdn.co','mosaic.scdn.co'].includes(url.hostname);
      if(url.username||url.password||(!local&&!spotify)){res.sendStatus(403);return;}
      const response=await fetch(url,{...(local?{headers:{Authorization:`Bearer ${live.token}`}}:{}),redirect:'error',signal:AbortSignal.timeout(8000)});
      const type=response.headers.get('content-type')?.split(';')[0];
      if(!response.ok||!['image/jpeg','image/png','image/webp'].includes(type??'')){res.sendStatus(404);return;}
      const reader=response.body?.getReader();if(!reader){res.sendStatus(404);return;}const chunks:Uint8Array[]=[];let size=0;
      while(true){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>5*1024*1024){await reader.cancel();res.sendStatus(413);return;}chunks.push(result.value);}
      res.set({'Content-Type':type!,'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'}).send(Buffer.concat(chunks));
    }catch{res.sendStatus(502);}
  });
  router.get('/calendars/:id',async(req,res)=>{
    const config=await load(),id=req.params.id,start=String(req.query.start??''),end=String(req.query.end??'');
    if(!/^calendar\.[a-z0-9_]+$/.test(id)||!config.bindings.calendars.includes(id)){res.sendStatus(403);return;}
    if(!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(end)<=Date.parse(start)||Date.parse(end)-Date.parse(start)>93*86400000){res.sendStatus(400);return;}
    if(live)res.json(await read(`calendars/${id}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`));
    else{try{res.json(calendarEvents(store,id,start,end));}catch{res.status(503).json({message:'Kalendern är inte tillgänglig'});}}
  });
  router.post('/lighting',async(req,res)=>{
    if(req.headers['x-hemkontroll-mode']!=='live'||typeof req.body.on!=='boolean'){res.sendStatus(403);return;}
    const config=await load(),ids=[...new Set(config.objects.filter(o=>o.type==='light').map(o=>o.entityId).filter(id=>/^light\.[a-z0-9_]+$/.test(id)))];
    if(!ids.length){res.status(400).json({message:'Ingen belysning kopplad'});return;}
    const service=req.body.on?'turn_on':'turn_off';
    if(live){const response=await fetch(`${live.url}/api/services/light/${service}`,{method:'POST',headers:{Authorization:`Bearer ${live.token}`,'Content-Type':'application/json'},body:JSON.stringify({entity_id:ids}),signal:AbortSignal.timeout(10000)});if(!response.ok){res.sendStatus(502);return;}}
    else await callService(store,{domain:'light',service,serviceData:{entity_id:ids}},delay);
    res.json({accepted:true});
  });
  router.get('/history',async(req,res)=>{
    const id=String(req.query.entity_id??''),end=req.query.end?Date.parse(String(req.query.end)):Date.now(),start=req.query.start?Date.parse(String(req.query.start)):end-86400000;
    if(!/^[a-z_]+\.[a-z0-9_]+$/.test(id)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>31*86400000||end>Date.now()+60000){res.sendStatus(400);return;}
    try{if(!live){res.json(store.history([id],start).map(rows=>rows.filter(s=>Date.parse(s.last_updated)<=end)));return;}res.json(await read(`history/period/${new Date(start).toISOString()}?filter_entity_id=${encodeURIComponent(id)}&end_time=${encodeURIComponent(new Date(end).toISOString())}`));}catch{res.status(503).json({message:'Historik kunde inte hämtas från Home Assistant'});}
  });
  // Explicit inventory allowlist. Existing live control lock and role middleware apply.
  router.post('/equipment',async(req,res)=>{
    if(res.locals.hemRole==='viewer'||req.headers['x-hemkontroll-mode']!=='live'){res.sendStatus(403);return;}
    const id=req.body?.entity_id,action=req.body?.action,value=req.body?.value;
    const isLock=['lock.entredorr_2','lock.verkstadsentre_2'].includes(id),isSwitch=id==='switch.vvb_kallaren_on_off',isClimate=['climate.vvb_kallaren_termostat','climate.vvb_lower_threshold'].includes(id);
    if(!(isLock&&['lock','unlock'].includes(action)||isClimate&&['mode','temperature','range'].includes(action)||isSwitch&&['turn_on','turn_off'].includes(action))||action==='unlock'&&req.body.confirmed!==true){res.sendStatus(403);return;}
    try{
      const state=(await read('states')as {entity_id:string;state:string;attributes:Record<string,unknown>}[]).find(s=>s.entity_id===id);
      if(!available(state)){res.status(409).json({message:'Enheten är otillgänglig'});return;}
      const data:Record<string,unknown>={entity_id:id};let service=action;
      if(isLock&&!['locked','unlocked'].includes(state!.state)){res.status(409).json({message:'Låset har inget säkert känt tillstånd'});return;}
      if(isClimate&&action==='mode'){if(!Array.isArray(state!.attributes.hvac_modes)||!state!.attributes.hvac_modes.includes(value)){res.sendStatus(400);return;}service='set_hvac_mode';data.hvac_mode=value;}
      if(isClimate&&action==='temperature'){const a=state!.attributes;if(!(Number(a.supported_features)&1)||typeof value!=='number'||!Number.isFinite(value)||typeof a.min_temp!=='number'||typeof a.max_temp!=='number'||value<a.min_temp||value>a.max_temp){res.sendStatus(400);return;}service='set_temperature';data.temperature=value;}
      if(isSwitch){if(!['on','off'].includes(state!.state)){res.sendStatus(409);return;}}
      if(isClimate&&action==='range'){const a=state!.attributes,low=value?.low,high=value?.high;if(!(Number(a.supported_features)&2)||typeof low!=='number'||typeof high!=='number'||!Number.isFinite(low)||!Number.isFinite(high)||typeof a.min_temp!=='number'||typeof a.max_temp!=='number'||low<a.min_temp||high>a.max_temp||low>high){res.sendStatus(400);return;}service='set_temperature';data.target_temp_low=low;data.target_temp_high=high;}
      if(live){const response=await fetch(`${live.url}/api/services/${isLock?'lock':isSwitch?'switch':'climate'}/${service}`,{method:'POST',headers:{Authorization:`Bearer ${live.token}`,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});if(!response.ok){res.status(502).json({message:'Home Assistant avvisade kommandot'});return;}}
      else{await new Promise(r=>setTimeout(r,delay));store.set(id,isLock?(action==='lock'?'locked':'unlocked'):isSwitch?(action==='turn_on'?'on':'off'):action==='mode'?String(value):state!.state,action==='temperature'?{temperature:value}:action==='range'?{target_temp_low:value.low,target_temp_high:value.high}:{});}
      res.json({accepted:true,confirmed:false});
    }catch{res.status(502).json({message:'Datakällan kunde inte nås'});}
  });
  router.post('/commands',async(req,res)=>{
    if(req.headers['x-hemkontroll-mode']!=='live'){res.sendStatus(403);return;}
    const scene=await load(),object=scene.objects.find(o=>o.id===req.body.object_id);if(!object){res.sendStatus(403);return;}
    const actions:Record<string,[string,string,string]>={climate_on:['car','climate','turn_on'],climate_off:['car','climate','turn_off'],charge_on:['car','switch','turn_on'],charge_off:['car','switch','turn_off'],mower_start:['mower','lawn_mower','start_mowing'],mower_pause:['mower','lawn_mower','pause'],mower_dock:['mower','lawn_mower','dock'],vacuum_start:['vacuum','vacuum','start'],vacuum_pause:['vacuum','vacuum','pause'],vacuum_dock:['vacuum','vacuum','return_to_base'],device_on:['device','switch','turn_on'],device_off:['device','switch','turn_off']};
    const action=actions[String(req.body.action)];if(!action||object.type!==action[0]){res.sendStatus(403);return;}
    const [kind,domain,service]=action;let entity=object.entityId;
    if(kind==='car'){const binding=domain==='climate'?'climate':'charging',attrs=store.get(object.entityId)?.attributes.command_entities as Record<string,string>|undefined;entity=object.bindings[binding]??(!live?attrs?.[binding]:'')??'';}
    if(!entity.startsWith(domain+'.')){res.sendStatus(403);return;}
    const target=(await read('states') as {entity_id:string;state:string;attributes:Record<string,unknown>}[]).find(s=>s.entity_id===entity);
    if(!available(target)||(!['car','device'].includes(kind)&&!robotSupports(target,String(req.body.action)))){res.status(400).json({message:'Enheten är otillgänglig eller saknar stöd'});return;}
    if(kind==='car'&&domain==='climate'&&(Number(target?.attributes.supported_features??0)&(service==='turn_on'?256:128))===0){res.status(400).json({message:'Klimatentiteten saknar stöd'});return;}
    if(live){const response=await fetch(`${live.url}/api/services/${domain}/${service}`,{method:'POST',headers:{Authorization:`Bearer ${live.token}`,'Content-Type':'application/json'},body:JSON.stringify({entity_id:entity}),signal:AbortSignal.timeout(10000)});if(!response.ok){res.sendStatus(502);return;}}
    else await callService(store,{domain,service,serviceData:{entity_id:entity}},delay);
    res.json({accepted:true});
  });
  router.get('/states', async (_req, res) => res.json(await read('states')));
  router.get('/config', async (_req, res) => res.json(await read('config')));
  router.post('/services/:domain/:service', async (req, res) => {
    if (req.headers['x-hemkontroll-mode'] !== 'live') { res.status(403).json({ message: 'Simulering får inte styra utrustning' }); return; }
    const entityId = req.body?.entity_id as unknown;
    const config = await load();
    const domain = req.params.domain;
    const service = req.params.service;
    if (domain !== 'light' || !['turn_on', 'turn_off'].includes(service) || typeof entityId !== 'string' || !config.objects.some(o => o.type === 'light' && o.entityId === entityId) || !entityId.startsWith('light.')) {
      res.status(403).json({ message: 'Enheten eller tjänsten är inte tillåten i scenen' }); return;
    }
    // Only the explicitly selected entity, never arbitrary service payloads.
    if (live) {
      const response = await fetch(`${live.url}/api/services/light/${service}`, {
        method: 'POST', headers: { Authorization: `Bearer ${live.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId }), signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) { res.status(502).json({ message: `Home Assistant svarade ${response.status}` }); return; }
    } else await callService(store, { domain: 'light', service, serviceData: { entity_id: entityId } }, delay);
    res.json({ accepted: true });
  });
  return router;
}

/** Read-only WS gateway; remote credentials are exchanged exclusively on the server. */
export function connectLiveSocket(client: WebSocket, live: LiveTarget) {
  const url = new URL(`${live.url}/api/websocket`);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const upstream = new WebSocket(url);
  let authenticated = false;
  const timeout = setTimeout(() => { upstream.terminate(); client.close(1011, 'Home Assistant timeout'); }, 10000);
  upstream.on('message', raw => {
    try {
      const message = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (message.type === 'auth_required') upstream.send(JSON.stringify({ type: 'auth', access_token: live.token }));
      else if (message.type === 'auth_invalid') client.close(1008, 'Home Assistant authentication failed');
      else {
        if (message.type === 'auth_ok') { authenticated = true; clearTimeout(timeout); }
        if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(message));
      }
    } catch { client.close(1003, 'Invalid message'); }
  });
  client.on('message', raw => {
    if (!authenticated || upstream.readyState !== WebSocket.OPEN) return;
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (msg.type === 'get_states' || msg.type === 'ping' || msg.type === 'unsubscribe_events' || (msg.type === 'subscribe_events' && msg.event_type === 'state_changed')) upstream.send(JSON.stringify(msg));
      else client.send(JSON.stringify({ id: msg.id, type: 'result', success: false, error: { message: 'Read-only WebSocket' } }));
    } catch { client.close(1003, 'Invalid message'); }
  });
  upstream.on('error', () => client.close(1011, 'Home Assistant unavailable'));
  upstream.on('close', () => { clearTimeout(timeout); client.close(); });
  client.on('close', () => { clearTimeout(timeout); upstream.close(); });
}
