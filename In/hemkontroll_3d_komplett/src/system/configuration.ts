import {configureSensorBindings} from './entity-bindings';
import type { SceneConfig } from './types';
let sceneCache:SceneConfig|undefined;
let sceneRead:Promise<SceneConfig>|undefined;
let sceneGeneration=0;
function readScene(){
 if(sceneRead)return sceneRead;
 const generation=sceneGeneration;
 const pending=fetch('/workspace-api/scene',{signal:AbortSignal.timeout(15000)}).then(async response=>{if(!response.ok)throw Error('Kunde inte läsa sparad konfiguration');const scene=await response.json()as SceneConfig;if(generation===sceneGeneration)sceneCache=structuredClone(scene);return generation===sceneGeneration?scene:sceneCache??scene;});
 sceneRead=pending;void pending.finally(()=>{if(sceneRead===pending)sceneRead=undefined;}).catch(()=>{});return pending;
}
export class Configuration extends EventTarget {
  value!: SceneConfig;
  private previous?:SceneConfig;private undoStack:SceneConfig[]=[];
  dirty = false;
  status = 'Läser konfiguration…';
  private revision = 0;
  private saving = false;
  private debounce?: ReturnType<typeof setTimeout>;
  async load(background=false) {
    const apply=(scene:SceneConfig)=>{this.value=structuredClone(scene);configureSensorBindings(this.value);this.previous=structuredClone(this.value);this.undoStack=[];this.status='Konfiguration läst';this.dispatchEvent(new Event('status'));this.dispatchEvent(new Event('loaded'));};
    const revision=this.revision;
    if(background&&sceneCache){apply(sceneCache);void readScene().then(scene=>{if(!this.dirty&&this.revision===revision)apply(scene);}).catch(()=>{this.status='Visar senast lästa konfiguration';this.dispatchEvent(new Event('status'));});return;}
    apply(await readScene());
  }
  undo(){const previous=this.undoStack.pop();if(!previous)return false;this.value=previous;this.previous=structuredClone(previous);this.changed();return true;}
  /** Merge into the latest shared scene; publish locally only after disk save. */
  async addPreset(preset:import('./types').Preset){
    if(this.dirty||this.saving)throw Error('Vänta tills övriga ändringar har sparats.');
    const scene=structuredClone(await readScene());
    if((scene.presets??[]).some(p=>p.id===preset.id))throw Error('Förinställningen finns redan.');
    scene.presets=[...(scene.presets??[]),preset];
    const response=await fetch('/workspace-api/scene',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(scene),signal:AbortSignal.timeout(15000)});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.message??'Kunde inte spara förinställningen. Administratörsbehörighet krävs.');}
    ++sceneGeneration;sceneCache=structuredClone(scene);this.value=scene;this.previous=structuredClone(scene);this.status='Sparat på disk';this.dispatchEvent(new Event('status'));this.dispatchEvent(new Event('loaded'));
  }
  async setControlPin(entityId:string,pinned:boolean){
    if(this.dirty||this.saving)throw Error('Vänta tills övriga ändringar har sparats.');
    this.saving=true;
    try{
      const scene=structuredClone(await readScene()),others=(scene.controlPins??[]).filter(id=>id!==entityId);
      scene.controlPins=pinned?[entityId,...others]:others;
      const response=await fetch('/workspace-api/scene',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(scene),signal:AbortSignal.timeout(15000)});
      if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.message??'Fästningen kunde inte sparas. Administratörsbehörighet krävs.');}
      ++sceneGeneration;++this.revision;sceneCache=structuredClone(scene);this.value=scene;this.previous=structuredClone(scene);this.status='Sparat på disk';this.dispatchEvent(new Event('status'));this.dispatchEvent(new Event('loaded'));
    }finally{this.saving=false;}
  }
  changed() {
    if(this.previous&&JSON.stringify(this.previous)!==JSON.stringify(this.value)){this.undoStack.push(this.previous);if(this.undoStack.length>30)this.undoStack.shift();this.previous=structuredClone(this.value); }
    configureSensorBindings(this.value);
    this.dirty = true; ++this.revision; this.status = 'Osparade ändringar'; this.dispatchEvent(new Event('status'));
    clearTimeout(this.debounce); this.debounce = setTimeout(() => void this.save(), 1000);
  }
  async save() {
    clearTimeout(this.debounce);
    if (this.saving) return;
    const revision = this.revision;
    const savedValue=structuredClone(this.value);
    this.saving = true; this.status = 'Sparar…'; this.dispatchEvent(new Event('status'));
    try {
      const response = await fetch('/workspace-api/scene', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(savedValue) });
      if (!response.ok) { const error = await response.json(); throw new Error(error.message ?? 'Kunde inte spara'); }
      ++sceneGeneration;sceneCache=savedValue;
      if (revision === this.revision) { this.dirty = false; this.status = 'Sparat på disk'; }
    } catch (error) { this.status = error instanceof Error ? error.message : 'Kunde inte spara'; }
    finally {
      this.saving = false; this.dispatchEvent(new Event('status'));
      if (revision !== this.revision) void this.save();
    }
  }
}
