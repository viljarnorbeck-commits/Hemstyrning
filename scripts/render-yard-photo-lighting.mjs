/** Offline light-only projection. Never edits photographs, GLB files, or HA state.
 * Run: node --import tsx scripts/render-yard-photo-lighting.mjs
 */
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{createHash}from'node:crypto';
import * as T from'three';
import sharp from'sharp';
import{computeBoundsTree,acceleratedRaycast}from'three-mesh-bvh';
import{documentFrom}from'./model-exchange-lib.mjs';
import{yardPhoto}from'../In/hemkontroll_3d_komplett/src/system/yard-photo-config.ts';
const directory='In/hemkontroll_3d_komplett/public/images/yard/lighting';
const profile=JSON.parse(await readFile('In/hemkontroll_3d_komplett/src/system/calibration/kyrkas-night-2026-11-03.json','utf8'));
const config=JSON.parse(await readFile('data/scene.json','utf8'));
const modelPath='data/models/'+config.models[config.activeModel].url.split('/').at(-1),bytes=await readFile(modelPath),hash=createHash('sha256').update(bytes).digest('hex');
if(config.modelExchange.active.sourceFrameId!==profile.sourceFrameId)throw Error('Source frame mismatch');
if(config.modelExchange.active.importedSha256!==hash)throw Error('Active model hash mismatch');
const{doc}=await documentFrom(bytes),meshes=[];
for(const node of doc.getRoot().listNodes())for(const primitive of node.getMesh()?.listPrimitives()??[]){
 const geometry=new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(primitive.getAttribute('POSITION').getArray(),3));
 if(primitive.getIndices())geometry.setIndex(new T.BufferAttribute(primitive.getIndices().getArray(),1));
 computeBoundsTree.call(geometry);const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));mesh.name=node.getName();mesh.raycast=acceleratedRaycast;mesh.applyMatrix4(new T.Matrix4().fromArray(node.getWorldMatrix()));mesh.updateMatrixWorld();meshes.push(mesh);
}
const width=960,height=540,camera=new T.PerspectiveCamera(yardPhoto.sourceView.fov,width/height,.1,1000);
camera.position.fromArray(yardPhoto.sourceView.position);camera.lookAt(new T.Vector3(...yardPhoto.sourceView.target));camera.updateMatrixWorld();
const ray=new T.Raycaster();ray.firstHitOnly=true;
const surfaces=new Array(width*height),seen=new Set();
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 ray.setFromCamera(new T.Vector2((x+.5)/width*2-1,1-(y+.5)/height*2),camera);
 const hit=ray.intersectObjects(meshes,false)[0];if(!hit)continue;
 const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);if(normal.dot(ray.ray.direction)>0)normal.negate();
 surfaces[y*width+x]={point:hit.point,normal,name:hit.object.name};seen.add(hit.object.name);
}
await mkdir(directory,{recursive:true});const outputs=[];
const shadow=new T.Raycaster();shadow.firstHitOnly=true;
for(const fixture of profile.fixtures.filter(f=>f.enabled&&f.kind==='spot')){
 const light=new T.Vector3(...fixture.position),data=Buffer.alloc(width*height*4),color=fixture.color.slice(1).match(/../g).map(n=>parseInt(n,16));let illuminated=0;
 // A wider sampled emitter prevents four hard visibility levels on reconstructed surfaces.
 const sourceOffsets=[[0,0,0],[.11,0,0],[-.11,0,0],[0,.09,0],[0,-.09,0],[0,0,.11],[0,0,-.11],[.075,.06,.075],[-.075,-.06,-.075]];
 // Constant RGB beneath alpha avoids dirty fringes when filtering transparent light.
 for(let j=0;j<data.length;j+=4){data[j]=color[0];data[j+1]=color[1];data[j+2]=color[2];}
 for(let i=0;i<surfaces.length;i++){
  const surface=surfaces[i];if(!surface)continue;const delta=light.clone().sub(surface.point),distance=delta.length();if(distance>fixture.range||distance<.03)continue;
  delta.normalize();const incidence=Math.max(0,surface.normal.dot(delta));if(incidence<.015)continue;
  const origin=surface.point.clone().addScaledVector(surface.normal,.06);let visible=0;
  for(const offset of sourceOffsets){const target=light.clone().add(new T.Vector3(...offset)),direction=target.sub(origin),length=direction.length();shadow.set(origin,direction.normalize());shadow.near=.02;shadow.far=length-.10;if(!shadow.intersectObjects(meshes,false).length)visible++;}
  if(!visible)continue;
  // Bounded exposure with Lambert falloff. A little local diffuse fill keeps white siding readable.
  // Wall lantern caps/soffits suppress upward spill: the night photos show light below the eaves.
  const rise=surface.point.y-light.y,upward=surface.normal.y<-.15?1:1-T.MathUtils.smoothstep(rise,.12,.48);
  const irradiance=(.9*incidence+.11)*3.2/(distance*distance+.65)*(1-distance/fixture.range)**2*(visible/sourceOffsets.length)*upward;
  const ground=surface.normal.y>.65,reflection=/fonster|window|roof|tak/i.test(surface.name)?.55:ground?.72:1;
  const alpha=Math.min(.64,(1-Math.exp(-irradiance*1.6))*reflection);if(alpha<.006)continue;
  const j=i*4;data[j]=color[0];data[j+1]=color[1];data[j+2]=color[2];data[j+3]=Math.round(alpha*255);illuminated++;
 }
 // Filter only nearby samples of the same modeled surface. Keep architectural boundaries
 // and broad occlusion shadows, but remove isolated ray/self-shadow speckles.
 const rawAlpha=Uint8Array.from({length:surfaces.length},(_,i)=>data[i*4+3]),median=new Uint8Array(rawAlpha);
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=y*width+x,s=surfaces[i];if(!s)continue;const values=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=i+dy*width+dx,n=surfaces[j];if(n&&n.name===s.name&&n.normal.dot(s.normal)>.94&&n.point.distanceToSquared(s.point)<.16)values.push(rawAlpha[j]);}
  if(values.length>=5){values.sort((a,b)=>a-b);median[i]=values[Math.floor(values.length/2)];}
 }
 for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
  const i=y*width+x,s=surfaces[i];if(!s)continue;let sum=0,weight=0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const j=i+dy*width+dx,n=surfaces[j];if(!n||n.name!==s.name||n.normal.dot(s.normal)<.94||n.point.distanceToSquared(s.point)>.16)continue;const w=Math.exp(-(dx*dx+dy*dy)/3);sum+=median[j]*w;weight+=w;}
  if(weight)data[i*4+3]=Math.round(sum/weight);
 }
 const file='surface-'+fixture.id+'-v1.png';await sharp(data,{raw:{width,height,channels:4}}).blur(1.05).png().toFile(directory+'/'+file);
 const assetHash=createHash('sha256').update(await readFile(directory+'/'+file)).digest('hex').slice(0,12);
 outputs.push({id:fixture.id,position:fixture.position,target:fixture.target,url:'/images/yard/lighting/'+file+'?v='+assetHash,illuminatedPixels:illuminated});
 console.log(fixture.id+': '+illuminated+' illuminated surface pixels');
}
const metadata={schemaVersion:1,sourceFrameId:profile.sourceFrameId,modelSha256:hash,sourcePhotoSha256:yardPhoto.sourceSha256,camera:yardPhoto.sourceView,width,height,method:'model-raycast-lambert-area-shadow-surface-denoise',status:'approximate-model-and-photo-alignment',surfaceMeshes:[...seen].filter(n=>/panel|verand|porch|stolp|rack|tak|roof|entre/i.test(n)),fixtures:outputs};
await writeFile('In/hemkontroll_3d_komplett/src/system/calibration/kyrkas-photo-light-surfaces.json',JSON.stringify(metadata,null,2)+'\n');
for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}
