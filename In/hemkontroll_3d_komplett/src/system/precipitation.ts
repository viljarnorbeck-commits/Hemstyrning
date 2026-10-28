import * as THREE from 'three';
import { damp } from './environment';
import type { EnvironmentFrame } from './types';
/** Fixed-size GPU buffers, variable draw counts. No meshes or allocations per raindrop. */
export class Precipitation {
 readonly root=new THREE.Group();private count=12000;
 private rainPositions=new Float32Array(this.count*6);private snowPositions=new Float32Array(this.count*3);private speed=new Float32Array(this.count);private sizes=new Float32Array(this.count);
 private rain:THREE.LineSegments;private snow:THREE.Points;private splashes:THREE.Points;
 private splashPositions=new Float32Array(160*3);private splashAge=new Float32Array(160);private splashCursor=0;
 private rainLevel=0;private snowLevel=0;private wind=new THREE.Vector2();private ground=new Float32Array(64*3);private groundCursor=0;private phase=0;
 constructor(){
  for(let i=0;i<this.count;i++){const x=(Math.random()-.5)*120,y=Math.random()*70,z=(Math.random()-.5)*120;this.rainPositions.set([x,y,z,x,y-1,z],i*6);this.snowPositions.set([x,y,z],i*3);this.speed[i]=.5+Math.random()*1.7;this.sizes[i]=.07+Math.random()*.22;}
  this.splashAge.fill(2);this.ground.fill(NaN);
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(this.rainPositions,3));
  this.rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:'#c3e3fa',transparent:true,opacity:.65,depthWrite:false}));
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(this.snowPositions,3));sg.setAttribute('flakeSize',new THREE.BufferAttribute(this.sizes,1));sg.setAttribute('flakeSeed',new THREE.BufferAttribute(this.speed,1));
  this.snow=new THREE.Points(sg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:.85}},vertexShader:'attribute float flakeSize;attribute float flakeSeed;varying float depthFade;varying float seed;varying float pixels;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(flakeSize*480./max(1.,-mv.z),1.,18.);depthFade=clamp(-mv.z/3.,0.,1.);seed=flakeSeed*11.;pixels=gl_PointSize;}',fragmentShader:'uniform float opacity;varying float depthFade;varying float seed;varying float pixels;void main(){vec2 q=gl_PointCoord-vec2(.5);float radius=length(q);float arms=pow(abs(cos(atan(q.y,q.x)*3.+seed)),12.);float soft=1.-smoothstep(.12,.5,radius);float crystal=max(1.-smoothstep(.05,.14,radius),arms*(1.-smoothstep(.32,.48,radius)));float a=mix(soft,crystal,smoothstep(5.,14.,pixels));gl_FragColor=vec4(.93,.97,1.,a*opacity*depthFade);}' }));
  const splashGeometry=new THREE.BufferGeometry();splashGeometry.setAttribute('position',new THREE.BufferAttribute(this.splashPositions,3));splashGeometry.setAttribute('age',new THREE.BufferAttribute(this.splashAge,1));
  this.splashes=new THREE.Points(splashGeometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexShader:'attribute float age;varying float a;void main(){a=age;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((.05+age*.25)*450./max(1.,-mv.z),1.,20.);}',fragmentShader:'varying float a;void main(){float r=length(gl_PointCoord-vec2(.5));float ring=smoothstep(.28,.36,r)*(1.-smoothstep(.4,.5,r));gl_FragColor=vec4(.7,.86,1.,ring*max(0.,1.-a*2.)*.6);}' }));
  for(const object of [this.rain,this.snow,this.splashes]){object.frustumCulled=false;this.root.add(object);}
 }
 update(target:EnvironmentFrame,camera:THREE.Camera,dt:number,quality:string,groundAt:(x:number,z:number)=>number|null){
  this.phase+=dt;this.rainLevel=damp(this.rainLevel,target.rain,dt,1.5);this.snowLevel=damp(this.snowLevel,target.snow,dt,2);
  const direction=(target.windDirection??0)*Math.PI/180,gust=(target.windSpeed??0)+Math.max(0,(target.gust??0)-(target.windSpeed??0))*(.5+.5*Math.sin(this.phase*1.7));
  this.wind.x=damp(this.wind.x,-Math.sin(direction)*gust,dt,2);this.wind.y=damp(this.wind.y,Math.cos(direction)*gust,dt,2);
  const maximum=quality==='low'?6000:this.count,rainCount=Math.round(maximum*this.rainLevel),snowCount=Math.round(maximum*Math.pow(this.snowLevel,.75));
  this.rain.geometry.setDrawRange(0,rainCount*2);this.snow.geometry.setDrawRange(0,snowCount);
  this.rain.visible=rainCount>0;this.snow.visible=snowCount>0;this.splashes.visible=rainCount>0;
  const cx=camera.position.x,cz=camera.position.z;
  // Slowly refresh a small collision sample grid. Ray count is bounded, independent of particle count.
  if(rainCount>0||snowCount>0)for(let j=0;j<2;j++){const i=this.groundCursor++%64,x=cx-55+(i%8)*15,z=cz-55+Math.floor(i/8)*15;const y=groundAt(x,z);this.ground.set([x,y??-3,z],i*3);}
  const floorAt=(x:number,z:number)=>{const column=Math.max(0,Math.min(7,Math.round((x-cx+55)/15))),row=Math.max(0,Math.min(7,Math.round((z-cz+55)/15))),sample=(row*8+column)*3;return Number.isFinite(this.ground[sample+1])&&(x-this.ground[sample])**2+(z-this.ground[sample+2])**2<400?this.ground[sample+1]:-3;};
  const illumination=.35+.65*(target.daylight??.5); (this.rain.material as THREE.LineBasicMaterial).color.setRGB(.65*illumination,.76*illumination,.82*illumination);
  for(let i=0;i<rainCount;i++){
   const p=i*6;let x=this.rainPositions[p]+this.wind.x*dt*.7,y=this.rainPositions[p+1]-(24+this.speed[i]*9)*dt,z=this.rainPositions[p+2]+this.wind.y*dt*.7;
   const groundY=floorAt(x,z);
   if(y<groundY){if(i%18===0&&groundY> -3){const index=this.splashCursor++%160;this.splashPositions.set([x,groundY+.05,z],index*3);this.splashAge[index]=0;}y=70;}
   if(x<cx-60)x+=120;if(x>cx+60)x-=120;if(z<cz-60)z+=120;if(z>cz+60)z-=120;
   this.rainPositions[p]=x;this.rainPositions[p+1]=y;this.rainPositions[p+2]=z;this.rainPositions[p+3]=x-this.wind.x*.025;this.rainPositions[p+4]=y-1.2-this.speed[i]*.3;this.rainPositions[p+5]=z-this.wind.y*.025;
  }
  for(let i=0;i<snowCount;i++){const p=i*3;let x=this.snowPositions[p]+(this.wind.x*.55+Math.sin(this.phase+i)*.5)*dt,y=this.snowPositions[p+1]-this.speed[i]*dt*(1+gust*.04),z=this.snowPositions[p+2]+(this.wind.y*.55+Math.cos(this.phase*.8+i)*.4)*dt;if(y<floorAt(x,z)+.04)y=70;if(x<cx-60)x+=120;if(x>cx+60)x-=120;if(z<cz-60)z+=120;if(z>cz+60)z-=120;this.snowPositions[p]=x;this.snowPositions[p+1]=y;this.snowPositions[p+2]=z;}
  for(let i=0;i<160;i++)this.splashAge[i]=Math.min(2,this.splashAge[i]+dt);
  this.rain.geometry.attributes.position.needsUpdate=true;this.snow.geometry.attributes.position.needsUpdate=true;this.splashes.geometry.attributes.position.needsUpdate=true;this.splashes.geometry.attributes.age.needsUpdate=true;
 }
}
