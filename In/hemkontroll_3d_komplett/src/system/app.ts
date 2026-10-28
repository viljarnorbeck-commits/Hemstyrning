import {entityPicker} from './entity-picker';
import{AdvancedEditor}from'./advanced-editor';
import * as THREE from 'three';
import './style.css';
import { Configuration } from './configuration';
import { Connection } from './connection';
import { GardenScene } from './scene';
import { automaticSeason, environmentTarget, liveInputs, freshState } from './environment';
import { editorPanel, entityOptions, environmentPanel, listPanel, objectPanel } from './panels';
import { type EnvironmentFrame, type ObjectKind, type Preview, type SceneObject, type Vec3, seasons } from './types';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const config = new Configuration();
const connection = new Connection();
let garden: GardenScene;
let administration:AdvancedEditor;
let mode: 'live' | 'simulation' = 'live';
let preview: Preview = { date: new Date().toISOString().slice(0, 16), cloud: 45, lux: 1000, brightness: 1, weather: 'clear' };
let panel: 'environment' | 'list' | 'editor' | 'object' | null = null;
let editing = false;
let selected: string | undefined;
let placing: ObjectKind | 'relocate' | null = null;
let points: Vec3[] = [];
const simulatedLights = new Map<string, boolean>();
let target: EnvironmentFrame;
let pending = false;
let luxSamples: number[] = [];
let lastLuxSample = '';
let noticeTimer: ReturnType<typeof setTimeout>;
function notify(message: string) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('toast').hidden = true, 6500); }
function persistPreview() { try { localStorage.setItem('hemkontroll-preview-v1', JSON.stringify({ mode, preview })); } catch { /* Nonessential local preferences. */ } }
function currentObject() { return config.value.objects.find(o => o.id === selected); }
function renderPanel() {
  $('panel').hidden = !panel;
  $('editor-button').classList.toggle('active', editing);
  $('mode-badge').hidden=true;
  $('mode-badge').textContent = mode === 'simulation' ? 'SIMULERING · inga kommandon' : connection.source === 'simulator' ? 'LOKAL HA-SIMULATOR' : 'LIVE · HOME ASSISTANT';
  $('mode-badge').classList.toggle('simulation', mode === 'simulation');
  const body = $('panel-body');
  if (panel === 'environment') body.innerHTML = environmentPanel(config.value, mode, preview);
  if (panel === 'list') body.innerHTML = listPanel(config.value, connection.states, mode, simulatedLights, connection.connected);
  if (panel === 'editor') body.innerHTML = editorPanel(config.value, placing, points.length);
  if (panel === 'object') { const object = currentObject(); body.innerHTML = object ? objectPanel(object, mode, editing) : '<h2>Välj ett objekt</h2>'; }
  updateStatus();
}
function cancelPlacement() { placing = null; points = []; garden.placement = false; garden.markPoints([]); garden.select(selected); $('placement-hint').hidden = true; }
function openPanel(value: typeof panel) { panel = value; renderPanel(); }
function updateStatus() {
  if (!config.value) return;
  $('connection-status').textContent = connection.connected ? (connection.source === 'simulator' ? 'Simulator ansluten' : 'Home Assistant ansluten') : 'Frånkopplad · återansluter';
  $('connection-status').classList.toggle('offline', !connection.connected);
  $('save-status').textContent = config.status;
  $('save-status').classList.toggle('unsaved', config.dirty);
  $('model-status').textContent = garden.models.status;
  const obj = currentObject();
  const status = $('object-status');
  if (obj && status) {
    const state = connection.states.get(obj.entityId);
    status.textContent = mode === 'simulation' ? (simulatedLights.get(obj.id) ? 'På · lokal simulering' : 'Av · lokal simulering') : !connection.connected ? 'Frånkopplad · lampans verkliga tillstånd kan inte verifieras' : state ? `${state.state} · ${state.last_updated}` : 'Ingen bekräftad entitet. Välj koppling i redigeraren.';
    const button = document.querySelector<HTMLButtonElement>('[data-action="toggle-light"]');
    if (button) { button.disabled = pending || (mode === 'live' && (!connection.connected || !['on', 'off'].includes(state?.state ?? '') || config.dirty)); button.textContent = pending ? 'Väntar på bekräftelse…' : mode === 'simulation' ? 'Växla lokal testbelysning' : 'Tänd / släck via Home Assistant'; }
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-state-for]')) {
    const object = config.value.objects.find(o => o.id === el.dataset.stateFor);
    if (!object) continue;
    el.textContent = mode === 'simulation' && object.type === 'light' ? (simulatedLights.get(object.id) ? 'På · simulerat' : 'Av · simulerat') : connection.connected ? connection.states.get(object.entityId)?.state ?? 'Ej kopplad' : 'Frånkopplad';
  }
}
function syncConfig() {
  garden.setConfig(config.value);
  const season = mode === 'live' ? automaticSeason(config.value, connection.states, new Date(), connection.connected) : config.value.activeModel;
  void garden.models.select(season, config.value.models[season]);
  config.changed();
  updateEnvironment();
}
function updateEnvironment() {
  if (!config.value) return;
  const live = liveInputs(config.value, connection.states, connection.connected);
  const luxState = connection.states.get(config.value.bindings.lux);
  const stamp = `${config.value.bindings.lux}:${luxState?.last_reported ?? luxState?.last_updated}:${config.value.luxCalibration.gain}:${config.value.luxCalibration.artificialLux}:${live.lux}`;
  if (stamp !== lastLuxSample && live.lux !== null) { lastLuxSample = stamp; luxSamples.push(live.lux); luxSamples = luxSamples.slice(-5); }
  const filtered = [...luxSamples].sort((a, b) => a - b);
  const lux = mode === 'simulation' ? preview.lux : live.lux === null ? null : filtered[Math.floor(filtered.length / 2)] ?? live.lux;
  const weather=connection.states.get(config.value.bindings.weather),attrs=connection.connected&&freshState(weather,config.value.bindings.weatherMaxAge)?weather!.attributes:{};
  const date = mode === 'simulation' ? new Date(preview.date + 'Z') : connection.source==='simulator'&&typeof attrs.simulated_datetime==='string'?new Date(attrs.simulated_datetime):new Date();
  target = environmentTarget({ date, ...config.value.location, cloud: mode === 'simulation' ? preview.cloud / 100 : live.cloud, lux, weather: mode === 'simulation' ? preview.weather : live.weather, sensorWeight: config.value.luxCalibration.weight, brightness: mode === 'simulation' ? preview.brightness : 1,rainIntensity:typeof attrs.rain_intensity==='number'?attrs.rain_intensity:undefined,snowIntensity:typeof attrs.snow_intensity==='number'?attrs.snow_intensity:undefined,windSpeed:Number(attrs.wind_speed??0),windDirection:Number(attrs.wind_bearing??0),gust:Number(attrs.wind_gust_speed??0),visibility:Number(attrs.visibility??20) });
  const season = mode === 'live' ? automaticSeason(config.value, connection.states, date, connection.connected) : config.value.activeModel;
  target.season=season;
  // Automatic switches need a real configured model; missing slots remain clearly labelled references.
  if (garden.models.active !== season && !garden.models.loading) void garden.models.select(season, config.value.models[season]);
  $('season-label').textContent = `${seasons[garden.models.active ?? season]}${config.value.models[garden.models.active ?? season].verified ? '' : ' · referens'}`;
  $('data-status').textContent = mode === 'simulation' ? 'Datum och väder styrs lokalt. Lamplägen är simulerade.' : live.warnings || 'SMHI-prognos via HA + lokal luxsensor · simulatorvärden när simulator är vald';
  const metrics = $('environment-metrics');
  if (metrics) metrics.textContent = `Solhöjd ${target.elevation.toFixed(1)}° · azimut ${target.azimuth.toFixed(1)}° · lux ${lux === null ? 'saknas' : Math.round(lux)} · sensorkorrigering ${target.luxUsed ? 'aktiv' : 'inaktiv'}`;
}
function setPath(path: string, value: unknown) {
  if (path === 'mode') {
    mode = value === 'simulation' ? 'simulation' : 'live';
    if (mode === 'simulation') for (const o of config.value.objects) simulatedLights.set(o.id, connection.states.get(o.entityId)?.state === 'on');
    persistPreview(); updateEnvironment(); renderPanel(); return;
  }
  if (path.startsWith('preview.')) {
    const key = path.split('.')[1] as keyof Preview;
    if (key === 'date' && !Number.isFinite(Date.parse(String(value) + 'Z'))) { notify('Välj ett giltigt datum'); return; }
    Object.assign(preview, { [key]: value }); persistPreview(); updateEnvironment(); return;
  }
  if(path==='bindings.calendars'){config.value.bindings.calendars=String(value).split(',').map(s=>s.trim()).filter(Boolean);syncConfig();return;}
  let root: object = config.value;
  let keys = path.split('.');
  if (keys[0] === 'object') { const obj = currentObject(); if (!obj) return; root = obj; keys = keys.slice(1); }
  if (keys[0] === 'model') { root = config.value.models[config.value.activeModel]; keys = keys.slice(1); }
  // Paths originate from the generated controls, never from imported HTML.
  let cursor = root as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) cursor = cursor[key] as Record<string, unknown>;
  cursor[keys.at(-1)!] = value;
  if (path === 'activeModel') { config.value.automatic.enabled = false; cancelPlacement(); }
  syncConfig();
  if (path === 'activeModel') renderPanel();
}
function startPlacement(kind: ObjectKind | 'relocate') {
  placing = kind; points = []; garden.markPoints([]); garden.placement = true; garden.transform.detach();
  $('placement-hint').innerHTML = `<span>${kind === 'solar' || kind === 'surface' ? 'Markera ytans hörn i 3D. Slutför i redigeraren.' : 'Klicka på gårdsmodellen för att placera objektet.'}</span> <button id="placement-tools">Visa verktyg</button>`;
  $('placement-tools').onclick = () => openPanel(kind === 'relocate' ? 'object' : 'editor');
  $('placement-hint').hidden = false;
  if (innerWidth <= 760) openPanel(null);
  else if (kind !== 'relocate') openPanel('editor');
}
const names: Record<ObjectKind,string> = { light: 'Lampa', car: 'Bil', parking: 'Parkering', solar: 'Solpaneler', mower: 'Robotgräsklippare', surface: 'Materialyta', vacuum: 'Robotdammsugare', energy: 'Energi', dock:'Laddstation',device:'Enhet',occluder:'Skymmande volym' };
function createObject(kind: ObjectKind, position: Vec3, points: Vec3[] = []): SceneObject {
  return { id: crypto.randomUUID(), type: kind, name: names[kind], entityId: '', position, rotation: [0, 0, 0], scale: [1, 1, 1], color: kind === 'light' ? '#ffd6a0' : kind === 'solar' ? '#1e405e' : kind === 'surface' ? '#668269' : '#7c9898', intensity: 1800, angle: 70, range: 18, roughness: kind === 'solar' ? 0.2 : 0.7, metalness: kind === 'solar' ? 0.5 : 0,representation:'standalone', points };
}
function addObject(object: SceneObject) { config.value.objects.push(object); selected = object.id; cancelPlacement(); syncConfig(); garden.select(selected); openPanel('object'); }
async function handleAction(action: string) {
  const obj = currentObject();
  if(action.startsWith('vertex:')&&obj){garden.editVertex(obj.id,Number(action.split(':')[1]));return;}
  if (action === 'administration'){cancelPlacement();administration.open();return;}
  if (action === 'toggle-light' && obj && !pending) {
    if (mode === 'simulation') { simulatedLights.set(obj.id, !simulatedLights.get(obj.id)); updateStatus(); return; }
    if (config.dirty) { notify('Spara entitetskopplingen innan lampan styrs'); return; }
    pending = true; updateStatus();
    try { await connection.toggle(obj.entityId, mode); } catch (error) { notify(error instanceof Error ? error.message : String(error)); }
    finally { pending = false; updateStatus(); }
  }
  if (action === 'edit-object') { editing = true; garden.setEditing(true); renderPanel(); }
  if (['translate', 'rotate', 'scale'].includes(action)) garden.transform.setMode(action as 'translate' | 'rotate' | 'scale');
  if (action === 'model-translate' || action === 'model-rotate') { if (garden.models.active !== config.value.activeModel) { notify('Välj och ladda modellen först'); return; } garden.calibrateModel(action === 'model-translate' ? 'translate' : 'rotate'); }
  if (action === 'relocate') startPlacement('relocate');
  if (action === 'cancel-place') { cancelPlacement(); renderPanel(); }
  if (action === 'finish-surface') {
    if (points.length < 3 || (placing !== 'solar' && placing !== 'surface')) { notify('Markera minst tre hörn'); return; }
    const vectors = points.map(p => new THREE.Vector3(...p));
    const normal = new THREE.Vector3().crossVectors(vectors[1].clone().sub(vectors[0]), vectors[2].clone().sub(vectors[0]));
    if (normal.lengthSq() < 1e-8) { notify('Hörnen ligger på en linje. Markera om ytan.'); return; }
    normal.normalize();
    if (placing==='solar'&&vectors.some(v => Math.abs(v.clone().sub(vectors[0]).dot(normal)) > 0.3)) { notify('Markera en plan yta; dela tak med olika lutning i separata ytor.'); return; }
    const center = vectors.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(points.length);
    addObject(createObject(placing, center.toArray() as Vec3, vectors.map(p => p.sub(center).toArray() as Vec3)));
  }
  if (action === 'delete-object' && obj) { config.value.objects = config.value.objects.filter(o => o.id !== obj.id); selected = undefined; syncConfig(); garden.select(); openPanel('list'); }
  if (action === 'center-model') {
    const calibration = garden.models.root.children[0]; const model = calibration?.children[0];
    if (!model || garden.models.active !== config.value.activeModel) { notify('Vänta tills rätt modell har laddats'); return; }
    // Measure rotated/scaled geometry without moving the independent object group.
    calibration.position.set(0, 0, 0); calibration.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(calibration);
    if (box.isEmpty()) { notify('Modellen saknar synlig geometri'); return; }
    const center = box.getCenter(new THREE.Vector3());
    config.value.models[config.value.activeModel].position = [-center.x, -box.min.y, -center.z]; syncConfig(); renderPanel();
  }
  if (action === 'ha-location') {
    const response = await fetch('/connection-api/config'); if (!response.ok) throw new Error('Kunde inte hämta HA-platsen');
    const location = await response.json();
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) throw new Error('HA saknar giltig plats');
    config.value.location.latitude = location.latitude; config.value.location.longitude = location.longitude;if(typeof location.time_zone==='string')config.value.location.timeZone=location.time_zone; syncConfig(); renderPanel();
  }
  if (action === 'export-config') {
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(config.value, null, 2)], { type: 'application/json' })); link.download = 'hemkontroll-scene.json'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}
async function importFile(input: HTMLInputElement) {
  const file = input.files?.[0]; if (!file) return;
  try {
    if (input.id === 'model-file') {
      if (file.size > 256 * 1048576) throw new Error('Modellen får vara högst 256 MB');
      const slot = config.value.activeModel;
      notify('Importerar modellen till lokal lagring…');
      const response = await fetch('/workspace-api/models', { method: 'POST', headers: { 'Content-Type': 'model/gltf-binary' }, body: file });
      const data = await response.json(); if (!response.ok) throw new Error(data.message ?? 'Import misslyckades');
      config.value.models[slot] = { url: data.url, label: file.name, verified: false, position: [0, 0, 0], rotation: [-90, 0, 0], scale: 1 };
      config.value.activeModel = slot; syncConfig(); renderPanel(); notify('Modellen importerad. Kalibrera axlar, skala, position och nordriktning.');
    } else {
      if (file.size > 2 * 1048576) throw new Error('Konfigurationen är för stor');
      const value = JSON.parse(await file.text());
      // Server schema validates before the imported document enters rendering code.
      const response = await fetch('/workspace-api/scene', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
      if (!response.ok) throw new Error('Konfigurationen godkändes inte');
      await config.load(); selected = undefined; cancelPlacement(); syncConfig(); renderPanel();
    }
  } catch (error) { notify(error instanceof Error ? error.message : String(error)); }
}
async function start() {
  try {
    await config.load();
    garden = new GardenScene($<HTMLCanvasElement>('garden'));
    garden.models.onStatus = updateStatus;
    garden.setConfig(config.value);
    administration=new AdvancedEditor(config,garden,syncConfig,currentObject,notify);
    garden.onSelect = id => { selected = id; garden.select(id); openPanel('object'); };
    garden.onVertexTransform=(id,index,point)=>{const item=config.value.objects.find(o=>o.id===id);if(item){item.points[index]=point;config.changed();renderPanel();}};
    garden.onModelTransform = (position, rotation, scale) => { Object.assign(config.value.models[config.value.activeModel], { position, rotation, scale }); config.changed(); renderPanel(); };
    garden.onTransform = (id, position, rotation, scale) => {
      const object = config.value.objects.find(o => o.id === id); if (!object) return;
      Object.assign(object, { position, rotation, scale }); config.changed(); renderPanel();
    };
    garden.onPlace = (position, normal) => {
      if (!placing) return;
      if (placing === 'solar' || placing === 'surface') { if (points.length >= 100) { notify('Högst 100 hörn per yta'); return; } points.push(position.map((v,i) => v + normal[i] * 0.035) as Vec3); garden.markPoints(points); renderPanel(); return; }
      const object = placing === 'relocate' ? currentObject() : createObject(placing, position);
      if (!object) return;
      object.position = [...position]; if (object.type === 'light') object.position[1] += 2.5;
      if (placing === 'relocate') { cancelPlacement(); syncConfig(); garden.select(selected); renderPanel(); }
      else addObject(object);
    };
    config.addEventListener('status', updateStatus);
    connection.addEventListener('state', () => { updateStatus(); updateEnvironment(); });
    connection.addEventListener('connection', () => { $('entity-options').innerHTML = entityOptions(connection.states); updateStatus(); updateEnvironment(); });
    $('environment-button').onclick = () => openPanel(panel === 'environment' ? null : 'environment');
    $('list-button').onclick = () => openPanel(panel === 'list' ? null : 'list');
    $('editor-button').textContent='Verktyg';$('editor-button').onclick=()=>{editing=true;garden.setEditing(true);cancelPlacement();openPanel('editor');};
    $('close-panel').onclick = () => openPanel(null);
    $('save-button').onclick = () => void config.save();
    $('reset-button').onclick = () => garden.reset();
    $('panel-body').addEventListener('change', event => {
      const el = event.target as HTMLInputElement | HTMLSelectElement;
      if(el.id==='object-bindings'){try{const value=JSON.parse((el as unknown as HTMLTextAreaElement).value);if(!value||Array.isArray(value)||!Object.values(value).every(v=>typeof v==='string'))throw new Error();const obj=currentObject();if(obj){obj.bindings=value;syncConfig();}}catch{notify('Kopplingarna måste vara ett JSON-objekt med textvärden');}return;}
      if (el instanceof HTMLInputElement && el.type === 'file') { void importFile(el); return; }
      if (!el.dataset.path) return;
      if (el instanceof HTMLInputElement && !el.checkValidity()) { el.reportValidity(); return; }
      const value = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el instanceof HTMLInputElement && ['number', 'range'].includes(el.type) ? Number(el.value) : el.value;
      setPath(el.dataset.path, value);
    });
    $('panel-body').addEventListener('click', event => {
      const el = (event.target as HTMLElement).closest<HTMLElement>('button'); if (!el) return;
      if (el.dataset.object) { selected = el.dataset.object; garden.select(selected); openPanel('object'); }
      if (el.dataset.place) startPlacement(el.dataset.place as ObjectKind);
      if(el.dataset.action==='link-ha'){const object=currentObject();if(object)entityPicker(connection.states,object,()=>{syncConfig();renderPanel();});return;}
      if (el.dataset.action==='editor-overview'){openPanel('editor');return;}
      if (el.dataset.action) void handleAction(el.dataset.action).catch(error => notify(error.message));
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') { cancelPlacement(); openPanel(null); }
      if ((event.target as HTMLElement)?.matches('input,select,textarea')) return;
      if (editing && event.key.toLowerCase() === 'g') garden.transform.setMode('translate');
      if (editing && event.key.toLowerCase() === 'r') garden.transform.setMode('rotate');
    });
    window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
    window.addEventListener('pagehide',()=>{connection.stop();administration.dispose();garden.dispose();},{once:true});
    window.addEventListener('beforeunload', event => { if (config.dirty) event.preventDefault(); });
    document.body.classList.add('editor-mode');
    const homeLink=document.createElement('a');homeLink.href='/';homeLink.textContent='Till Hemkontroll';homeLink.className='settings-link';$('list-button').after(homeLink);
    editing = true; garden.setEditing(true); panel = 'editor';
    updateEnvironment(); renderPanel();
    setInterval(updateEnvironment, 1000);
    void connection.start();
    garden.renderer.setAnimationLoop(() => { if (target) garden.frame(target, connection.states, connection.connected, simulatedLights, mode === 'simulation'); });
  } catch (error) { $('model-status').textContent = error instanceof Error ? error.message : String(error); $('data-status').textContent = 'Kontrollera att npm run dev kör både app och simulator. Ladda sedan om sidan.'; }
}
void start();
