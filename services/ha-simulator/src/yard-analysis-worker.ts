import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {Matrix4,Vector3,Euler,Box3} from 'three';
import {YardRaster} from './yard-analysis.js';
import type {Point} from '../../../shared/yard-types.js';
const send=(message:unknown)=>new Promise<void>((resolve,reject)=>{if(!process.send){resolve();return;}process.send(message,error=>error?reject(error):resolve());});
process.on('message',async(input:{path:string;key:string;model:{position:Point;rotation:Point;scale:number}})=>{
 try{
  await MeshoptDecoder.ready;const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder}).read(input.path),model=new Matrix4().makeRotationFromEuler(new Euler(...input.model.rotation.map(v=>v*Math.PI/180) as Point,'YXZ')).scale(new Vector3().setScalar(input.model.scale)).setPosition(...input.model.position),bounds=new Box3();
  const meshes:{primitive:ReturnType<typeof doc.createPrimitive>;matrix:Matrix4}[]=[];
  for(const node of doc.getRoot().listNodes()){const mesh=node.getMesh();if(!mesh)continue;const matrix=new Matrix4().fromArray(node.getWorldMatrix()).premultiply(model);for(const primitive of mesh.listPrimitives()){if(primitive.getMode()!==4)continue;const p=primitive.getAttribute('POSITION');if(!p)continue;const v=new Vector3();for(let i=0;i<p.getCount();i++){const xyz=p.getElement(i,[0,0,0]) as Point;bounds.expandByPoint(v.fromArray(xyz).applyMatrix4(matrix));}meshes.push({primitive,matrix});}}
  if(bounds.isEmpty())throw new Error('Modellen saknar giltig geometri');
  const raster=new YardRaster(bounds.min.toArray() as Point,bounds.max.toArray() as Point);
  for(const {primitive,matrix}of meshes){const p=primitive.getAttribute('POSITION')!,indices=primitive.getIndices(),count=indices?.getCount()??p.getCount(),read=(i:number)=>new Vector3().fromArray(p.getElement(indices?indices.getScalar(i):i,[0,0,0])).applyMatrix4(matrix).toArray() as Point;
   for(let i=0;i+2<count;i+=3)raster.triangle(read(i),read(i+1),read(i+2));}
  await send({result:raster.finish(input.key)});
 }catch(error){await send({error:error instanceof Error?error.message:'Analys misslyckades'});}finally{if(process.connected)process.disconnect();}
});

process.send?.({ready:true});
