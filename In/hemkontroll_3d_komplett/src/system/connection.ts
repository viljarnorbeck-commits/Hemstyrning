import type { HassState } from './types';

/** One HA-shaped state stream, shared by local simulator and the server-side live gateway. */
export class Connection extends EventTarget {
  constructor(private base='/connection-api',private socketPath='/connection-ws'){super();}
  states = new Map<string, HassState>();
  connected = false;
  source = 'unknown';
  commandsEnabled=false;
  controlBlockReason:string|null=null;
  private socket?: WebSocket;
  private stopped = false;
  private retry?: ReturnType<typeof setTimeout>;
  private serial = 0;
  private heartbeat?:ReturnType<typeof setInterval>;
  private lastPong=0;
  private pending = new Map<string, { resolve: () => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>; expected: string }>();
  async start() {
    this.stopped = false;
    const serial = ++this.serial;
    this.socket?.close();this.connected=false;clearInterval(this.heartbeat);
    try {
      const info = await fetch(this.base+'/info', { signal: AbortSignal.timeout(10000) }).then(check).then(r => r.json());
      if (serial !== this.serial || this.stopped) return;
      this.source = info.mode;this.commandsEnabled=info.commandsEnabled===true;this.controlBlockReason=info.controlBlockReason??null;
      const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${this.socketPath}`);
      this.socket = ws;
      ws.onmessage = event => {
        if (this.stopped || serial !== this.serial) return;
        let msg;
        try { msg = JSON.parse(event.data); } catch { ws.close(); return; }
        if (msg.type === 'pong')this.lastPong=Date.now();
        if (msg.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: 'local-bridge' }));
        if (msg.type === 'auth_ok') ws.send(JSON.stringify({ id: 1, type: 'subscribe_events', event_type: 'state_changed' }));
        // Subscribe before snapshot. WS ordering prevents losing a state change between REST and subscription.
        if (msg.type === 'result' && msg.id === 1) {
          if (!msg.success) { ws.close(); return; }
          ws.send(JSON.stringify({ id: 2, type: 'get_states' }));
        }
        if (msg.type === 'result' && msg.id === 2 && msg.success) {
          this.states.clear();
          for (const state of msg.result as HassState[]) this.accept(state);
          this.connected = true;this.lastPong=Date.now();
          clearInterval(this.heartbeat);this.heartbeat=setInterval(()=>{if(Date.now()-this.lastPong>30000){ws.close();return;}ws.send(JSON.stringify({id:99,type:'ping'}));},15000);
          this.dispatchEvent(new Event('connection'));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('hem-connection',{detail:{connected:this.connected,source:this.source,commandsEnabled:this.commandsEnabled}}));
        }
        if (msg.type === 'event' && msg.event?.event_type === 'state_changed') {
          const data = msg.event.data;
          if (data.new_state) this.accept(data.new_state);
          else { this.states.delete(data.entity_id); this.dispatchEvent(new Event('state')); }
        }
        if (msg.type === 'auth_invalid') ws.close();
      };
      const handshakeTimeout = setTimeout(() => { if (!this.connected) ws.close(); }, 10000);
      ws.onclose = () => { clearTimeout(handshakeTimeout); if (serial === this.serial) this.offline(); };
      ws.onerror = () => ws.close();
    } catch { if (serial === this.serial) this.offline(); }
  }
  private accept(state: HassState) {
    this.states.set(state.entity_id, state);
    const command = this.pending.get(state.entity_id);
    if (command && command.expected === state.state) { clearTimeout(command.timer); this.pending.delete(state.entity_id); command.resolve(); }
    this.dispatchEvent(new Event('state'));
  }
  private offline() {
    clearInterval(this.heartbeat);
    this.connected = false;
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error('Anslutningen bröts')); }
    this.pending.clear();
    this.dispatchEvent(new Event('connection'));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('hem-connection',{detail:{connected:this.connected,source:this.source,commandsEnabled:this.commandsEnabled}}));
    clearTimeout(this.retry);
    if (!this.stopped) this.retry = setTimeout(() => void this.start(), 1500);
  }
  async toggle(entityId: string, mode: 'live' | 'simulation') {
    // Guard at the transport boundary as well as in the panel and server.
    if (mode !== 'live') throw new Error('Simulering skickar inga styrkommandon');
    if(!this.commandsEnabled)throw new Error('Anslutningen är skrivskyddad');
    const state = this.states.get(entityId)?.state;
    if (!this.connected || !['on', 'off'].includes(state ?? '')) throw new Error('Lampan saknar bekräftat tillgängligt tillstånd');
    if (this.pending.has(entityId)) throw new Error('Väntar redan på bekräftelse');
    const expected = state === 'on' ? 'off' : 'on';
    const confirmed = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(entityId); reject(new Error('Ingen statebekräftelse inom 10 sekunder')); }, 10000);
      this.pending.set(entityId, { resolve, reject, timer, expected });
    });
    // Attach a rejection handler immediately, while the request is in progress.
    const request = fetch(`${this.base}/services/light/turn_${expected}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hemkontroll-Mode': mode },
      body: JSON.stringify({ entity_id: entityId }), signal: AbortSignal.timeout(10000),
    }).then(check).catch(error => {
      const p = this.pending.get(entityId);
      if (p) { clearTimeout(p.timer); this.pending.delete(entityId); p.reject(error); }
      throw error;
    });
    await Promise.all([request, confirmed]);
  }
  async calendar(entityId:string,start:string,end:string){return fetch(`${this.base}/calendars/${encodeURIComponent(entityId)}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,{signal:AbortSignal.timeout(10000)}).then(check).then(r=>r.json());}
  private async confirmRequest(path:string,body:unknown,matches:()=>boolean,timeout=15000){
    if(!this.connected||!this.commandsEnabled)throw new Error('Styrning är frånkopplad eller skrivskyddad');
    let cleanup=()=>{};
    const confirmed=new Promise<void>((resolve,reject)=>{const change=()=>{if(matches()){cleanup();resolve();}},offline=()=>{if(!this.connected){cleanup();reject(new Error('Anslutningen bröts'));}};const timer=setTimeout(()=>{cleanup();reject(new Error('Ingen bekräftelse ännu. Home Assistant kan uppdatera fördröjt.'));},timeout);cleanup=()=>{clearTimeout(timer);this.removeEventListener('state',change);this.removeEventListener('connection',offline);};this.addEventListener('state',change);this.addEventListener('connection',offline);});
    try{await Promise.all([confirmed,fetch(this.base+path,{method:'POST',headers:{'Content-Type':'application/json','X-Hemkontroll-Mode':'live'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)}).then(check)]);}finally{cleanup();}
  }
  async allLights(on:boolean,ids:string[]){
    await this.confirmRequest('/lighting',{on},()=>ids.every(id=>this.states.get(id)?.state===(on?'on':'off')));
  }
  async media(entityId:string,action:string,data:Record<string,unknown>={}){
    const before=this.states.get(entityId),title=before?.attributes.media_content_id??before?.attributes.media_title;
    await this.confirmRequest('/media',{entity_id:entityId,action,...data},()=>{
      const current=this.states.get(entityId);if(!current)return false;
      if(action==='media_play'||action==='media_pause')return current.state===(action==='media_play'?'playing':'paused');
      if(action==='volume_set')return typeof current.attributes.volume_level==='number'&&Math.abs(current.attributes.volume_level-Number(data.volume_level))<.02;
      if(action==='select_source')return current.attributes.source===data.source;
      return (current.attributes.media_content_id??current.attributes.media_title)!==title;
    },20000);
  }
  async preset(p:import('./types').Preset,stop=false){const before=this.states.get(p.entityId),old=before?.attributes.last_triggered??before?.state;await this.confirmRequest('/presets/'+encodeURIComponent(p.id),{action:stop?'stop':'activate'},()=>{const s=this.states.get(p.entityId);return !!s&&(stop?s.state==='off':(s.attributes.last_triggered??s.state)!==old);});}
  async light(object:import('./types').SceneObject,on:boolean,options:{brightness?:number;kelvin?:number;rgb?:number[]}={}){await this.confirmRequest('/light',{object_id:object.id,on,...options},()=>{const s=this.states.get(object.entityId);return s?.state===(on?'on':'off')&&(options.brightness===undefined||Math.abs(Number(s.attributes.brightness)-options.brightness)<2)&&(options.kelvin===undefined||Math.abs(Number(s.attributes.color_temp_kelvin)-options.kelvin)<100)&&(options.rgb===undefined||JSON.stringify(s.attributes.rgb_color)===JSON.stringify(options.rgb));});}
  async history(entityId:string){const response=await fetch(`${this.base}/history?entity_id=${encodeURIComponent(entityId)}`).then(check);return response.json();}
  async command(object:import('./types').SceneObject,action:string){
    if(!this.connected||!this.commandsEnabled)throw new Error('Frånkopplad eller skrivskyddad');
    const matches=()=>{
      const state=this.states.get(object.entityId);
      if(action.startsWith('climate')){const entity=object.bindings?.climate,target=entity?this.states.get(entity):null;return target?(action==='climate_off'?target.state==='off':!['off','unknown','unavailable'].includes(target.state)):state?.attributes.climate_on===(action==='climate_on');}
      if(action.startsWith('device_'))return state?.state===(action==='device_on'?'on':'off');
      if(action.startsWith('charge')){const entity=object.bindings?.charging,target=entity?this.states.get(entity):null;return target?target.state===(action==='charge_on'?'on':'off'):state?.attributes.charging===(action==='charge_on');}
      const expected:Record<string,string[]>={mower_start:['mowing'],mower_pause:['paused'],mower_dock:['returning','docked'],vacuum_start:['cleaning'],vacuum_pause:['paused'],vacuum_dock:['returning','docked']};return expected[action]?.includes(state?.state??'')??false;
    };
    let cleanup=()=>{};
    const confirmed=new Promise<void>((resolve,reject)=>{const finish=()=>{if(matches()){cleanup();resolve();}};const connection=()=>{if(!this.connected){cleanup();reject(new Error('Anslutningen bröts'));}};const timer=setTimeout(()=>{cleanup();reject(new Error('Ingen bekräftelse inom 10 sekunder'));},10000);cleanup=()=>{clearTimeout(timer);this.removeEventListener('state',finish);this.removeEventListener('connection',connection);};this.addEventListener('state',finish);this.addEventListener('connection',connection);});
    try{await Promise.all([confirmed,fetch(this.base+'/commands',{method:'POST',headers:{'Content-Type':'application/json','X-Hemkontroll-Mode':'live'},body:JSON.stringify({object_id:object.id,action}),signal:AbortSignal.timeout(10000)}).then(check)]);}finally{cleanup();}
  }
  stop() { this.stopped = true; ++this.serial; clearTimeout(this.retry); this.socket?.close(); this.offline(); }
}
async function check(response: Response) { if (!response.ok) throw new Error(`Anslutningsfel (${response.status})`); return response; }
