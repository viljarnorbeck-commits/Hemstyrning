import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Document,NodeIO} from '@gltf-transform/core';
import sharp from 'sharp';
import {baselineFrame,sha256,validateRelease,safeFile} from './model-exchange-lib.mjs';
async function fixture(){
 const root=await mkdtemp(path.join(tmpdir(),'hem-model-exchange-')),directory=path.join(root,'v1');await mkdir(directory);
 const doc=new Document(),buffer=doc.createBuffer(),position=doc.createAccessor().setType('VEC3').setArray(new Float32Array([0,0,0,2,0,0,0,0,2])).setBuffer(buffer),uv=doc.createAccessor().setType('VEC2').setArray(new Float32Array([0,0,1,0,0,1])).setBuffer(buffer);
 const texture=doc.createTexture().setImage(await sharp({create:{width:1,height:1,channels:4,background:'#808080'}}).png().toBuffer()).setMimeType('image/png');
 const material=doc.createMaterial().setBaseColorTexture(texture),mesh=doc.createMesh().addPrimitive(doc.createPrimitive().setAttribute('POSITION',position).setAttribute('TEXCOORD_0',uv).setMaterial(material));doc.createScene().addChild(doc.createNode().setMesh(mesh));
 const glb=Buffer.from(await new NodeIO().writeBinary(doc)),frame=await baselineFrame(glb,{url:'/models/reference.glb',label:'Reference',verified:false,position:[0,0,0],rotation:[0,0,0],scale:1});
 const calibration={schemaVersion:1,coordinateSystemId:frame.id,referenceModelSha256:frame.baseline.sha256,alignmentVerified:true,sourceToYard:{position:[0,0,0],rotation:[0,0,0],scale:1,rotationOrder:'YXZ',rotationUnit:'degrees'},anchorMatches:frame.anchors.map(p=>({id:p.id,source:p.baselineSource}))};
 async function publish(changes={}){Object.assign(calibration,changes);const files={'model.glb':glb,'calibration.json':Buffer.from(JSON.stringify(calibration)),'VERSION.txt':Buffer.from('v1'),'validation.json':Buffer.from('{"readable":true}')};for(const [name,bytes]of Object.entries(files))await writeFile(path.join(directory,name),bytes);const manifest=Buffer.from(JSON.stringify({schemaVersion:1,version:'v1',status:'published',publishedAt:'2026-11-02T12:00:00Z',complete:false,model:'model.glb',calibration:'calibration.json',files:Object.entries(files).map(([name,bytes])=>({path:name,sha256:sha256(bytes)}))}));await writeFile(path.join(directory,'manifest.json'),manifest);return manifest;}
 return {root,directory,frame,publish};
}
test('accepts an incomplete textured asset only when its frozen local anchors match',async()=>{const f=await fixture();try{const result=await validateRelease(f.directory,await f.publish(),f.frame);assert.equal(result.complete,false);assert.equal(result.version,'v1');assert.ok(result.embedded.length>0);assert.equal(result.sourceSha256,f.frame.baseline.sha256);}finally{await rm(f.root,{recursive:true,force:true});}});
test('rejects estimated alignment and wrong anchors without accepting GPS as a replacement',async()=>{const f=await fixture();try{await assert.rejects(validateRelease(f.directory,await f.publish({alignmentVerified:false}),f.frame),/inte verifierad/);await assert.rejects(validateRelease(f.directory,await f.publish({alignmentVerified:true,anchorMatches:f.frame.anchors.map(p=>({id:p.id,source:[999,0,0]}))}),f.frame),/ligger fel/);}finally{await rm(f.root,{recursive:true,force:true});}});
test('rejects changed file bytes and filesystem traversal',async()=>{const f=await fixture();try{const manifest=await f.publish();await writeFile(path.join(f.directory,'model.glb'),Buffer.from('broken'));await assert.rejects(validateRelease(f.directory,manifest,f.frame),/SHA256/);await assert.rejects(safeFile(f.directory,'../outside.glb'),/sökväg/);await assert.rejects(safeFile(f.directory,'https://example.com/model.glb'),/sökväg/);}finally{await rm(f.root,{recursive:true,force:true});}});

test('provisional display requires matching local approval and never claims physical alignment',async()=>{
 const f=await fixture();try{
  const manifest=await f.publish({alignmentVerified:false,anchorMatches:[],sourceFrame:{id:'yard380-gltf-v1'}});
  const displayPlacement={kind:'user-approved-provisional',sourceFrameId:'yard380-gltf-v1',position:[0,0,0],rotation:[0,0,0],scale:1};
  await assert.rejects(validateRelease(f.directory,manifest,f.frame),/inte verifierad/);
  await assert.rejects(validateRelease(f.directory,manifest,f.frame,{displayPlacement:{...displayPlacement,sourceFrameId:'different-frame'}}),/källramen/);
  const result=await validateRelease(f.directory,manifest,f.frame,{displayPlacement});
  assert.equal(result.placementKind,'user-approved-provisional');assert.equal(result.physicalAlignmentVerified,false);
  await writeFile(path.join(f.directory,'model.glb'),Buffer.from('broken'));
  await assert.rejects(validateRelease(f.directory,manifest,f.frame,{displayPlacement}),/SHA256/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
