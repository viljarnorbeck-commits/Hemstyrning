import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
const hash=b=>createHash('sha256').update(b).digest('hex');
const originalHash='f6cfc3c0cbe8896a09cdb8f9ee456245e666083882a816d0ed8f55aba6e3e6fe';
const png=await readFile('In/Daniels_u0_v0_diffuse.png');
assert.equal(hash(await readFile('In/Daniels.glb')),originalHash,'Original GLB changed');
assert.equal(hash(png),'1fe2d7c6db733c4399915014e2b621b1b01cb741af2fcf7e3bd88b5639e79869','Original PNG changed');
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const source=await io.read('In/Daniels.glb');
for(const suffix of ['-reference','-detail','']){
 const path=`In/hemkontroll_3d_komplett/public/models/daniels${suffix}.glb`;
 const bytes=await readFile(path),j=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
 assert.equal(j.images.length,1);assert.ok(j.images[0].bufferView!==undefined);assert.equal(j.images[0].uri,undefined);
 const doc=await io.read(path),textures=doc.getRoot().listTextures();assert.equal(textures.length,1);
 assert.equal(hash(textures[0].getImage()),hash(png),'Embedded PNG must be byte-identical');
 for(const [mi,mesh] of doc.getRoot().listMeshes().entries())for(const [pi,p] of mesh.listPrimitives().entries()){
  assert.ok(p.getAttribute('TEXCOORD_0'));assert.equal(p.getAttribute('COLOR_0'),null,'Avoid duplicate photographic color');
  assert.ok(p.getMaterial().getBaseColorTexture());assert.deepEqual(p.getMaterial().getBaseColorFactor(),[1,1,1,1]);
  if(suffix==='-reference'){
   const q=source.getRoot().listMeshes()[mi].listPrimitives()[pi];
   for(const semantic of ['POSITION','TEXCOORD_0']){
    const a=p.getAttribute(semantic).getArray(),b=q.getAttribute(semantic).getArray();
    assert.equal(hash(Buffer.from(a.buffer,a.byteOffset,a.byteLength)),hash(Buffer.from(b.buffer,b.byteOffset,b.byteLength)),`Reference ${semantic} changed`);
   }
   assert.deepEqual(p.getIndices().getArray(),q.getIndices().getArray(),'Reference topology changed');
  }
 }
 console.log(`${path}: embedded original PNG, texture-only color, UV and geometry checks passed`);
}
