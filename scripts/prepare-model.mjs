import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { NodeIO } from '@gltf-transform/core';
import { weld, simplify, prune, meshopt, cloneDocument } from '@gltf-transform/functions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

const source = resolve(process.argv[2] ?? 'In/Daniels.glb');
const output = resolve(process.argv[3] ?? 'In/hemkontroll_3d_komplett/public/models/daniels.glb');
if (source === output) throw new Error('Source and output must differ; keep the original scan.');
const raw = await readFile(source);
const jsonSize = raw.readUInt32LE(12), json = JSON.parse(raw.toString('utf8',20,20+jsonSize));
const missingTextures = [];
for (const image of json.images ?? []) if (image.uri && !image.uri.startsWith('data:')) {
  try { await access(resolve(dirname(source),image.uri)); } catch { missingTextures.push(image.uri); }
}
await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder': (await import('meshoptimizer')).MeshoptDecoder});
let document;
if (missingTextures.length) {
  // Preserve input bytes. Remove unresolved texture references only in the derived preview.
  for (const material of json.materials ?? []) {
    delete material.pbrMetallicRoughness?.baseColorTexture;
    if (material.pbrMetallicRoughness) material.pbrMetallicRoughness.baseColorFactor=[1,1,1,1];
  }
  delete json.images; delete json.textures;
  let text=JSON.stringify(json); while(Buffer.byteLength(text)%4) text+=' ';
  const body=Buffer.from(text), binary=raw.subarray(20+jsonSize);
  const clean=Buffer.alloc(20+body.length+binary.length);
  raw.copy(clean,0,0,12);clean.writeUInt32LE(clean.length,8);clean.writeUInt32LE(body.length,12);clean.writeUInt32LE(0x4e4f534a,16);body.copy(clean,20);binary.copy(clean,20+body.length);
  document=await io.readBinary(clean);

} else document=await io.read(source);
const triangles = doc => doc.getRoot().listMeshes().reduce((sum,mesh)=>sum+mesh.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??0)/3,0),0);
const before=triangles(document);
const profiles=[{name:'reference',path:output.replace(/\.glb$/,'-reference.glb'),ratio:1,error:0},{name:'mobile',path:output,ratio:.12,error:.0006},{name:'detail',path:output.replace(/\.glb$/,'-detail.glb'),ratio:.35,error:.00015}];
await mkdir(dirname(output),{recursive:true});
for(const profile of profiles){
 const doc=cloneDocument(document);
 if(profile.name!=='reference') await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:profile.ratio,error:profile.error}),prune({keepAttributes:true}),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeColor:8,quantizeTexcoord:14}));
 await io.write(profile.path,doc);
 const metadata={profile:profile.name,source:source.split('/').at(-1),sha256:createHash('sha256').update(raw).digest('hex'),sourceTriangles:before,previewTriangles:triangles(doc),missingTextures,preserved:['COLOR_0','TEXCOORD_0'],notes:'Original scan retained. No texture downscaling or image recompression. Vertex colors contain captured lighting.'};
 await writeFile(profile.path.replace(/\.glb$/,'.meta.json'),JSON.stringify(metadata,null,2)+'\n');
 console.log(JSON.stringify(metadata,null,2));
}
