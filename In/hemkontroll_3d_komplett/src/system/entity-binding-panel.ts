import {Configuration} from './configuration';
import {Connection} from './connection';
import {defaultEntity,sensorSlots} from './entity-bindings';
import {escapeHtml as esc} from './panels';

/** Edits the existing scene document; it never sends a Home Assistant command. */
const cleanup = new WeakMap<Connection,()=>void>();
export function bindingPanel(config:Configuration, connection:Connection) {
  cleanup.get(connection)?.();
  const root=document.createElement('section');root.className='entity-binding-panel';
  root.innerHTML=`<h2>Home Assistant · entitetskopplingar</h2>
    <p>Gemensamma kopplingar för alla skärmar. Sparas i Hemstyrning. Home Assistant ändras inte.</p>
    <label>Informationskort eller 3D-objekt<select data-slot></select></label>
    <p data-hint></p><p data-current></p>
    <label>Sök alla tillgängliga entiteter<input type="search" data-entity-search placeholder="Namn eller entity_id"></label>
    <p data-count></p><div data-entity-results class="entity-results"></div>
    <label>Vald entitet<input data-entity-choice placeholder="Ingen koppling"></label>
    <p data-preview></p><div class="page-actions"><button type="button" data-binding-save>Spara koppling</button>
    <button type="button" data-binding-reset>Återställ koppling</button></div><p role="status" data-binding-status></p>`;
  const $=<T extends HTMLElement>(q:string)=>root.querySelector<T>(q)!;
  const slots=$<HTMLSelectElement>('[data-slot]'), choice=$<HTMLInputElement>('[data-entity-choice]');
  const search=$<HTMLInputElement>('[data-entity-search]');
  slots.innerHTML=sensorSlots.map(([key,label])=>`<option value="${esc(key)}">Kort · ${esc(label)}</option>`).join('')+
    ['weather','cloud','lux','moon'].map(key=>`<option value="environment:${key}">3D-miljö · ${key}</option>`).join('')+
    (config.value.bindings.calendars??[]).map((_,i)=>`<option value="calendar:${i}">Kalender ${i+1}</option>`).join('')+
    config.value.objects.filter(o=>o.type!=='surface'&&o.type!=='occluder').map(o=>`<option value="object:${esc(o.id)}">3D · ${esc(o.name)}</option>`).join('');
  function current(){const key=slots.value;if(key.startsWith('object:'))return config.value.objects.find(o=>o.id===key.slice(7))?.entityId??'';
    if(key.startsWith('environment:'))return config.value.bindings[key.slice(12) as 'weather'|'cloud'|'lux'|'moon']??'';
    if(key.startsWith('calendar:'))return config.value.bindings.calendars?.[Number(key.slice(9))]??'';
    return config.value.sensorBindings?.[key]??defaultEntity(key);}
  function preview(){const state=connection.states.get(choice.value.trim());$('[data-preview]').textContent=state?
    `${state.state} ${String(state.attributes.unit_of_measurement??'')} · Senast rapporterad ${new Date(state.last_reported??state.last_updated).toLocaleString('sv-SE')}`:'Ingen aktuell mätning för vald entitet';}
  function selected(){choice.value=current();$('[data-current]').textContent='Sparad koppling: '+(choice.value||'Ingen');
    $('[data-hint]').textContent=sensorSlots.find(([key])=>key===slots.value)?.[2]??'Kontrollera att entitetens fysiska funktion motsvarar objektet.';preview();}
  function results(){const query=search.value.toLocaleLowerCase('sv-SE');const states=[...connection.states.values()].filter(s=>
    (s.entity_id+' '+String(s.attributes.friendly_name??'')).toLocaleLowerCase('sv-SE').includes(query)).sort((a,b)=>a.entity_id.localeCompare(b.entity_id));
    $('[data-count]').textContent=`${states.length} träffar · ${connection.states.size} entiteter med aktuellt state (även okända och otillgängliga)`;
    const list=$('[data-entity-results]');const scroll=list.scrollTop;
    list.innerHTML=states.map(s=>`<button type="button" data-pick-entity="${esc(s.entity_id)}"><b>${esc(s.attributes.friendly_name??s.entity_id)}</b><code>${esc(s.entity_id)}</code><span>${esc(s.state)} ${esc(s.attributes.unit_of_measurement??'')}</span><small>${esc(new Date(s.last_reported??s.last_updated).toLocaleString('sv-SE'))}</small></button>`).join('');list.scrollTop=scroll;preview();}
  async function persist(reset:boolean){const key=slots.value,value=choice.value.trim();const status=$('[data-binding-status]');
    if(!reset&&value&&!connection.states.has(value)){status.textContent='Välj en entitet som finns i Home Assistants aktuella lista.';return;}
    const buttons=root.querySelectorAll<HTMLButtonElement>('[data-binding-save],[data-binding-reset]');buttons.forEach(b=>b.disabled=true);
    try{const response=await fetch('/workspace-api/scene');if(!response.ok)throw Error('Kunde inte läsa konfiguration');const latest=await response.json();
      if(key.startsWith('object:')){const obj=latest.objects.find((o:{id:string})=>o.id===key.slice(7));if(obj)obj.entityId=reset?'':value;}
      else if(key.startsWith('environment:'))latest.bindings[key.slice(12)]=reset?'':value;
      else if(key.startsWith('calendar:')){const i=Number(key.slice(9));if(!reset&&value&&!value.startsWith('calendar.'))throw Error('Välj en kalenderentitet');if(reset||!value)latest.bindings.calendars.splice(i,1);else latest.bindings.calendars[i]=value;}
      else {latest.sensorBindings??={};if(reset)delete latest.sensorBindings[key];else latest.sensorBindings[key]=value;}
      config.value=latest;config.changed();await config.save();status.textContent=config.status;selected();
    }catch(e){status.textContent=(e as Error).message;}finally{buttons.forEach(b=>b.disabled=false);}}
  slots.addEventListener('change',selected);search.addEventListener('input',results);choice.addEventListener('input',preview);
  root.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;
    if(b.dataset.pickEntity){choice.value=b.dataset.pickEntity;preview();}
    if(b.hasAttribute('data-binding-save'))void persist(false);if(b.hasAttribute('data-binding-reset'))void persist(true);});
  // Telemetry only updates the preview: typing, keyboard focus and result selection stay intact.
  connection.addEventListener('state',preview);connection.addEventListener('connection',results);
  cleanup.set(connection,()=>{connection.removeEventListener('state',preview);connection.removeEventListener('connection',results);});
  selected();results();return root;
}
