import {EnergyNetwork} from './energy-network';
import {visualSignature} from './presentation-state';
import{graphicsProfile,profiles}from'./client-platform';
import {cameraFloor,constrainGroundCamera} from './ground-model';
import type {LearnedGraph,YardGrid} from '../../../../shared/yard-types';
import {SurfaceInput,type Tap} from './surface-input';
import{telemetryTime}from'./telemetry-time';
import{robotLightState}from'./robot-light';
import{appearanceFor}from'./appearance';
import{ObjectAssets}from'./object-assets';
import{carVisible}from'./vehicle-state';
import{geographicToLocal}from'./geography';
import{supportedGroundSegment,ZoneIndex,groundSurface,traversableSegment,zonePoints,objectLocalPoint}from'./navigation';
import * as THREE from 'three';
import{Sky}from'./sky';
import{Surroundings}from'./terrain';
import{carVisual,mowerVisual}from'./object-visuals';
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
  private animation:(()=>void)|null=null;
  setAnimationLoop(callback:(()=>void)|null){this.animation=callback;this.renderer.setAnimationLoop(callback);}
  readonly energyNetwork=new EnergyNetwork();private visualStates=new Map<string,HassState>();
  private followId?:string;
  private skyView=false;
  private latestEnvironment?:EnvironmentFrame;
  private markerRay=new THREE.Raycaster();
  private sun = new THREE.DirectionalLight(0xffebc8, 2);
  private ambient = new THREE.HemisphereLight(0xdceaff, 0x73806b, 1);
  private precipitation = new Precipitation();
  private routeOverlay=new THREE.Group();private replay?:{samples:{point:Vec3;t:number}[];started:number;marker:THREE.Mesh};
  showLearnedRoutes(graph:LearnedGraph){this.showRouteHistory([]);if(graph.stale)return;for(const e of graph.edges){const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...e.from),new THREE.Vector3(...e.to)]);this.routeOverlay.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({color:e.changed?'#ffc65c':'#64c6ee'})));}this.scene.add(this.routeOverlay);}
  showRouteHistory(samples:{point:Vec3;t:number;accepted?:boolean}[],play=false){disposeTree(this.routeOverlay);this.routeOverlay.clear();this.replay=undefined;if(!samples.length)return;for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],uncertain=a.accepted===false||b.accepted===false||b.t-a.t>15000;const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a.point).add(new THREE.Vector3(0,.15,0)),new THREE.Vector3(...b.point).add(new THREE.Vector3(0,.15,0))]);const line=new THREE.Line(geometry,uncertain?new THREE.LineDashedMaterial({color:'#ffbf45',dashSize:.3,gapSize:.3}):new THREE.LineBasicMaterial({color:'#64c6ee'}));line.computeLineDistances();this.routeOverlay.add(line);}const reliable=samples.filter(s=>s.accepted!==false);if(play&&reliable.length){const marker=new THREE.Mesh(new THREE.SphereGeometry(.35,12,8),new THREE.MeshBasicMaterial({color:'#ffc65c'}));this.routeOverlay.add(marker);this.replay={samples:reliable,started:performance.now(),marker};}this.scene.add(this.routeOverlay);}
  private updateReplay(){this.routeOverlay.visible=this.editing;this.yardOverlay.visible=this.yardOverlay.visible&&this.editing;if(!this.replay||!this.editing)return;const r=this.replay,time=r.samples[0].t+(performance.now()-r.started)*4;let i=r.samples.findIndex(s=>s.t>=time);if(i<0)i=r.samples.length-1;if(i>0){const a=r.samples[i-1],b=r.samples[i],f=Math.max(0,Math.min(1,(time-a.t)/Math.max(1,b.t-a.t))),safe=b.t-a.t<=15000&&this.safeMowerSegment({x:a.point[0],z:a.point[2]},{x:b.point[0],z:b.point[2]},.56);r.marker.position.fromArray(a.point);if(safe)r.marker.position.lerp(new THREE.Vector3(...b.point),f);const h=this.groundAt(r.marker.position.x,r.marker.position.z);if(h!==null)r.marker.position.y=h;r.marker.position.y+=.35;this.renderer.domElement.dataset.replayQuality=safe?'historical-interpolation':'uncertain-gap';}}

  private learnedGraph?:LearnedGraph;private learningRefresh=0;
  private trackers = new Map<string,MowerTrackingService>();
  private tracking = new Map<string,ReturnType<MowerTrackingService['update']>>();
  private observer:ResizeObserver;
  private zoneIndex?:ZoneIndex;private yard?:YardGrid;private yardModel?:THREE.Object3D;private yardSignature='';private yardRequest=0;private fallbackGround=0;private yardOverlay=new THREE.Group();
  setYardAnalysis(grid:YardGrid|undefined){this.zoneIndex=undefined;this.yard=grid;disposeTree(this.yardOverlay);this.yardOverlay.clear();for(const p of grid?.proposals??[]){if(p.status==='rejected')continue;const geometry=new THREE.BufferGeometry().setFromPoints(p.points.map(v=>new THREE.Vector3(v[0],v[1]+.05,v[2])));geometry.setIndex([0,1,2,0,2,3]);this.yardOverlay.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:p.kind==='ground'?'#40ce72':p.kind==='obstacle'?'#ee5555':'#ffcf45',transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false})));}this.scene.add(this.yardOverlay);}
  showYardAnalysis(show:boolean){this.yardOverlay.visible=show&&this.editing;}
  async loadYardAnalysis(){const revision=++this.yardRequest;try{const response=await fetch('/workspace-api/yard-analysis');if(response.ok){const data=await response.json(),model=this.config?.models[this.config.activeModel],signature=(m:typeof model)=>m?JSON.stringify([m.url,m.position,m.rotation,m.scale]):'';if(revision!==this.yardRequest||signature(model)!==signature(data.model))return;this.setYardAnalysis(data.result);this.yardOverlay.visible=false;}}catch{}}
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
  private input:SurfaceInput;
  private focusGoal?:THREE.Vector3;private cameraMotion?:{fromFov:number;toFov:number;fromZoom:number;toZoom:number;at:number;fromP:THREE.Vector3;fromT:THREE.Vector3;toP:THREE.Vector3;toT:THREE.Vector3;done:()=>void};
  private navigationMode:'rotate'|'pan'='rotate';
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera.position.set(55, 32, 55);
    this.input=new SurfaceInput(canvas,tap=>this.tap(tap),tap=>this.focusAtScreen(tap.x,tap.y),()=>{this.followId=undefined;this.focusGoal=undefined;this.cameraMotion=undefined;});
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.rotateSpeed=.65;this.controls.panSpeed=.85;this.controls.zoomSpeed=.8;this.controls.screenSpacePanning=false;this.controls.zoomToCursor=true;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;canvas.tabIndex=0;this.controls.listenToKeyEvents(canvas);
    this.controls.addEventListener('start',()=>this.input.navigationStarted());
    this.controls.addEventListener('change',()=>this.cameraStats());
    this.controls.target.set(0, 1, 0);
    this.controls.minDistance = 2; this.controls.maxDistance = 230;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.sun.position.set(40, 80, 30);
    this.sun.target.position.set(0, 0, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(graphicsProfile()==='ultra'?2048:1024,graphicsProfile()==='ultra'?2048:1024);
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
    this.environment.add(this.precipitation.root);this.scene.add(this.energyNetwork.root);
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.getElementById('model-status')!.textContent = '3D avbröts. Ladda om sidan; sparad konfiguration finns kvar.'; });
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas);
    this.resize();
  }
  private tap(tap:Tap){
    if(this.dragging||this.transform.axis||this.diagnostic)return;
    if(tap.marker){this.onSelect(tap.marker);return;}
    this.rayAt(tap.x,tap.y);
    if(this.editing&&this.placement){const hit=this.raycaster.intersectObject(this.models.root,true)[0];if(hit){const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld)??new THREE.Vector3(0,1,0);this.onPlace(hit.point.toArray() as Vec3,normal.toArray() as Vec3);}return;}
    const hit=this.raycaster.intersectObjects([this.objects,this.occlusionVolumes],true)[0];
    if(hit){if(!this.editing&&(this.config?.appearance?.occlusion??true)&&isOccluded(this.camera,hit.point,[this.models.root,this.occlusionVolumes],this.markerRay))return;let obj:THREE.Object3D|null=hit.object;while(obj&&!obj.userData.id)obj=obj.parent;if(obj)this.onSelect(obj.userData.id);}
  }
  hoverAtScreen(x:number,y:number){if(this.editing||this.diagnostic)return undefined;this.rayAt(x,y);const hit=this.raycaster.intersectObjects([this.objects],true)[0];if(!hit)return undefined;if(isOccluded(this.camera,hit.point,[this.models.root,this.occlusionVolumes],this.markerRay))return undefined;let object:THREE.Object3D|null=hit.object;while(object&&!object.userData.id)object=object.parent;return object?.userData.id as string|undefined;}
  private rayAt(x:number,y:number){const rect=this.renderer.domElement.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),this.camera);}
  forwardMarkerPointer(event:PointerEvent,id:string){this.input.forward(event,id);}
  activateMarker(id:string){if(!this.input.gate.count)this.onSelect(id);}
  setNavigationMode(mode:'rotate'|'pan'){this.navigationMode=mode;this.controls.touches.ONE=mode==='rotate'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;this.cameraStats();}
  private focusAtScreen(x:number,y:number){
    if(this.editing||this.diagnostic)return;this.rayAt(x,y);
    // Double taps over objects never become device actions or ground focusing.
    if(this.raycaster.intersectObject(this.objects,true)[0])return;
    const hit=this.raycaster.intersectObject(this.models.root,true)[0];if(!hit)return;
    const normal=hit.face?.normal.clone().transformDirection(hit.object.matrixWorld);if(!normal||normal.y<.3)return;
    this.skyView=false;this.followId=undefined;this.controls.enabled=true;this.controls.enableDamping=true;this.controls.maxPolarAngle=Math.PI*.49;this.focusGoal=hit.point.clone();this.focusGoal.y=cameraFloor(hit.point.x,hit.point.z,this.config?.objects??[],this.yard,this.fallbackGround);this.surroundings.constrainFocus(this.focusGoal);
  }
  private constrainCamera(){if(this.skyView)return;const model=this.models.root.children[0];if(model!==this.yardModel){this.yardModel=model;this.zoneIndex=undefined;this.yard=undefined;if(model){const box=new THREE.Box3().setFromObject(model);this.fallbackGround=box.isEmpty()?0:box.max.y+.6;void this.loadYardAnalysis();}}const before=this.controls.target.clone();this.surroundings.constrainFocus(this.controls.target);this.camera.position.add(this.controls.target.clone().sub(before));constrainGroundCamera(this.camera.position,this.controls.target,(x,z)=>cameraFloor(x,z,this.activeZones(x,z),this.yard,this.fallbackGround));this.camera.lookAt(this.controls.target);}
  private cameraStats(){const canvas=this.renderer.domElement;canvas.dataset.cameraPosition=JSON.stringify(this.camera.position.toArray());canvas.dataset.cameraTarget=JSON.stringify(this.controls.target.toArray());canvas.dataset.cameraDistance=String(this.camera.position.distanceTo(this.controls.target));canvas.dataset.navigationMode=this.navigationMode;canvas.dataset.following=this.followId??'';}
  private resize() { const { width, height } = this.renderer.domElement.getBoundingClientRect(); if(width<=0||height<=0)return; if(this.config?.quality==='auto'){this.models.detail=width>=900;this.renderer.setPixelRatio(Math.min(devicePixelRatio,profiles[graphicsProfile()].dpr));} this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
  setConfig(config: SceneConfig) {
    this.zoneIndex=undefined;
    const model=config.models[config.activeModel],signature=JSON.stringify([model.url,model.position,model.rotation,model.scale]);if(signature!==this.yardSignature){this.yardSignature=signature;this.yard=undefined;this.yardModel=undefined;this.yardRequest++;}this.config = config;this.renderer.toneMapping=config.appearance?.toneMapping==='agx'?THREE.AgXToneMapping:config.appearance?.toneMapping==='neutral'?THREE.NeutralToneMapping:THREE.ACESFilmicToneMapping;
    this.models.grading=config.appearance;
    this.moon.castShadow=config.quality==='high';
    const high=graphicsProfile()==='ultra'||config.quality==='high'||config.quality==='auto'&&innerWidth>=900;
    this.models.detail=high;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,profiles[graphicsProfile()].dpr));
    this.renderer.shadowMap.enabled = config.quality==='high';
    this.models.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.rebuildObjects(); this.resize();
  }
  private rebuildObjects() {
    this.assets.reset();this.headlights.clear();this.transform.detach();
    disposeTree(this.objects); this.objects.clear();disposeTree(this.occlusionVolumes);this.occlusionVolumes.clear(); this.renderObjects.clear(); this.lamps.clear();
    for (const item of this.config?.objects ?? []) {
      if(item.placementConfirmed===false)continue;
      const group = new THREE.Group(); group.userData.id = item.id;group.userData.type=item.type;
      group.position.fromArray(item.position); group.rotation.set(...item.rotation.map(radians) as Vec3); group.scale.fromArray(item.scale);
      const material = new THREE.MeshStandardMaterial({ color: item.color, roughness: item.roughness, metalness: item.metalness, side: THREE.DoubleSide });
      let mesh: THREE.Mesh;
      if(item.asset){group.userData.assetStatus='Laddar egen modell';void this.assets.attach(group,item.asset);}
      if(item.type==='building'){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({visible:false}));mesh.position.y=.5;group.add(mesh);this.objects.add(group);this.renderObjects.set(item.id,group);material.dispose();continue;}
      if(item.type==='occluder'){mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#b6d5eb',wireframe:true,transparent:true,opacity:.25}));mesh.position.y=.5;group.add(mesh);this.occlusionVolumes.add(group);this.renderObjects.set(item.id,group);material.dispose();continue;}
      if(item.type==='car'){if(item.representation==='standalone')group.add(carVisual(item.color));else{group.userData.embedded=true;const proxy=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.5,4.2),new THREE.MeshBasicMaterial({visible:false}));proxy.position.y=.75;proxy.userData.pickOnly=true;group.add(proxy);}this.objects.add(group);this.renderObjects.set(item.id,group);material.dispose();continue;}
      if(item.type==='mower'){group.add(mowerVisual());group.userData.assetStatus=item.asset?'Laddar egen modell':'Generisk testrobot · inte en LUBA-skanning';this.objects.add(group);this.renderObjects.set(item.id,group);material.dispose();continue;}
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
    if(now-this.lastFrame<1000/profiles[graphicsProfile()].fps)return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.1); this.renderer.domElement.dataset.frameMs=String(now-this.lastFrame);this.lastFrame = now;
    this.visualStates=states;this.energyNetwork.update(this.config?.energyRoutes??[],states,connected,dt);
    if(this.diagnostic){this.energyNetwork.root.visible=false;this.models.root.visible=true;this.renderer.toneMapping=THREE.NoToneMapping;this.renderer.toneMappingExposure=1;this.scene.fog=null;this.scene.background=new THREE.Color('#777777');this.sky.root.visible=this.environment.visible=this.objects.visible=this.surroundings.root.visible=this.occlusionVolumes.visible=this.surfaceMarkers.visible=false;this.transform.detach();this.routeOverlay.visible=this.yardOverlay.visible=false;this.controls.update();this.constrainCamera();this.cameraStats();this.renderer.render(this.scene,this.camera);return;}
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
    if(this.skyView)this.surroundings.root.visible=false;this.precipitation.update(target,this.camera,dt,['tv','mobile'].includes(graphicsProfile())?'low':this.config?.quality??'low',(x,z)=>this.groundAt(x,z));
    this.models.setWetness(target.rain);
    this.renderer.shadowMap.enabled=graphicsProfile()==='ultra'||this.config?.quality==='high'||this.config?.quality==='auto'&&target.daylight<.15;
    if(['tv','mobile'].includes(graphicsProfile()))this.renderer.shadowMap.enabled=false;
    let activeLights=0;
    for (const item of this.config?.objects ?? []) {
      if(item.type==='car'){const model=this.renderObjects.get(item.id);if(model){const visible=carVisible(item,states,model.userData.presenceVisible);model.userData.presenceVisible=visible;model.visible=this.editing||visible;}}
      const rendered=this.renderObjects.get(item.id);if(rendered?.userData.editorOnly)rendered.visible=this.editing;
      if(item.type==='solar'){
        const model=this.renderObjects.get(item.id),mesh=model?.children.find(c=>c instanceof THREE.InstancedMesh)as THREE.InstancedMesh|undefined,count=Math.round(clamp(Number(states.get(item.entityId)?.attributes.panel_count??1),0,200));
        if(mesh&&model&&model.userData.panelCount!==count){const layout=panelLayout(count),matrix=new THREE.Matrix4();for(let i=0;i<layout.length;i++){const panel=layout[i];matrix.makeScale(panel.width,1,panel.depth);matrix.setPosition(panel.x,.1,panel.z);mesh.setMatrixAt(i,matrix);}mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();model.userData.panelCount=count;}
      }
      if(item.type==='mower'){
        if(performance.now()>this.learningRefresh){this.learningRefresh=performance.now()+60000;void fetch('/workspace-api/learning').then(r=>r.ok?r.json():null).then(d=>{if(d)this.learnedGraph=d.graph;}).catch(()=>{});}
        let tracker=this.trackers.get(item.id);if(!tracker){tracker=new MowerTrackingService();this.trackers.set(item.id,tracker);}
        const state=states.get(item.entityId),positionState=states.get(item.bindings?.position??item.entityId),a=positionState?.attributes;
        if(connected&&a){
          let x=typeof a.local_x==='number'?a.local_x:NaN,z=typeof a.local_z==='number'?a.local_z:NaN;
          if(!Number.isFinite(x)&&typeof a.latitude==='number'&&typeof a.longitude==='number'&&this.config){const local=geographicToLocal({latitude:a.latitude,longitude:a.longitude,altitude:Number(a.altitude??this.config.geography?.altitude??0)},{...this.config.location,altitude:this.config.geography?.altitude??0},this.config.location.northOffset);x=local[0];z=local[2];}
          x+=item.trackingOffset?.[0]??0;z+=item.trackingOffset?.[2]??0;
          const sampled=typeof a.position_sampled_at==='string'?a.position_sampled_at:positionState?.last_updated;
          if(Number.isFinite(x)&&Number.isFinite(z)&&sampled)tracker.accept({x,z,t:Date.parse(sampled),timeBasis:typeof a.position_sampled_at==='string'?'sample':'entity',accuracy:typeof(a.accuracy_m??a.gps_accuracy)==='number'?Number(a.accuracy_m??a.gps_accuracy):undefined,speed:typeof a.speed_mps==='number'?a.speed_mps:undefined,heading:typeof a.heading_deg==='number'?a.heading_deg:undefined},telemetryTime(state));
        }
        tracker.graph=this.learnedGraph;const info=tracker.update(telemetryTime(state),state?.state??'unknown',connected,dt,(from,to)=>this.safeMowerSegment(from,to,Math.hypot(item.footprint?.width??.65,item.footprint?.length??.9)/2));this.tracking.set(item.id,info);
        const model=this.renderObjects.get(item.id);if(info&&model&&!this.editing){model.position.x=info.x;model.position.z=info.z;const ground=this.groundAt(info.x,info.z);model.visible=ground!==null&&info.safePosition;if(ground!==null)model.position.y=ground+(item.trackingOffset?.[1]??0);const surface=groundSurface(info.x,info.z,this.activeZones(info.x,info.z)),up=new THREE.Vector3(...(surface?.normal??[0,1,0]));const heading=info.heading??0,forward=new THREE.Vector3(Math.sin(heading),0,-Math.cos(heading));forward.addScaledVector(up,-forward.dot(up)).normalize();const right=new THREE.Vector3().crossVectors(forward,up).normalize(),back=forward.clone().negate();const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,up,back));model.quaternion.slerp(rotation,1-Math.exp(-dt*4));}
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
      const rgb=state?.attributes.rgb_color;if(!simulation&&(!state?.attributes.color_mode||['rgb','rgbw','rgbww','hs','xy'].includes(String(state.attributes.color_mode)))&&Array.isArray(rgb)&&rgb.length===3&&rgb.every(v=>Number.isFinite(v)))lamp.color.setRGB(Number(rgb[0])/255,Number(rgb[1])/255,Number(rgb[2])/255,THREE.SRGBColorSpace);
      const bulb = this.renderObjects.get(item.id)?.children.find(c => c instanceof THREE.Mesh && c.geometry instanceof THREE.SphereGeometry) as THREE.Mesh | undefined;
      if (bulb) { const m = bulb.material as THREE.MeshStandardMaterial; m.emissive.copy(lamp.color); m.emissiveIntensity = on ? 2 : 0; }
    }
    if(this.followId){const followed=this.renderObjects.get(this.followId);if(followed){const offset=followed.position.clone().sub(this.controls.target).multiplyScalar(1-Math.exp(-dt*2));this.controls.target.add(offset);this.camera.position.add(offset);}}
    if(this.focusGoal){const delta=this.focusGoal.clone().sub(this.controls.target);if(delta.length()<.015){this.focusGoal=undefined;}else{delta.multiplyScalar(1-Math.exp(-dt*10));this.controls.target.add(delta);this.camera.position.add(delta);}}
    if(this.cameraMotion){const m=this.cameraMotion,t=Math.min(1,(performance.now()-m.at)/1400),f=t*t*(3-2*t);this.camera.fov=THREE.MathUtils.lerp(m.fromFov,m.toFov,f);this.camera.zoom=THREE.MathUtils.lerp(m.fromZoom,m.toZoom,f);this.camera.updateProjectionMatrix();this.camera.position.lerpVectors(m.fromP,m.toP,f);this.controls.target.lerpVectors(m.fromT,m.toT,f);if(t===1){this.cameraMotion=undefined;m.done();}}this.updateReplay();this.controls.update();this.constrainCamera();this.cameraStats();
    this.renderer.render(this.scene, this.camera);
  }
  setDiagnostics(profile:'mobile'|'detail'|'reference',neutral:boolean){this.diagnostic=neutral;this.models.reference=profile==='reference';this.models.detail=profile!=='mobile';this.models.setNeutral(neutral);this.transform.enabled=this.editing&&!neutral;this.transform.getHelper().visible=this.editing&&!neutral;if(!neutral&&this.config)this.renderer.toneMapping=this.config.appearance?.toneMapping==='agx'?THREE.AgXToneMapping:this.config.appearance?.toneMapping==='neutral'?THREE.NeutralToneMapping:THREE.ACESFilmicToneMapping;const season=this.models.active??this.config?.activeModel;if(season&&this.config)void this.models.select(season,this.config.models[season]);}
  diagnostics(){return{profile:graphicsProfile(),targetFps:profiles[graphicsProfile()].fps,frameIntervalMs:Number(this.renderer.domElement.dataset.frameMs),jsHeapBytes:(performance as unknown as {memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize??null,modelTextures:this.models.diagnostics(),maxTextureSize:this.renderer.capabilities.maxTextureSize,sky:this.sky.status(),triangles:this.renderer.info.render.triangles,calls:this.renderer.info.render.calls,textures:this.renderer.info.memory.textures,geometries:this.renderer.info.memory.geometries,pixelRatio:this.renderer.getPixelRatio(),resolution:[this.renderer.domElement.width,this.renderer.domElement.height],anisotropy:this.renderer.capabilities.getMaxAnisotropy()};}
  private updateHeadlight(item:SceneObject,states:Map<string,HassState>,target:EnvironmentFrame,dt:number,connected:boolean){const config=item.headlight,model=this.renderObjects.get(item.id);if(!config?.enabled||!model||this.editing)return;let lamp=this.headlights.get(item.id);if(!lamp){lamp=new THREE.SpotLight('#fff1db',0,9,radians(config.angle/2),.65,2);lamp.target.position.set(0,-.35,-4);lamp.target.userData.lightTarget=true;model.add(lamp,lamp.target);this.headlights.set(item.id,lamp);}lamp.castShadow=this.config?.quality==='high';lamp.shadow.mapSize.set(256,256);lamp.shadow.normalBias=.02;lamp.position.fromArray(config.position);lamp.color.setRGB(...kelvinRGB(config.kelvin));const status=robotLightState(item,states,this.config!,target,connected),on=status.on;lamp.power=damp(lamp.power,on?config.lumens:0,dt,.3);lamp.visible=lamp.power>.5;model.userData.headlightStatus=`${on?'På':'Av'} · ${status.source} · okalibrerad ljusprofil`;}
  assetInfo(id:string){return this.renderObjects.get(id)?.userData.assetStatus??'Testgeometri · egen 3D-modell saknas';}
  headlightInfo(id:string){return this.renderObjects.get(id)?.userData.headlightStatus??'Ej konfigurerat';}
  previewSky(){this.lookAtSky();this.controls.enabled=true;this.controls.enableZoom=false;this.controls.enablePan=false;}
  trackingInfo(id:string){return this.tracking.get(id);}
  lookAtSky(){this.focusGoal=undefined;const env=this.latestEnvironment;if(!env)return;this.skyView=true;this.followId=undefined;this.controls.maxPolarAngle=Math.PI;this.controls.enableDamping=false;this.controls.enabled=false;const direction=env.daylight>.5?new THREE.Vector3(...env.sunDirection):(env.moonAltitude??-1)>0?new THREE.Vector3(...(env.moonDirection??[0,1,0])):new THREE.Vector3(0,.5,-1).normalize();this.controls.target.copy(this.camera.position).addScaledVector(direction,120);this.controls.update();}
  visualStamp(){return this.config&&this.latestEnvironment?visualSignature(this.config,this.latestEnvironment,this.visualStates):'';}
  async ready(){const until=performance.now()+45000;while(this.models.loading||this.assets.loading||!this.models.root.children.length){if(performance.now()>until)throw new Error('3D-modellen är inte redo. Försök igen när laddningen är klar.');await new Promise(r=>setTimeout(r,100));}}
  async captureStartImage(progress:(message:string)=>void=()=>{}){
    progress('Förbereder scenens tillgångar…');
    await this.ready();if(this.config?.objects.some(o=>o.asset&&this.renderObjects.get(o.id)?.userData.assetStatus!=='loaded'))throw new Error('En importerad enhetsmodell saknas. Kontrollera importen före fotografering.');if(this.diagnostic)throw new Error('Återgå till normal rendering före fotografering');
    this.renderer.setAnimationLoop(null);
    try{
    progress('Renderar högupplöst startbild…');await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    const view=this.captureView();
    const width=Math.floor(Math.min(3200,this.renderer.capabilities.maxTextureSize,4096*this.camera.aspect)),height=Math.round(width/this.camera.aspect);
    if(height>4096||height<240)throw new Error('Välj ett bredare bildutsnitt');
    const rt=new THREE.WebGLRenderTarget(width,height,{samples:0});rt.texture.colorSpace=THREE.SRGBColorSpace;
    const hidden:THREE.Object3D[]=[this.transform.getHelper(),this.surfaceMarkers,this.yardOverlay,this.routeOverlay,this.energyNetwork.root,this.occlusionVolumes];this.objects.traverse(o=>{if(o.userData.editorOnly)hidden.push(o);});const visibility=hidden.map(o=>o.visible);hidden.forEach(o=>o.visible=false);
    const signature=this.config&&this.latestEnvironment?visualSignature({...this.config,startView:view},this.latestEnvironment,this.visualStates):'';
    const previous=this.renderer.getRenderTarget(),pixels=new Uint8Array(width*height*4);
    try{this.renderer.setRenderTarget(rt);this.renderer.render(this.scene,this.camera);this.renderer.readRenderTargetPixels(rt,0,0,width,height,pixels);}finally{this.renderer.setRenderTarget(previous);rt.dispose();hidden.forEach((o,i)=>o.visible=visibility[i]);}
    progress('Komprimerar PNG…');
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d')!,image=context.createImageData(width,height);
    for(let y=0;y<height;y++)image.data.set(pixels.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);context.putImageData(image,0,0);
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Bilden kunde inte skapas')),'image/png'));
    return{blob,view,width,height,signature};
    }finally{this.renderer.setAnimationLoop(this.animation);}
  }
  screenBounds(id:string){const group=this.renderObjects.get(id);if(!group?.visible)return null;const screen=this.screenPosition(id);if(!screen||screen.occluded||screen.z>1||screen.z< -1)return null;const box=new THREE.Box3().setFromObject(group);if(box.isEmpty())return null;const points=[];for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(this.camera);if(p.z< -1||p.z>1)return null;points.push(p);}const xs=points.map(p=>(p.x*.5+.5)*innerWidth),ys=points.map(p=>(-.5*p.y+.5)*innerHeight);return{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
  captureView():import('./types').CameraView{return{position:this.camera.position.toArray() as Vec3,target:this.controls.target.toArray() as Vec3,zoom:this.camera.zoom,fov:this.camera.fov};}
  transition(view:import('./types').CameraView,done=()=>{}){this.skyView=false;this.followId=undefined;this.focusGoal=undefined;this.controls.maxPolarAngle=Math.PI*.49;this.cameraMotion={fromFov:this.camera.fov,toFov:view.fov,fromZoom:this.camera.zoom,toZoom:view.zoom,at:performance.now(),fromP:this.camera.position.clone(),fromT:this.controls.target.clone(),toP:new THREE.Vector3(...view.position),toT:new THREE.Vector3(...view.target),done};}
  /** A single restrained arrival, never an endless orbit or a replacement for the saved view. */
  revealOverview(){
    const view=this.config?.startView??{position:[55,32,55] as Vec3,target:[0,1,0] as Vec3,zoom:1,fov:42};
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const target=new THREE.Vector3(...view.target),position=new THREE.Vector3(...view.position);
      this.camera.position.copy(position.sub(target).multiplyScalar(1.12).add(target));
      this.controls.target.copy(target);this.constrainCamera();
    }
    this.transition(view);
  }
  overview(done=()=>{}){this.transition(this.config?.startView??{position:[55,32,55],target:[0,1,0],zoom:1,fov:48},done);}
  cancelFollow(){this.followId=undefined;this.cameraMotion=undefined;}
  focusObject(id:string,follow=false,done=()=>{}){const o=this.config?.objects.find(o=>o.id===id),model=this.renderObjects.get(id);if(!model||!o)throw new Error('Objektet saknas');if(o.type==='mower'&&!this.tracking.get(id)?.safePosition)throw new Error('Ingen verifierad robotposition att följa');const target=o.type==='building'?new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()):model.position.clone(),offset=o.type==='mower'?new THREE.Vector3(3,2.4,4):o.type==='car'?new THREE.Vector3(6,3.7,7):new THREE.Vector3(10,8,12),position=target.clone().add(offset);if(o.type==='building'){const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).length();offset.normalize().multiplyScalar(Math.max(18,size*1.1));position.copy(target).add(offset);}const ray=new THREE.Raycaster(target,offset.clone().normalize(),.5,offset.length());const hit=ray.intersectObject(this.models.root,true)[0];if(hit&&o.type!=='building')position.copy(target).addScaledVector(offset.normalize(),Math.max(2,hit.distance-1));this.select(id);this.transition({position:position.toArray() as Vec3,target:target.toArray() as Vec3,zoom:1,fov:48},()=>{if(follow)this.followId=id;done();});}
  follow(id:string){try{this.focusObject(id,true);return true;}catch{return false;}}

  screenPosition(id:string){const object=this.renderObjects.get(id);if(!object||!object.visible||this.diagnostic||this.skyView)return null;const physical=object.getWorldPosition(new THREE.Vector3());if(object.userData.type==='building'){const box=new THREE.Box3().setFromObject(object);box.getCenter(physical);physical.y=box.max.y+.15;}physical.y+=object.userData.type==='car'?.75:object.userData.type==='mower'?.15:0;const point=physical.clone();point.y+=1.2;const distance=this.camera.position.distanceTo(point),occluded=(this.config?.appearance?.occlusion??true)&&isOccluded(this.camera,physical,[this.models.root,this.occlusionVolumes],this.markerRay);const p=point.project(this.camera);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight,z:p.z,occluded,distance};}
  private activeZones(x?:number,z?:number){this.zoneIndex??=new ZoneIndex((this.config?.objects??[]).filter(o=>!o.classification||o.classification.origin==='manual'||o.classification.analysisKey===this.yard?.key));return x===undefined||z===undefined?this.zoneIndex.all:this.zoneIndex.region(x,z);}
  private safeMowerSegment(from:{x:number;z:number},to:{x:number;z:number},radius:number){this.activeZones();const zones=this.zoneIndex!.region(Math.min(from.x,to.x)-radius,Math.min(from.z,to.z)-radius,Math.max(from.x,to.x)+radius,Math.max(from.z,to.z)+radius);if(!supportedGroundSegment(from,to,zones))return false;return traversableSegment(from,to,zones,radius);}
  private groundAt(x:number,z:number){return groundSurface(x,z,this.activeZones(x,z))?.height??null;}
  dispose(){this.energyNetwork.dispose();this.input.dispose();this.assets.reset();this.setAnimationLoop(null);this.observer.disconnect();this.controls.dispose();this.transform.dispose();this.models.dispose();this.sky.dispose();disposeTree(this.sky.root);disposeTree(this.surroundings.root);disposeTree(this.occlusionVolumes);disposeTree(this.objects);disposeTree(this.environment);disposeTree(this.surfaceMarkers);disposeTree(this.yardOverlay);disposeTree(this.routeOverlay);this.renderer.dispose();}
  reset() { this.cameraMotion=undefined;this.focusGoal=undefined;this.skyView=false;this.followId=undefined;this.controls.enabled=true;this.controls.enableDamping=true;this.controls.maxPolarAngle=Math.PI*.49;this.controls.enableZoom=this.controls.enablePan=true;this.camera.position.set(55, 32, 55); this.controls.target.set(0, 1, 0);this.cameraStats(); }
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
