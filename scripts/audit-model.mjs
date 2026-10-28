import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const hash=b=>createHash('sha256').update(b).digest('hex');
const source=resolve(process.argv[2]??'In/Daniels.glb');
async function audit(path){
 const raw=await readFile(path),size=raw.readUInt32LE(12),gltf=JSON.parse(raw.toString('utf8',20,20+size));
 const textures=[];
 for(const image of gltf.images??[]){
  let bytes,missing=false;
  try{
   if(image.bufferView!==undefined){const view=gltf.bufferViews[image.bufferView],start=28+size+(view.byteOffset??0);bytes=raw.subarray(start,start+view.byteLength);}
   else if(image.uri?.startsWith('data:'))bytes=Buffer.from(image.uri.split(',')[1],'base64');
   else bytes=await readFile(resolve(dirname(path),image.uri));
  }catch{missing=true;}
  let metadata={};
  if(bytes)try{const m=await sharp(bytes).metadata();metadata={width:m.width,height:m.height,format:m.format,channels:m.channels,space:m.space,bitsPerSample:m.bitsPerSample,hasProfile:m.hasProfile,hasAlpha:m.hasAlpha};}catch{metadata={format:image.mimeType??'unknown (possibly GPU compressed)'};}
  textures.push({uri:image.uri??'embedded',embedded:image.bufferView!==undefined,available:!missing,bytes:bytes?.length,sha256:bytes?hash(bytes):undefined,...metadata});
 }
 const primitives=(gltf.meshes??[]).flatMap(m=>m.primitives);
 return{file:path,bytes:raw.length,sha256:hash(raw),triangles:primitives.reduce((s,p)=>s+(gltf.accessors[p.indices??p.attributes.POSITION]?.count??0)/3,0),primitives:primitives.length,attributes:primitives.map(p=>Object.keys(p.attributes)),textures,textureCount:(gltf.textures??[]).length,materials:gltf.materials,samplers:gltf.samplers,extensions:gltf.extensionsUsed??[],uvPresent:primitives.every(p=>p.attributes.TEXCOORD_0!==undefined)};
}
const reports=[await audit(source)];
if(process.argv.length<3)for(const suffix of ['','-detail','-reference'])reports.push(await audit(resolve(`In/hemkontroll_3d_komplett/public/models/daniels${suffix}.glb`)));
console.log(JSON.stringify({models:reports,limits:['RealityScan project/export settings and pre-export triangle/texture counts are not supplied.','One 8192px atlas is supplied; whether it was merged/downscaled before export cannot be established.','Photographed lighting/shadows remain in the source texture and cannot be removed by relighting.','8192px RGBA with mipmaps needs about 341 MiB of GPU memory; devices may impose a lower texture limit.']},null,2));
