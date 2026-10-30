import type {StateStore} from './store.js';
export const demoScenes=[['scene.evening','Kvällsbelysning'],['scene.all_off','Allt släckt'],['scene.cozy','Mysbelysning'],['script.halloween','Halloween'],['script.halloween_breathe','Halloween · långsam puls'],['script.away','Bortaläge']] as const;
const engines=new WeakMap<StateStore,DemoPresets>();
export function demoPresets(store:StateStore){let engine=engines.get(store);if(!engine){engine=new DemoPresets(store);engines.set(store,engine);}return engine;}
class DemoPresets{
 private elapsed=0;private active='';private saved:{id:string;state:string;attributes:Record<string,unknown>}[]=[];private phase=-1;
 constructor(private store:StateStore){}
 stop(requested?:string){if(requested&&requested!==this.active){this.store.set(requested,'off');return;}const id=this.active;this.active='';for(const s of this.saved)this.store.set(s.id,s.state,s.attributes);this.saved=[];if(id)this.store.set(id,'off',{effect_status:'stopped',finished_at:new Date().toISOString()});}
 activate(id:string){if(!demoScenes.some(s=>s[0]===id))throw new Error('Okänd simulerad scen');this.stop();const lights=this.store.all().filter(s=>s.entity_id.startsWith('light.')&&!Array.isArray(s.attributes.entity_id));
  if(id.startsWith('script.halloween')){const rgb=lights.filter(s=>Array.isArray(s.attributes.supported_color_modes)&&s.attributes.supported_color_modes.some(m=>['rgb','rgbw','rgbww','hs','xy'].includes(String(m))));if(!rgb.length)throw new Error('Inga simulerade färglampor tillgängliga');this.saved=rgb.map(s=>({id:s.entity_id,state:s.state,attributes:{...s.attributes}}));this.active=id;this.elapsed=0;this.phase=-1;this.store.set(id,'on',{last_triggered:new Date().toISOString(),duration_seconds:120,effect_status:'running',simulated:true});this.tick(0);return;}
  for(const light of lights){const off=id==='scene.all_off'||id==='script.away',dim=id==='scene.cozy';this.store.set(light.entity_id,off?'off':'on',{brightness:off?0:dim?65:180,color_temp_kelvin:2700,color_mode:'color_temp',rgb_color:[255,186,115]});}
  this.store.set(id,id.startsWith('scene.')?new Date().toISOString():'off',{last_triggered:new Date().toISOString(),simulated:true});
 }
 tick(dt:number){if(!this.active)return;this.elapsed+=dt;if(this.elapsed>=120){this.stop();return;}const phase=Math.floor(this.elapsed/8);if(phase===this.phase)return;this.phase=phase;const colors=[[255,85,0],[130,25,215],[20,110,55]];for(let i=0;i<this.saved.length;i++){const s=this.saved[i]!;this.store.set(s.id,'on',{color_mode:'rgb',rgb_color:colors[(phase+i)%3],brightness:this.active.endsWith('breathe')&&phase%2?55:150});}}
}
