import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {Matrix4,Vector3,Quaternion,Euler} from 'three';
import sharp from 'sharp';
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const requireValue=(value,message)=>{if(!value)throw Error(message);};
const vector=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);
const inside=(p,b,epsilon=0)=>p.every((value,i)=>value>=b.min[i]-epsilon&&value<=b.max[i]+epsilon);
export function placement(model){
 requireValue(vector(model.position)&&vector(model.rotation)&&Number.isFinite(model.scale)&&model.scale>0&&model.scale<=1000,'Ogiltig likformig modelltransform.');
 return new Matrix4().compose(new Vector3(...model.position),new Quaternion().setFromEuler(new Euler(...model.rotation.map(n=>n*Math.PI/180),'YXZ')),new Vector3().setScalar(model.scale));
}
export function glbJSON(bytes){
 requireValue(bytes.length>=28&&bytes.length<=256*1024*1024&&bytes.toString('ascii',0,4)==='glTF'&&bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length,'GLB måste vara läsbar GLB 2.0, högst 256 MB.');
 let json;for(let offset=12;offset<bytes.length;){requireValue(offset+8<=bytes.length,'Avklippt GLB-chunk.');const length=bytes.readUInt32LE(offset),kind=bytes.readUInt32LE(offset+4);requireValue(length%4===0&&offset+8+length<=bytes.length,'Ogiltig GLB-chunklängd.');if(kind===0x4e4f534a){requireValue(!json&&offset===12,'GLB JSON-chunk saknas eller är dubblerad.');json=JSON.parse(bytes.toString('utf8',offset+8,offset+8+length));}offset+=8+length;}
 requireValue(json?.asset?.version==='2.0','GLB JSON saknar glTF 2.0.');
 const supported=new Set(['EXT_meshopt_compression','KHR_mesh_quantization','KHR_materials_unlit','KHR_texture_transform','KHR_materials_emissive_strength']);
 requireValue(!(json.extensionsUsed??[]).includes('KHR_lights_punctual'),'Exportera gårdsgeometrin utan egna ljuskällor; Hemstyrnings ljus ska bevaras.');
 requireValue((json.extensionsRequired??[]).every(name=>supported.has(name)),'Modellen kräver en komprimering/materialfunktion som Hemstyrnings laddare inte stöder. Exportera vanlig GLB eller Meshopt med PNG/JPEG/WebP.');return json;
}
async function io(){await MeshoptDecoder.ready;return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});}
export async function safeFile(root,relative,maximum=256*1024*1024){
 requireValue(typeof relative==='string'&&relative.length<240&&!/^[/.]|[\\:%?#]/.test(relative)&&!relative.split('/').some(segment=>!segment||segment==='.'||segment==='..'),'Osäker eller ogiltig relativ filsökväg.');
 const realRoot=await realpath(root),file=await realpath(path.resolve(root,relative));
 requireValue(file.toLowerCase().startsWith((realRoot+path.sep).toLowerCase()),'En leveransfil pekar utanför versionskatalogen.');
 const info=await stat(file);requireValue(info.isFile()&&info.size>0&&info.size<=maximum,'Fil saknas, är tom eller för stor: '+relative);return readFile(file);
}
export async function documentFrom(bytes,resources={}){
 glbJSON(bytes);const reader=await io(),json=await reader.binaryToJSON(new Uint8Array(bytes));
 Object.assign(json.resources,resources);return {doc:await reader.readJSON(json),reader};
}
export function geometry(doc){
 requireValue(doc.getRoot().listScenes().length===1,'Exportera exakt en aktiv glTF-scen.');
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],samples=[];let vertices=0;
 for(const node of doc.getRoot().listNodes()){
  const matrix=new Matrix4().fromArray(node.getWorldMatrix());
  for(const primitive of node.getMesh()?.listPrimitives()??[]){
   const positions=primitive.getAttribute('POSITION');requireValue(positions&&positions.getElementSize()===3,'En mesh saknar giltiga POSITION-koordinater.');
   const array=positions.getArray();requireValue(array,'POSITION-bufferten saknas.');vertices+=positions.getCount();requireValue(vertices<=20_000_000,'Modellen är för tung. Publicera en lättare visningsversion.');
   if(primitive.getMaterial()?.getBaseColorTexture())requireValue(primitive.getAttribute('TEXCOORD_0'),'En texturerad mesh saknar UV-koordinater.');
   const step=Math.max(1,Math.ceil(positions.getCount()/20000));
   const element=[];for(let i=0;i<positions.getCount();i++){positions.getElement(i,element);requireValue(element.every(Number.isFinite),'Modellen innehåller ogiltiga koordinater.');const p=new Vector3(...element).applyMatrix4(matrix).toArray();for(let axis=0;axis<3;axis++){min[axis]=Math.min(min[axis],p[axis]);max[axis]=Math.max(max[axis],p[axis]);}if(i%step===0)samples.push(p);}
  }
 }
 requireValue(vertices>0&&max.some((n,i)=>n-min[i]>.001),'Modellen saknar användbar geometri.');return {min,max,samples,vertices};
}
const transform=(p,m)=>new Vector3(...p).applyMatrix4(m).toArray();
function transformedBounds(bounds,m){const points=[];for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]])points.push(transform([x,y,z],m));return{min:[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...points.map(p=>p[i])))};}
export async function baselineFrame(bytes,model){
 const {doc}=await documentFrom(bytes),shape=geometry(doc),matrix=placement(model);
 const pairs=shape.samples.map(source=>({source,world:transform(source,matrix)}));
 const a=pairs.reduce((a,b)=>b.world[0]<a.world[0]?b:a),b=pairs.reduce((a,b)=>b.world[0]>a.world[0]?b:a);
 const area=p=>Math.abs((b.world[0]-a.world[0])*(p.world[2]-a.world[2])-(b.world[2]-a.world[2])*(p.world[0]-a.world[0]));
 const c=pairs.reduce((a,b)=>area(b)>area(a)?b:a);requireValue(area(c)>.01,'Referensmodellens ankare ligger på en linje.');
 const baseline={sha256:sha256(bytes),model,bounds:transformedBounds(shape,matrix)},anchors=[a,b,c].map((p,i)=>({id:'reference-'+['a','b','c'][i],world:p.world,baselineSource:p.source}));
 return {schemaVersion:1,id:'hemstyrning-yard-'+sha256(JSON.stringify([baseline,anchors])).slice(0,16),units:'existing-yard-unit',gpsVerified:false,createdAt:new Date().toISOString(),baseline,anchors,maxAnchorError:.05};
}
export async function validateRelease(directory,manifestBytes,frame,{onFilesRead}={}){
 const manifest=JSON.parse(manifestBytes.toString('utf8'));
 requireValue(manifest.schemaVersion===1,'Manifestets schemaVersion stöds inte. Använd version 1.');
 requireValue(manifest.status==='published'||manifest.ready===true&&manifest.status==='complete','Leveransen är inte färdigpublicerad.');
 const version=manifest.version??manifest.modelVersion;requireValue(typeof version==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(version)&&path.basename(directory)===version,'Manifestets version stämmer inte med katalogen.');
 const publishedAt=new Date(manifest.publishedAt??manifest.createdAt).toISOString();
 const entries=Array.isArray(manifest.files)?manifest.files:Object.entries(manifest.files??{}).map(([name,value])=>({path:name,...(typeof value==='string'?{sha256:value}:value)}));
 requireValue(entries.length>=2&&entries.length<=150,'Manifestet saknar en komplett fillista.');
 const files=new Map();let totalBytes=0;for(const entry of entries){requireValue(typeof entry.sha256==='string'&&/^[a-f0-9]{64}$/i.test(entry.sha256)&&!files.has(entry.path),'Ogiltig kontrollsumma eller dubblerad fil.');const bytes=await safeFile(directory,entry.path);totalBytes+=bytes.length;requireValue(totalBytes<=512*1024*1024,'Leveransen är för stor. Publicera en lättare visningsversion.');requireValue(sha256(bytes)===entry.sha256.toLowerCase(),'SHA256 stämmer inte: '+entry.path);files.set(entry.path,bytes);}
 if(Array.isArray(manifest.textures))requireValue(manifest.textures.every(name=>files.has(name)),'En angiven textur saknas i den kontrollsummerade fillistan.');
 const modelPath=typeof manifest.model==='string'?manifest.model:manifest.model?.path??'model.glb',calibrationPath=typeof manifest.calibration==='string'?manifest.calibration:manifest.calibration?.path??'calibration.json';
 const bytes=files.get(modelPath),calibrationBytes=files.get(calibrationPath);requireValue(bytes&&calibrationBytes&&calibrationBytes.length<=1024*1024,'GLB och kalibrering måste finnas i kontrollsummerad fillista; kalibreringen får vara högst 1 MB.');
 if(files.has('VERSION.txt'))requireValue(files.get('VERSION.txt').toString('utf8').trim()===version,'VERSION.txt stämmer inte.');
 await onFilesRead?.({version,files:[...files].map(([name,content])=>({path:name,sha256:sha256(content)})),manifestSha256:sha256(manifestBytes),completeDeliveryRead:['model.glb','calibration.json','VERSION.txt','validation.json'].every(name=>files.has(name))});
 const calibration=JSON.parse(calibrationBytes.toString('utf8'));
 requireValue(calibration.schemaVersion===1,'Kalibreringens schemaVersion måste vara 1.');
 requireValue(calibration.coordinateSystemId===frame.id&&calibration.referenceModelSha256===frame.baseline.sha256,'Kalibreringen använder inte gårdens frysta lokala koordinatsystem/referensmodell.');
 requireValue(calibration.alignmentVerified===true,'Lokal inpassning är inte verifierad. Uppskattad GPS räcker inte för att byta fungerande modell.');
 const settings=calibration.sourceToYard;requireValue(settings?.rotationOrder==='YXZ'&&settings.rotationUnit==='degrees','Kalibreringen måste ange YXZ och grader.');const matrix=placement(settings);
 const matches=calibration.anchorMatches;requireValue(Array.isArray(matches)&&matches.length>=3,'Minst tre referensankare krävs.');
 const used=new Set();for(const anchor of frame.anchors){const match=matches.find(p=>p.id===anchor.id);requireValue(match&&vector(match.source)&&!used.has(match.id),'Ett fryst referensankare saknas.');used.add(match.id);requireValue(new Vector3(...transform(match.source,matrix)).distanceTo(new Vector3(...anchor.world))<=frame.maxAnchorError,'Referensankaret ligger fel: '+anchor.id);}
 const json=glbJSON(bytes),resources={};
 for(const item of [...(json.buffers??[]),...(json.images??[])])if(item.uri&&!item.uri.startsWith('data:')){requireValue(files.has(item.uri),'En GLB-resurs saknas i manifestet: '+item.uri);resources[item.uri]=new Uint8Array(files.get(item.uri));}
 const {doc,reader}=await documentFrom(bytes,resources),shape=geometry(doc);
 requireValue(doc.getRoot().listTextures().length>0,'Texturer saknas. Publicera läsbar texturerad GLB.');
 for(const texture of doc.getRoot().listTextures()){const image=texture.getImage();requireValue(image,'En textur saknar bilddata.');const decoder=sharp(Buffer.from(image),{limitInputPixels:150_000_000}),meta=await decoder.metadata();requireValue(['png','jpeg','webp'].includes(meta.format)&&meta.width&&meta.height,'Texturen måste vara läsbar PNG, JPEG eller WebP.');await decoder.stats();}
 // A cropped, incomplete asset may omit the reference landmarks themselves.
 // Its verified transform must still match all frozen reference coordinates.
 const bounds=transformedBounds(shape,matrix),span=Math.max(...frame.baseline.bounds.max.map((n,i)=>n-frame.baseline.bounds.min[i]));
 requireValue(bounds.max.every((n,i)=>n-bounds.min[i]<=span*4)&&inside(bounds.min,frame.baseline.bounds,span*2)&&inside(bounds.max,frame.baseline.bounds,span*2),'Modellens storlek/placering avviker orimligt från gården.');
 const embedded=Buffer.from(await reader.writeBinary(doc));requireValue(embedded.length<=256*1024*1024,'Den inbäddade modellen överstiger 256 MB.');
 requireValue(sha256(await safeFile(directory,'manifest.json',1024*1024))===sha256(manifestBytes),'Manifestet ändrades under läsningen.');
 return {version,publishedAt,manifestSha256:sha256(manifestBytes),calibrationSha256:sha256(calibrationBytes),sourceSha256:sha256(bytes),embedded,complete:manifest.complete===true,seasons:manifest.targetSeasons,model:{position:settings.position,rotation:settings.rotation,scale:settings.scale},fileHashes:entries.map(e=>({path:e.path,sha256:e.sha256.toLowerCase()}))};
}
