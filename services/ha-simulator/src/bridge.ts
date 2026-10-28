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
    if (req.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)) { res.sendStatus(403); return; }
    next();
  });
  router.use((req, res, next) => {
    if (live && req.method !== 'GET' && live.commandsEnabled !== true) {
      res.status(403).json({message:'Home Assistant är skrivskyddad. Verifiera läsanslutningen innan lokal styrning aktiveras.'}); return;
    }
    next();
  });
  router.get('/info', (_req, res) => res.json({ mode: live ? 'home-assistant' : 'simulator' }));
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
  router.get('/history',async(req,res)=>{const id=String(req.query.entity_id??'');if(!/^[a-z_]+\.[a-z0-9_]+$/.test(id)){res.sendStatus(400);return;}if(!live){res.json(store.history([id]));return;}const start=new Date(Date.now()-86400000).toISOString();res.json(await read(`history/period/${start}?filter_entity_id=${encodeURIComponent(id)}`));});
  router.post('/commands',async(req,res)=>{
    if(req.headers['x-hemkontroll-mode']!=='live'){res.sendStatus(403);return;}
    const scene=await load(),object=scene.objects.find(o=>o.id===req.body.object_id);if(!object){res.sendStatus(403);return;}
    const actions:Record<string,[string,string,string]>={climate_on:['car','climate','turn_on'],climate_off:['car','climate','turn_off'],charge_on:['car','switch','turn_on'],charge_off:['car','switch','turn_off'],mower_start:['mower','lawn_mower','start_mowing'],mower_pause:['mower','lawn_mower','pause'],mower_dock:['mower','lawn_mower','dock'],vacuum_start:['vacuum','vacuum','start'],vacuum_pause:['vacuum','vacuum','pause'],vacuum_dock:['vacuum','vacuum','return_to_base']};
    const action=actions[String(req.body.action)];if(!action||object.type!==action[0]){res.sendStatus(403);return;}
    const [kind,domain,service]=action;let entity=object.entityId;
    if(kind==='car'){const binding=domain==='climate'?'climate':'charging',attrs=store.get(object.entityId)?.attributes.command_entities as Record<string,string>|undefined;entity=object.bindings[binding]??(!live?attrs?.[binding]:'')??'';}
    if(!entity.startsWith(domain+'.')){res.sendStatus(403);return;}
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
