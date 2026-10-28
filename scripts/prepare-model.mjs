import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { weld, simplify, prune, meshopt, cloneDocument } from '@gltf-transform/functions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

const source = resolve(process.argv[2] ?? 'In/Daniels.glb');
const output = resolve(process.argv[3] ?? 'In/hemkontroll_3d_komplett/public/models/daniels.glb');
const profiles = [
  {name:'reference',path:output.replace(/\.glb$/,'-reference.glb'),ratio:1,error:0},
  {name:'mobile',path:output,ratio:.12,error:.0006},
  {name:'detail',path:output.replace(/\.glb$/,'-detail.glb'),ratio:.35,error:.00015},
];
if (!output.endsWith('.glb') || profiles.some(p=>p.path===source)) throw new Error('Source and outputs must differ; keep the original scan.');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = await readFile(source);
const jsonSize = raw.readUInt32LE(12), json = JSON.parse(raw.toString('utf8',20,20+jsonSize));
for (const image of json.images ?? []) if (image.uri && !image.uri.startsWith('data:')) {
  // Fail instead of silently producing a degraded, untextured model.
  await access(resolve(dirname(source),image.uri));
}
await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const document = await io.read(source);
const textures = await Promise.all(document.getRoot().listTextures().map(async texture=>{
  const image=texture.getImage(); if(!image) throw new Error('Missing texture image');
  const m=await sharp(image).metadata();
  return {name:texture.getURI(),sha256:hash(image),bytes:image.length,width:m.width,height:m.height,format:m.format,space:m.space,bitsPerSample:m.bitsPerSample,hasProfile:m.hasProfile};
}));
let removedVertexColorPrimitives=0;
for(const mesh of document.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
  const material=primitive.getMaterial();
  if(material?.getBaseColorTexture()){
    const texcoord=material.getBaseColorTextureInfo().getTexCoord();
    if(!primitive.getAttribute(`TEXCOORD_${texcoord}`))throw new Error('Textured primitive has no matching UV coordinates');
    // RealityScan's COLOR_0 is captured photographic color, not an albedo multiplier.
    // glTF multiplies COLOR_0 * baseColorTexture; remove duplicate color in derived assets.
    if(primitive.getAttribute('COLOR_0')){primitive.setAttribute('COLOR_0',null);removedVertexColorPrimitives++;}
    material.setBaseColorFactor([1,1,1,1]);
    material.getBaseColorTextureInfo().setMinFilter(9987).setMagFilter(9729);
  }
}
// Dispose only orphaned color buffers. Reference positions, UVs, indices and nodes stay exact.
for(const accessor of document.getRoot().listAccessors())if(accessor.listParents().every(p=>p.propertyType==='Root'))accessor.dispose();
const triangles = doc => doc.getRoot().listMeshes().reduce((sum,mesh)=>sum+mesh.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION')?.getCount()??0)/3,0),0);
const before=triangles(document);
await mkdir(dirname(output),{recursive:true});
for(const profile of profiles){
 const doc=cloneDocument(document);
 if(profile.name!=='reference') await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:profile.ratio,error:profile.error}),prune({keepAttributes:true}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeTexcoord:16}));
 await io.write(profile.path,doc);
 const metadata={profile:profile.name,source:source.split('/').at(-1),sha256:hash(raw),sourceTriangles:before,previewTriangles:triangles(doc),missingTextures:[],textures,removedVertexColorPrimitives,preserved:['TEXCOORD_0','original PNG bytes'],notes:'Original files untouched. Embedded lossless source PNG at full resolution. White baseColorFactor; duplicate photographic COLOR_0 removed only from textured derived primitives. Reference geometry/UV are not simplified or quantized. LOD UV quantization: 16 bits.'};
 await writeFile(profile.path.replace(/\.glb$/,'.meta.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log(JSON.stringify(metadata,null,2));
}
if(hash(await readFile(source))!==hash(raw))throw new Error('Source changed during preparation');
