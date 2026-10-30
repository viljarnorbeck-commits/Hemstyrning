import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {Document,NodeIO} from '@gltf-transform/core';

// Full arrays/indices are checked by verify-model.mjs. Sample actual triangles here
// to keep neutral pixel comparison affordable in software-rendered Chromium.
async function sampledModel(path:string){
 const raw=await readFile(path),length=raw.readUInt32LE(12),j=JSON.parse(raw.toString('utf8',20,20+length)),p=j.meshes[0].primitives[0],bin=28+length;
 const scalar=(index:number,i:number,c:number)=>{const a=j.accessors[index],v=j.bufferViews[a.bufferView],components=a.type==='VEC3'?3:a.type==='VEC2'?2:1,offset=bin+(v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??components*4)+c*4;return a.componentType===5126?raw.readFloatLE(offset):raw.readUInt32LE(offset);};
 const positions:number[]=[],uv:number[]=[],triangles=j.accessors[p.indices].count/3,step=Math.max(1,Math.floor(triangles/4000));
 for(let t=0;t<triangles;t+=step)for(let v=0;v<3;v++){const index=scalar(p.indices,t*3+v,0);for(let c=0;c<3;c++)positions.push(scalar(p.attributes.POSITION,index,c));for(let c=0;c<2;c++)uv.push(scalar(p.attributes.TEXCOORD_0,index,c));}
 const image=j.images[0],view=image.bufferView===undefined?null:j.bufferViews[image.bufferView],png=view?raw.subarray(bin+(view.byteOffset??0),bin+(view.byteOffset??0)+view.byteLength):await readFile(resolve('In',image.uri));
 const doc=new Document(),buffer=doc.createBuffer(),texture=doc.createTexture().setMimeType('image/png').setImage(png),material=doc.createMaterial().setBaseColorTexture(texture),primitive=doc.createPrimitive().setAttribute('POSITION',doc.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer)).setAttribute('TEXCOORD_0',doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)).setBuffer(buffer)).setMaterial(material);
 doc.createScene().addChild(doc.createNode().setMesh(doc.createMesh().addPrimitive(primitive)));return Buffer.from(await new NodeIO().writeBinary(doc));
}

test('original UV/PNG samples render identically to the unsimplified reference without color multiplication',async({page},testInfo)=>{
 test.setTimeout(240000);
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/__texture-check',route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#777"><p id="status">Texturverifiering</p></body></html>'}));
 await page.route('**/__source/Daniels.glb',async route=>route.fulfill({body:await sampledModel('In/Daniels.glb'),contentType:'model/gltf-binary'}));
 await page.route('**/__source/Daniels_u0_v0_diffuse.png',route=>route.fulfill({path:resolve('In/Daniels_u0_v0_diffuse.png'),contentType:'image/png'}));
 await page.route('**/models/daniels-reference.glb',async route=>route.fulfill({body:await sampledModel('In/hemkontroll_3d_komplett/public/models/daniels-reference.glb'),contentType:'model/gltf-binary'}));
 await page.goto('/__texture-check');
 const result=await page.evaluate(async(moduleRoot)=>{
  // Vite serves these official modules; this deliberately renders once, without app effects.
  const THREE=await import(moduleRoot+'/build/three.module.js');
  const {GLTFLoader}=await import(moduleRoot+'/examples/jsm/loaders/GLTFLoader.js');
  const {MeshoptDecoder}=await import(moduleRoot+'/examples/jsm/libs/meshopt_decoder.module.js');
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(640,480);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;document.body.append(renderer.domElement);
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),scene=new THREE.Scene();scene.background=new THREE.Color('#777777');
  const source=(await loader.loadAsync('/__source/Daniels.glb')).scene;source.rotation.x=-Math.PI/2;source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source),center=bounds.getCenter(new THREE.Vector3());
  const camera=new THREE.PerspectiveCamera(45,640/480,.1,1000);camera.position.copy(center).add(new THREE.Vector3(55,52,62));camera.lookAt(center);
  const stats:any[]=[];
  const render=(root:any)=>{
   root.traverse((o:any)=>{if(o.isMesh){const old=o.material,map=old.map;stats.push({size:[map.image.width,map.image.height],colorSpace:map.colorSpace,hasUV:!!o.geometry.attributes.uv});map.anisotropy=renderer.capabilities.getMaxAnisotropy();map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.generateMipmaps=true;map.needsUpdate=true;o.material=new THREE.MeshBasicMaterial({map,color:0xffffff,vertexColors:false,side:old.side,toneMapped:false});}});
   scene.add(root);renderer.render(scene,camera);const gl=renderer.getContext(),pixels=new Uint8Array(640*480*4);gl.readPixels(0,0,640,480,gl.RGBA,gl.UNSIGNED_BYTE,pixels);scene.remove(root);return pixels;
  };
  const original=render(source);source.traverse((o:any)=>{if(o.isMesh){o.geometry.dispose();o.material.map.dispose();o.material.map.image.close?.();o.material.dispose();}});const referenceRoot=(await loader.loadAsync('/models/daniels-reference.glb')).scene;
  referenceRoot.rotation.x=-Math.PI/2;const reference=render(referenceRoot);
  let sum=0,max=0;for(let i=0;i<original.length;i++){const d=Math.abs(original[i]-reference[i]);sum+=d;max=Math.max(max,d);}
  scene.add(referenceRoot);renderer.render(scene,camera);document.querySelector('#status')!.textContent='Neutral originaltextur · oförenklad referens';
  return{meanDifference:sum/original.length,maxDifference:max,stats,maxTextureSize:renderer.capabilities.maxTextureSize,triangles:renderer.info.render.triangles};
 },'/@fs'+resolve('node_modules/three'));
 expect(result.stats).toHaveLength(2);
 for(const material of result.stats){expect(material.size).toEqual([8192,8192]);expect(material.colorSpace).toBe('srgb');expect(material.hasUV).toBe(true);}
 expect(result.meanDifference).toBeLessThan(.05);expect(result.triangles).toBeGreaterThan(3900);expect(errors).toEqual([]);
 console.log(JSON.stringify(result));
 await page.screenshot({path:testInfo.outputPath('neutral-reference.png')});
});

for(const profile of ['mobile','detail'])test(`the existing dashboard loads the ${profile} texture with correct filtering and neutral diagnostics`,async({page},testInfo)=>{
 test.setTimeout(180000);
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),config=await response.json();config.quality=profile==='mobile'?'low':'auto';config.panoramas=[];config.sky.mode='procedural';await route.fulfill({json:config});});
 await page.goto('/editor');
 await expect(page.locator('#model-status')).toContainText('originaltextur',{timeout:90000});
 await page.locator('[data-workspace="advanced"]').click();await page.locator('[data-action="administration"]').click();
 await page.locator('[data-field="profile"]').selectOption(profile);await page.locator('[data-field="neutral"]').check();await page.getByRole('button',{name:'Visa vald jämförelse',exact:true}).click();
 await page.locator('[data-workspace="advanced"]').click();await page.locator('[data-action="administration"]').click();
 await expect(page.locator('#render-diagnostics')).toContainText('modelTextures');
 const data=JSON.parse(await page.locator('#render-diagnostics').innerText());
 expect(data.modelTextures).toHaveLength(1);
 expect(data.triangles).toBe(profile==='mobile'?637292:1858652);
 expect(data.modelTextures[0]).toMatchObject({textureSize:[8192,8192],colorSpace:'srgb',vertexColors:false,minFilter:1008,magFilter:1006});
 expect(data.modelTextures[0].anisotropy).toBeGreaterThan(1);
 await page.getByRole('button',{name:'Stäng administration',exact:true}).click();
 await page.screenshot({path:testInfo.outputPath('dashboard-neutral-texture.png'),timeout:60000});
 expect(errors).toEqual([]);
});
