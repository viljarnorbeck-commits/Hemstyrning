import type {YardGrid,Point} from '../../../shared/yard-types.js';
/** Rasterize geometry once in the analysis process. No texture decoding or semantic color guesses. */
export class YardRaster {
 readonly low:Float32Array;readonly high:Float32Array;readonly walls:Uint8Array;readonly counts:Uint16Array;
 readonly width:number;readonly height:number;readonly cellSize:number;
 constructor(readonly min:Point,readonly max:Point,resolution=.5){
  this.cellSize=Math.max(resolution,(max[0]-min[0])/240,(max[2]-min[2])/240);this.width=Math.max(1,Math.ceil((max[0]-min[0])/this.cellSize));this.height=Math.max(1,Math.ceil((max[2]-min[2])/this.cellSize));const n=this.width*this.height;
  this.low=new Float32Array(n).fill(Infinity);this.high=new Float32Array(n).fill(-Infinity);this.walls=new Uint8Array(n);this.counts=new Uint16Array(n);
 }
 triangle(a:Point,b:Point,c:Point){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz);if(len<1e-10)return;
  const slope=Math.abs(ny)/len;
  if(slope<.5){for(const [p,q]of [[a,b],[b,c],[c,a]]){const steps=Math.min(500,Math.ceil(Math.hypot(q![0]-p![0],q![2]-p![2])/this.cellSize*2));for(let i=0;i<=steps;i++){const t=i/Math.max(1,steps),idx=this.index(p![0]+(q![0]-p![0])*t,p![2]+(q![2]-p![2])*t);if(idx>=0&&Math.max(a[1],b[1],c[1])-Math.min(a[1],b[1],c[1])>.5)this.walls[idx]=1;}}return;}
  const x0=Math.max(0,Math.floor((Math.min(a[0],b[0],c[0])-this.min[0])/this.cellSize)),x1=Math.min(this.width-1,Math.floor((Math.max(a[0],b[0],c[0])-this.min[0])/this.cellSize));
  const z0=Math.max(0,Math.floor((Math.min(a[2],b[2],c[2])-this.min[2])/this.cellSize)),z1=Math.min(this.height-1,Math.floor((Math.max(a[2],b[2],c[2])-this.min[2])/this.cellSize));
  const d=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(d)<1e-12)return;
  for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
   const px=this.min[0]+(x+.5)*this.cellSize,pz=this.min[2]+(z+.5)*this.cellSize,u=((b[2]-c[2])*(px-c[0])+(c[0]-b[0])*(pz-c[2]))/d,v=((c[2]-a[2])*(px-c[0])+(a[0]-c[0])*(pz-c[2]))/d,w=1-u-v;
   if(Math.min(u,v,w)<-.03)continue;const y=u*a[1]+v*b[1]+w*c[1],i=z*this.width+x;this.high[i]=Math.max(this.high[i]!,y);if(slope>=.77)this.low[i]=Math.min(this.low[i]!,y);this.counts[i]=Math.min(65535,this.counts[i]!+1);
  }
 }
 private index(x:number,z:number){const a=Math.floor((x-this.min[0])/this.cellSize),b=Math.floor((z-this.min[2])/this.cellSize);return a<0||b<0||a>=this.width||b>=this.height?-1:b*this.width+a;}
 finish(key:string):YardGrid{
  const candidates=Array.from(this.low).filter(Number.isFinite).sort((a,b)=>a-b),baseline=candidates[Math.floor(candidates.length*.25)]??this.max[1],n=this.low.length,visited=new Uint8Array(n),queue:number[]=[];
  // Seed the lower connected envelope. Flat elevated islands are not ground.
  for(let i=0;i<n;i++)if(Number.isFinite(this.low[i])&&Math.abs(this.low[i]!-baseline)<.65&&!this.walls[i]){visited[i]=1;queue.push(i);}
  for(let head=0;head<queue.length;head++){const i=queue[head]!,x=i%this.width,z=Math.floor(i/this.width);for(const [dx,dz]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx!,zz=z+dz!,j=zz*this.width+xx;if(xx<0||zz<0||xx>=this.width||zz>=this.height||visited[j]||this.walls[j]||!Number.isFinite(this.low[j]))continue;if(Math.abs(this.low[j]!-this.low[i]!)>this.cellSize*.7+.12)continue;visited[j]=1;queue.push(j);}}
  const ground:(number|null)[]=[],kind:number[]=[],confidence:number[]=[];
  for(let i=0;i<n;i++){const h=this.low[i]!,spread=this.high[i]!-h,obstacle=!!this.walls[i]||Number.isFinite(h)&&(!visited[i]&&h>baseline+1.2||spread>1);kind[i]=obstacle?2:visited[i]?1:0;ground[i]=visited[i]&&!obstacle?h:null;confidence[i]=obstacle?.7:visited[i]?.65:0;}
  // Merge contiguous rows into rectangles, without filling holes or overwriting manual polygons.
  const proposals:YardGrid['proposals']=[];const used=new Uint8Array(n);
  for(let z=0;z<this.height;z++)for(let x=0;x<this.width;x++){const i=z*this.width+x;if(used[i])continue;const k=kind[i]!,h=ground[i]??baseline;let end=x+1;while(end<this.width&&!used[z*this.width+end]&&kind[z*this.width+end]===k&&Math.abs((ground[z*this.width+end]??baseline)-h)<.25)end++;let bottom=z+1;
   outer:while(bottom<this.height){for(let xx=x;xx<end;xx++)if(used[bottom*this.width+xx]||kind[bottom*this.width+xx]!==k||Math.abs((ground[bottom*this.width+xx]??baseline)-h)>.25)break outer;bottom++;}
   for(let zz=z;zz<bottom;zz++)for(let xx=x;xx<end;xx++)used[zz*this.width+xx]=1;
   if(proposals.length>=3000)continue;const ax=this.min[0]+x*this.cellSize,bx=this.min[0]+end*this.cellSize,az=this.min[2]+z*this.cellSize,bz=this.min[2]+bottom*this.cellSize;
   const at=(xx:number,zz:number)=>ground[zz*this.width+xx]??h;
   proposals.push({id:`${key.slice(0,10)}-${i}`,kind:k===1?'ground':k===2?'obstacle':'uncertain',confidence:confidence[i]!,status:'proposed',points:[[ax,at(x,z),az],[bx,at(end-1,z),az],[bx,at(end-1,bottom-1),bz],[ax,at(x,bottom-1),bz]]});
  }
  const known=ground.filter((v):v is number=>v!==null),fallbackHeight=known.length?Math.max(...known)+.6:this.max[1]+.6;
  return{version:1,key,createdAt:new Date().toISOString(),originX:this.min[0],originZ:this.min[2],width:this.width,height:this.height,cellSize:this.cellSize,ground,kind,confidence,fallbackHeight,bounds:{min:this.min,max:this.max},proposals,notes:['Geometriska förslag, inte semantiskt verifierad gräsmatta eller robotens säkerhetskarta.','Mark måste godkännas före användning för robotrörelse. Osäkra celler fylls inte med körbar mark.']};
 }
}
