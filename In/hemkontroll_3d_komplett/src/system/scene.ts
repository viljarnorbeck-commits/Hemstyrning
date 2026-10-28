import{telemetryTime}from'./telemetry-time';
import{robotLightState}from'./robot-light';
import{appearanceFor}from'./appearance';
import{ObjectAssets}from'./object-assets';
import{carVisible}from'./vehicle-state';
import{geographicToLocal}from'./geography';
import{groundSurface,traversableSegment,zonePoints,objectLocalPoint}from'./navigation';
import * as THREE from 'three';
import{Sky}from'./sky';
import{Surroundings}from'./terrain';
import{carVisual}from'./object-visuals';
import{isOccluded}from'./occlusion';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { panelLayout } from './panel-layout';
import { Precipitation } from './precipitation';
import { MowerTrackingService } from './tracking';
import { ModelManager, disposeTree } from './models';
import { damp, clamp } from './environment';
import type { EnvironmentFrame, HassState, SceneConfig, SceneObject, Vec3 } from './types';

const radians = (v: number) => THREE.MathUtils.degToRad(v);
export class GardenScene {
  private assets=new ObjectAssets();
  private headlights=new Map<string,THREE.SpotLight>();
  private diagnostic=false;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(48, 1, 0.15, 1200);
  readonly controls: OrbitControls;
  readonly transform: TransformControls;
  readonly models = new ModelManager();
  readonly objects = new THREE.Group();
  private environment = new THREE.Group();
  private sky=new Sky();
  private surroundings=new Surroundings();
  private occlusionVolumes=new THREE.Group();
  private moon=new THREE.DirectionalLight('#b8cdf3',0);
  private followId?:string;
  private skyView=false;
  private latestEnvironment?:EnvironmentFrame;
  private markerRay=new THREE.Raycaster();
  private sun = new THREE.DirectionalLight(0xffebc8, 2);
  private ambient = new THREE.HemisphereLight(0xdceaff, 0x73806b, 1);
  private precipitation = new Precipitation();
  private trackers = new Map<string,MowerTrackingService>();
  private tracking = new Map<string,ReturnType<MowerTrackingService['update']>>();
  private observer:ResizeObserver;
  private groundRay = new THREE.Raycaster();
  private selected?: string;
  private modelEditing = false;
  private raycaster = new THREE.Raycaster();
  private lastFrame = performance.now();
  private daylight = 1;
  private renderObjects = new Map<string, THREE.Group>();
  private lamps = new Map<string, THREE.SpotLight>();
  private config?: SceneConfig;
  private surfaceMarkers = new THREE.Group();
  private vertex?:{id:string;index:number;handle:THREE.Object3D};
  onVertexTransform:(id:string,index:number,point:Vec3)=>void=()=>{};
  onModelTransform: (p: Vec3, r: Vec3, scale: number) => void = () => {};
  onSelect: (id: string) => void = () => {};
  onPlace: (point: Vec3, normal: Vec3) => void = () => {};
  onTransform: (id: string, p: Vec3, r: Vec3, s: Vec3) => void = () => {};
  placement = false;
  editing = false;
  private dragging = false;
  private pointerMoved=false;
  private pointerDown = new THREE.Vector2();
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera.position.set(55, 32, 55);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;this.controls.addEventListener('start',()=>this.followId=undefined);
    this.controls.target.set(0, 1, 0);
    this.controls.minDistance = 2; this.controls.maxDistance = 230;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.sun.position.set(40, 80, 30);
    this.sun.target.position.set(0, 0, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -45; this.sun.shadow.camera.right = 45;
    this.sun.shadow.camera.top = 45; this.sun.shadow.camera.bottom = -45;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.normalBias = 0.08;
    this.moon.shadow.mapSize.set(512,512);this.moon.shadow.camera.left=-40;this.moon.shadow.camera.right=40;this.moon.shadow.camera.top=40;this.moon.shadow.camera.bottom=-40;this.moon.shadow.camera.far=220;this.moon.shadow.normalBias=.08;this.environment.add(this.sun, this.sun.target, this.ambient,this.moon,this.moon.target);
    this.scene.add(this.models.root, this.objects, this.environment, this.surfaceMarkers,this.sky.root,this.surroundings.root,this.occlusionVolumes);
    this.scene.background = new THREE.Color('#8faeb6');
    this.scene.fog = new THREE.FogExp2('#8faeb6', 0.001);
    this.transform = new TransformControls(this.camera, canvas);
    this.transform.setSize(0.85);
    this.scene.add(this.transform.getHelper());this.transform.getHelper().visible=false;this.transform.enabled=false;
    this.transform.addEventListener('dragging-changed', event => {
      this.controls.enabled = !event.value; this.dragging = !!event.value;
    });
    this.transform.addEventListener('mouseUp', () => {
      const obj = this.transform.object;
      if(this.vertex&&obj){const item=this.config?.objects.find(o=>o.id===this.vertex?.id);if(item)this.onVertexTransform(item.id,this.vertex.index,objectLocalPoint(item,obj.position.toArray() as Vec3));return;}
      if (obj && this.modelEditing) { this.onModelTransform(obj.position.toArray() as Vec3, [obj.rotation.x, obj.rotation.y, obj.rotation.z].map(THREE.MathUtils.radToDeg) as Vec3, obj.scale.x); return; }
      if (obj && this.selected) this.onTransform(this.selected, obj.position.toArray() as Vec3, [obj.rotation.x, obj.rotation.y, obj.rotation.z].map(THREE.MathUtils.radToDeg) as Vec3, obj.scale.toArray() as Vec3);
    });
    this.environment.add(this.precipitation.root);
    canvas.addEventListener('pointerdown', e => {this.pointerDown.set(e.clientX,e.clientY);this.pointerMoved=!e.isPrimary||e.button!==0;});
    canvas.addEventListener('pointermove',e=>{if(this.pointerDown.distanceTo(new THREE.Vector2(e.clientX,e.clientY))>6)this.pointerMoved=true;});
    canvas.addEventListener('pointerup', e => {
      if (this.pointerMoved ||this.dragging || this.transform.axis || this.pointerDown.distanceTo(new THREE.Vector2(e.clientX, e.clientY)) > 6) return;
      const rect = canvas.getBoundingClientRect();
      this.raycaster.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1), this.camera);
      if (this.editing && this.placement) {
        const hit = this.raycaster.intersectObject(this.models.root, true)[0];
        if (hit) {
          const normal = hit.face?.normal.clone().transformDirection(hit.object.matrixWorld) ?? new THREE.Vector3(0, 1, 0);
          this.onPlace(hit.point.toArray() as Vec3, normal.toArray() as Vec3);
        }
      } else {
        const hit = this.raycaster.intersectObjects([this.objects,this.occlusionVolumes], true)[0];
        if (hit) { if(!this.editing&&(this.config?.appearance?.occlusion??true)&&isOccluded(this.camera,hit.point,[this.models.root,this.occlusionVolumes],this.markerRay))return; let obj: THREE.Object3D | null = hit.object; while (obj && !obj.userData.id) obj = obj.parent; if (obj) this.onSelect(obj.userData.id); }
      }
    });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.getElementById('model-status')!.textContent = '3D avbröts. Ladda om sidan; sparad konfiguration finns kvar.'; });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    this.resize();
  }
  private resize() { const { width, height } = this.renderer.domElement.getBoundingClientRect(); if(this.config?.quality==='auto'){this.models.detail=width>=900;this.renderer.setPixelRatio(Math.min(devicePixelRatio,width>=900?2:1.5));} this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
  setConfig(config: SceneConfig) {
    this.config = config;this.renderer.toneMapping=config.appearance?.toneMapping==='agx'?THREE.AgXToneMapping:config.appearance?.toneMapping==='neutral'?THREE.NeutralToneMapping:THREE.ACESFilmicToneMapping;
    this.models.grading=config.appearance;
    this.moon.castShadow=config.quality==='high';
    const high=config.quality==='high'||config.quality==='auto'&&innerWidth>=900;
    this.models.detail=high;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, high ? 2 : 1.5));
    this.renderer.shadowMap.enabled = config.quality==='high';
    this.models.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.rebuildObjects(); this.resize();
  }
  private rebuildObjects() {
    this.assets.reset();this.headlights.clear();this.transform.detach();
    disposeTree(this.objects); this.objects.clear();disposeTree(this.occlusionVolumes);this.occlusionVolumes.clear(); this.renderObjects.clear(); this.lamps.clear();
    for (const item of this.config?.objects ?? []) {
      const group = new THREE.Group(); group.userData.id = item.id;group.userData.type=item.type;
      group.position.fromArray(item.position); group.rotation.set(...item.rotation.map(radians) as Vec3); group.scale.fromArray(item.scale);
      const material = new THREE.MeshStandardMaterial({ color: item.color, roughness: item.roughness, metalness: item.metalness, side: THREE.DoubleSide });
      let mesh: THREE.Mesh;
      if(item.asset){group.userData.assetStatus='Laddar egen modell';void this.assets.attach(group,item.asset);}
      if(item.type==='occluder'){mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#b6d5eb',wireframe:true,transparent:true,opacity:.25}));mesh.position.y=.5;group.add(mesh);this.occlusionVolumes.add(group);this.renderObjects.set(item.id,group);material.dispose();continue;}
      if(item.type==='car'){if(item.representation==='standalone')group.add(carVisual(item.color));else{group.userData.embedded=true;const proxy=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.5,4.2),new THREE.MeshBasicMaterial({visible:false}));proxy.position.y=.75;proxy.userData.pickOnly=true;group.add(proxy);}this.objects.add(group);this.renderObjects.set(item.id,group);material.dispose();continue;}
      if ((item.type === 'surface' || item.type === 'solar') && item.points.length >= 3) mesh = new THREE.Mesh(polygonGeometry(item.points), material);
      else if (item.type === 'light') {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), material);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.65, 8), new THREE.MeshStandardMaterial({ color: '#3b454a', roughness: 0.5 })); pole.position.y = 0.4; group.add(pole);
        const lamp = new THREE.SpotLight(item.color, 0, item.range, radians(item.angle / 2), 0.6, 2);
        lamp.target.position.set(0, -1, 0);
        lamp.castShadow = this.lamps.size === 0; lamp.shadow.mapSize.set(512, 512); lamp.shadow.normalBias = 0.05;
        group.add(lamp, lamp.target); this.lamps.set(item.id, lamp);
      } else if(item.type==='solar'){
        mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.05,1),material,200);(mesh as THREE.InstancedMesh).count=0;
      } else if (item.type === 'surface' || item.type === 'parking') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(item.type === 'parking' ? 2.5 : 1.2, 0.04, item.type === 'parking' ? 5 : 2), material);
      } else if(item.type==='vacuum'){mesh=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.13,24),material);mesh.position.y=.1;
      } else if(item.type==='dock'){mesh=new THREE.Mesh(new THREE.BoxGeometry(.8,.12,1.1),material);mesh.position.y=.06;
      } else if(item.type==='energy'){material.visible=false;mesh=new THREE.Mesh(new THREE.SphereGeometry(.1,6,4),material);
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.65,0.3,0.9), material);
        mesh.position.y = 0.15;
      }
      if(item.zone){material.transparent=true;material.opacity=.18;material.depthWrite=false;group.userData.editorOnly=true;}
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh); this.objects.add(group); this.renderObjects.set(item.id, group);
    }
    this.occlusionVolumes.visible=this.editing;this.select(this.selected);
  }
  editVertex(id:string,index:number){const item=this.config?.objects.find(o=>o.id===id);if(!this.editing||!item||!item.points[index])return;this.select(id);this.markPoints(zonePoints(item));const handle=this.surfaceMarkers.children[index];this.vertex={id,index,handle};this.transform.setMode('translate');this.transform.attach(handle);}
  calibrateModel(mode: 'translate' | 'rotate') { const root = this.models.root.children[0]; if (!root || !this.editing) return; this.modelEditing = true; this.transform.setMode(mode); this.transform.attach(root); }
  select(id?: string) { this.vertex=undefined;this.modelEditing = false; this.selected = id; const group = id ? this.renderObjects.get(id) : undefined; if (this.editing && group) this.transform.attach(group); else this.transform.detach(); }
  setEditing(value: boolean) { this.editing=value;this.transform.enabled=value;this.transform.getHelper().visible=value;this.surfaceMarkers.visible=value;this.occlusionVolumes.visible=value;this.select(this.selected); }
  markPoints(points: Vec3[]) {
    disposeTree(this.surfaceMarkers); this.surfaceMarkers.clear();
    for (const p of points) { const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#a7f0ce', depthTest: false })); dot.position.fromArray(p); dot.renderOrder = 10; this.surfaceMarkers.add(dot); }
  }
  frame(target: EnvironmentFrame, states: Map<string, HassState>, connected: boolean, simulatedLights: Map<string, boolean>, simulation: boolean) {
    this.latestEnvironment=target;
    const now = performance.now();
    if(now-this.lastFrame<1000/30)return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.1); this.lastFrame = now;
    if(this.diagnostic){this.models.root.visible=true;this.renderer.toneMapping=THREE.NoToneMapping;this.renderer.toneMappingExposure=1;this.scene.fog=null;this.scene.background=new THREE.Color('#777777');this.sky.root.visible=this.environment.visible=this.objects.visible=this.surroundings.root.visible=this.occlusionVolumes.visible=this.surfaceMarkers.visible=false;this.transform.detach();this.controls.update();this.renderer.render(this.scene,this.camera);return;}
    this.scene.fog??=new THREE.FogExp2('#8faeb6',.001);this.sky.root.visible=this.environment.visible=true;this.models.root.visible=this.objects.visible=!this.skyView;this.transform.getHelper().visible=this.editing&&!this.skyView;this.surfaceMarkers.visible=this.editing&&!this.skyView;
    this.daylight = damp(this.daylight, target.daylight, dt);
    const appearance=this.config?appearanceFor(this.config,target):{warmth:.035,saturation:1.08,contrast:1.04,exposure:1};if(this.models.grading){this.models.grading={...this.models.grading,warmth:damp(this.models.grading.warmth,appearance.warmth,dt),saturation:damp(this.models.grading.saturation,appearance.saturation,dt),contrast:damp(this.models.grading.contrast,appearance.contrast,dt)};}
    this.renderer.toneMappingExposure=damp(this.renderer.toneMappingExposure,appearance.exposure*((1-target.daylight)*(this.config?.appearance?.nightExposure??2.2)+target.daylight),dt,4);
    this.moon.intensity=damp(this.moon.intensity,target.moonLight??0,dt);const moonDirection=new THREE.Vector3(...(target.moonDirection??[0,-1,0])).multiplyScalar(100);this.moon.position.lerp(moonDirection,1-Math.exp(-dt/3));
    this.ambient.color.set('#b2c5e1').lerp(new THREE.Color('#dceaff'),this.daylight);
    this.sun.intensity = damp(this.sun.intensity, target.direct, dt);
    this.ambient.intensity = damp(this.ambient.intensity, target.ambient, dt);
    const desired = new THREE.Vector3(...target.sunDirection).multiplyScalar(100);
    this.sun.position.lerp(desired, 1 - Math.exp(-dt / 3));
    this.sun.color.setHSL(0.09, 0.2 + 0.5 * (1 - this.daylight), 0.85);
    const sky = new THREE.Color('#071221').lerp(new THREE.Color('#9fbac4'), this.daylight);
    (this.scene.background as THREE.Color).lerp(sky, 1 - Math.exp(-dt / 3));
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.copy(this.scene.background as THREE.Color); fog.density = damp(fog.density, Math.max(.0015,target.fog), dt, 4);
    this.sky.update(target,this.camera,this.config,dt);this.surroundings.update(this.models.root.children[0],target.season??'autumn',this.config?.appearance?.terrain??true);
    if(this.skyView)this.surroundings.root.visible=false;this.precipitation.update(target,this.camera,dt,this.config?.quality??'low',(x,z)=>this.groundAt(x,z));
    this.models.setWetness(target.rain);
    this.renderer.shadowMap.enabled=this.config?.quality==='high'||this.config?.quality==='auto'&&target.daylight<.15;
    let activeLights=0;
    for (const item of this.config?.objects ?? []) {
      if(item.type==='car'){const model=this.renderObjects.get(item.id);if(model){const visible=carVisible(item,states,model.userData.presenceVisible);model.userData.presenceVisible=visible;model.visible=this.editing||visible;}}
      const rendered=this.renderObjects.get(item.id);if(rendered?.userData.editorOnly)rendered.visible=this.editing;
      if(item.type==='solar'){
        const model=this.renderObjects.get(item.id),mesh=model?.children.find(c=>c instanceof THREE.InstancedMesh)as THREE.InstancedMesh|undefined,count=Math.round(clamp(Number(states.get(item.entityId)?.attributes.panel_count??1),0,200));
        if(mesh&&model&&model.userData.panelCount!==count){const layout=panelLayout(count),matrix=new THREE.Matrix4();for(let i=0;i<layout.length;i++){const panel=layout[i];matrix.makeScale(panel.width,1,panel.depth);matrix.setPosition(panel.x,.1,panel.z);mesh.setMatrixAt(i,matrix);}mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();model.userData.panelCount=count;}
      }
      if(item.type==='mower'){
        let tracker=this.trackers.get(item.id);if(!tracker){tracker=new MowerTrackingService();this.trackers.set(item.id,tracker);}
        const state=states.get(item.entityId),positionState=states.get(item.bindings?.position??item.entityId),a=positionState?.attributes;
        if(connected&&a){
          let x=typeof a.local_x==='number'?a.local_x:NaN,z=typeof a.local_z==='number'?a.local_z:NaN;
          if(!Number.isFinite(x)&&typeof a.latitude==='number'&&typeof a.longitude==='number'&&this.config){const local=geographicToLocal({latitude:a.latitude,longitude:a.longitude,altitude:Number(a.altitude??this.config.geography?.altitude??0)},{...this.config.location,altitude:this.config.geography?.altitude??0},this.config.location.northOffset);x=local[0];z=local[2];}
          x+=item.trackingOffset?.[0]??0;z+=item.trackingOffset?.[2]??0;
          const sampled=typeof a.position_sampled_at==='string'?a.position_sampled_at:positionState?.last_updated;
          if(Number.isFinite(x)&&Number.isFinite(z)&&sampled)tracker.accept({x,z,t:Date.parse(sampled),accuracy:Number(a.accuracy_m??a.gps_accuracy??1),speed:typeof a.speed_mps==='number'?a.speed_mps:undefined,heading:typeof a.heading_deg==='number'?a.heading_deg:undefined},telemetryTime(state));
        }
        const info=tracker.update(telemetryTime(state),state?.state??'unknown',connected,dt,(from,to)=>traversableSegment(from,to,this.config?.objects??[]));this.tracking.set(item.id,info);
        const model=this.renderObjects.get(item.id);if(info&&model&&!this.editing){model.position.x=info.x;model.position.z=info.z;const ground=this.groundAt(info.x,info.z);if(ground!==null)model.position.y=damp(model.position.y,ground+(item.trackingOffset?.[1]??0),dt,.18);const surface=groundSurface(info.x,info.z,this.config?.objects??[]),up=new THREE.Vector3(...(surface?.normal??[0,1,0]));const heading=info.heading??0,forward=new THREE.Vector3(Math.sin(heading),0,-Math.cos(heading));forward.addScaledVector(up,-forward.dot(up)).normalize();const right=new THREE.Vector3().crossVectors(forward,up).normalize(),back=forward.clone().negate();const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,back));model.quaternion.slerp(rotation,1-Math.exp(-dt*4));}
      }
      if(item.type==='mower')this.updateHeadlight(item,states,target,dt,connected);
      const lamp = this.lamps.get(item.id); if (!lamp) continue;
      const state = states.get(item.entityId);
      const on = simulation ? simulatedLights.get(item.id) ?? false : connected && state?.state === 'on';
      const brightness = simulation ? 1 : clamp(Number(state?.attributes.brightness ?? 255) / 255, 0, 1);
      lamp.power = damp(lamp.power, on ? item.intensity * brightness : 0, dt, 0.25);
      lamp.visible=lamp.power>.5&&activeLights++<8;lamp.castShadow=lamp.visible&&activeLights===1;
      const kelvin = Number(state?.attributes.color_temp_kelvin);
      lamp.color.set(item.color);
      if (!simulation && Number.isFinite(kelvin)) lamp.color.setRGB(...kelvinRGB(kelvin));
      const rgb=state?.attributes.rgb_color;if(!simulation&&Array.isArray(rgb)&&rgb.length===3&&rgb.every(v=>Number.isFinite(v)))lamp.color.setRGB(Number(rgb[0])/255,Number(rgb[1])/255,Number(rgb[2])/255,THREE.SRGBColorSpace);
      const bulb = this.renderObjects.get(item.id)?.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry) as THREE.Mesh | undefined;
      if (bulb) { const m = bulb.material as THREE.MeshStandardMaterial; m.emissive.copy(lamp.color); m.emissiveIntensity = on ? 2 : 0; }
    }
    if(this.followId){const followed=this.renderObjects.get(this.followId);if(followed){const offset=followed.position.clone().sub(this.controls.target).multiplyScalar(1-Math.exp(-dt*2));this.controls.target.add(offset);this.camera.position.add(offset);}}
    if(!this.skyView){const focus=this.controls.target.clone();this.surroundings.constrainFocus(this.controls.target);this.camera.position.add(this.controls.target.clone().sub(focus));}
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  setDiagnostics(profile:'mobile'|'detail'|'reference',neutral:boolean){this.diagnostic=neutral;this.models.reference=profile==='reference';this.models.detail=profile!=='mobile';this.models.setNeutral(neutral);this.transform.enabled=this.editing&&!neutral;this.transform.getHelper().visible=this.editing&&!neutral;if(!neutral&&this.config)this.renderer.toneMapping=this.config.appearance?.toneMapping==='agx'?THREE.AgXToneMapping:this.config.appearance?.toneMapping==='neutral'?THREE.NeutralToneMapping:THREE.ACESFilmicToneMapping;const season=this.models.active??this.config?.activeModel;if(season&&this.config)void this.models.select(season,this.config.models[season]);}
  diagnostics(){return{modelTextures:this.models.diagnostics(),maxTextureSize:this.renderer.capabilities.maxTextureSize,sky:this.sky.status(),triangles:this.renderer.info.render.triangles,calls:this.renderer.info.render.calls,textures:this.renderer.info.memory.textures,geometries:this.renderer.info.memory.geometries,pixelRatio:this.renderer.getPixelRatio(),resolution:[this.renderer.domElement.width,this.renderer.domElement.height],anisotropy:this.renderer.capabilities.getMaxAnisotropy()};}
  private updateHeadlight(item:SceneObject,states:Map<string,HassState>,target:EnvironmentFrame,dt:number,connected:boolean){const config=item.headlight,model=this.renderObjects.get(item.id);if(!config?.enabled||!model||this.editing)return;let lamp=this.headlights.get(item.id);if(!lamp){lamp=new THREE.SpotLight('#fff1db',0,9,radians(config.angle/2),.65,2);lamp.target.position.set(0,-.35,-4);lamp.target.userData.lightTarget=true;model.add(lamp,lamp.target);this.headlights.set(item.id,lamp);}lamp.castShadow=this.config?.quality==='high';lamp.shadow.mapSize.set(256,256);lamp.shadow.normalBias=.02;lamp.position.fromArray(config.position);lamp.color.setRGB(...kelvinRGB(config.kelvin));const status=robotLightState(item,states,this.config!,target,connected),on=status.on;lamp.power=damp(lamp.power,on?config.lumens:0,dt,.3);lamp.visible=lamp.power>.5;model.userData.headlightStatus=`${on?'På':'Av'} · ${status.source} · okalibrerad ljusprofil`;}
  assetInfo(id:string){return this.renderObjects.get(id)?.userData.assetStatus??'Testgeometri · egen 3D-modell saknas';}
  headlightInfo(id:string){return this.renderObjects.get(id)?.userData.headlightStatus??'Ej konfigurerat';}
  previewSky(){this.lookAtSky();this.controls.enabled=true;this.controls.enableZoom=false;this.controls.enablePan=false;}
  trackingInfo(id:string){return this.tracking.get(id);}
  lookAtSky(){const env=this.latestEnvironment;if(!env)return;this.skyView=true;this.followId=undefined;this.controls.maxPolarAngle=Math.PI;this.controls.enableDamping=false;this.controls.enabled=false;const direction=env.daylight>.5?new THREE.Vector3(...env.sunDirection):(env.moonAltitude??-1)>0?new THREE.Vector3(...(env.moonDirection??[0,1,0])):new THREE.Vector3(0,.5,-1).normalize();this.controls.target.copy(this.camera.position).addScaledVector(direction,120);this.controls.update();}
  follow(id:string){this.skyView=false;this.controls.enabled=true;this.controls.enableDamping=true;this.controls.maxPolarAngle=Math.PI*.49;this.followId=id;const model=this.renderObjects.get(id);if(model){const delta=this.camera.position.clone().sub(this.controls.target).normalize().multiplyScalar(22);this.controls.target.copy(model.position);this.camera.position.copy(model.position).add(delta);}}
  screenPosition(id:string){const object=this.renderObjects.get(id);if(!object||!object.visible||this.diagnostic||this.skyView)return null;const physical=object.getWorldPosition(new THREE.Vector3());physical.y+=object.userData.type==='car'?.75:object.userData.type==='mower'?.15:0;const point=physical.clone();point.y+=1.2;const distance=this.camera.position.distanceTo(point),occluded=(this.config?.appearance?.occlusion??true)&&isOccluded(this.camera,physical,[this.models.root,this.occlusionVolumes],this.markerRay);const p=point.project(this.camera);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight,z:p.z,occluded,distance};}
  private groundAt(x:number,z:number){const surface=groundSurface(x,z,this.config?.objects??[]);if(surface)return surface.height;this.groundRay.firstHitOnly=true;this.groundRay.set(new THREE.Vector3(x,80,z),new THREE.Vector3(0,-1,0));const hit=this.groundRay.intersectObject(this.models.root,true)[0];return hit?.point.y??null;}
  dispose(){this.assets.reset();this.renderer.setAnimationLoop(null);this.observer.disconnect();this.controls.dispose();this.transform.dispose();this.models.dispose();this.sky.dispose();disposeTree(this.sky.root);disposeTree(this.surroundings.root);disposeTree(this.occlusionVolumes);disposeTree(this.objects);disposeTree(this.environment);disposeTree(this.surfaceMarkers);this.renderer.dispose();}
  reset() { this.skyView=false;this.followId=undefined;this.controls.enabled=true;this.controls.enableDamping=true;this.controls.maxPolarAngle=Math.PI*.49;this.controls.enableZoom=this.controls.enablePan=true;this.camera.position.set(55, 32, 55); this.controls.target.set(0, 1, 0); }
}
function kelvinRGB(value: number): Vec3 {
  const temp = clamp(value, 1000, 12000) / 100;
  return [clamp(temp <= 66 ? 255 : 329.6987 * (temp - 60) ** -0.1332, 0, 255) / 255, clamp(temp <= 66 ? 99.4708 * Math.log(temp) - 161.1196 : 288.1222 * (temp - 60) ** -0.0755, 0, 255) / 255, clamp(temp >= 66 ? 255 : temp <= 19 ? 0 : 138.5177 * Math.log(temp - 10) - 305.0448, 0, 255) / 255];
}
function polygonGeometry(points: Vec3[]) {
  const vectors = points.map(p => new THREE.Vector3(...p));
  const normal = new THREE.Vector3();
  for (let i = 0; i < vectors.length; i++) normal.add(new THREE.Vector3().crossVectors(vectors[i], vectors[(i + 1) % vectors.length]));
  if (normal.lengthSq() < 1e-10) return new THREE.BufferGeometry();
  normal.normalize();
  const u = vectors[1].clone().sub(vectors[0]).normalize(), v = new THREE.Vector3().crossVectors(normal, u).normalize();
  const projected = vectors.map(p => new THREE.Vector2(p.dot(u), p.dot(v)));
  const indices = THREE.ShapeUtils.triangulateShape(projected, []).flat();
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
