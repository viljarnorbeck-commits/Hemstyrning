import type {Router,Request,Response} from 'express';
type Spotify=(path:string,method?:string,payload?:unknown)=>Promise<any>;
const validUri=/^spotify:(track|artist|album|playlist):[a-zA-Z0-9]{1,100}$/;
function image(images:any):string{const value=images?.[0]?.url;try{const u=new URL(value);return u.protocol==='https:'&&['i.scdn.co','mosaic.scdn.co'].includes(u.hostname)?u.href:'';}catch{return '';}}
export function catalogItem(item:any,contextUri?:string,position?:number){
 if(!item||typeof item.uri!=='string'||!validUri.test(item.uri))return null;
 const kind=item.uri.split(':')[1],album=item.album;
 return{uri:item.uri,kind,name:String(item.name??''),artist:(Array.isArray(item.artists)?item.artists:[]).map((a:any)=>String(a.name??'')).join(', '),owner:String(item.owner?.display_name??''),cover:image(album?.images??item.images),
  ...(kind==='track'?{contextUri:contextUri??(/^spotify:album:[a-zA-Z0-9]+$/.test(album?.uri??'')?album.uri:undefined),...(position!==undefined?{position}:{}),playable:item.is_playable!==false&&!item.is_local}:{}),
  ...(typeof item.total_tracks==='number'?{total:item.total_tracks}:{})};
}
function fail(res:Response,e:unknown){const error=e as {status?:number;message?:string};res.status(error.status&&error.status>=400&&error.status<600?error.status:502).json({message:error.message??'Spotify kunde inte läsa musikbiblioteket.'});}
export function spotifyCatalog(router:Router,allowed:(req:Request,res:Response)=>boolean,spotify:Spotify){
 router.get('/search',async(req,res)=>{
  if(!allowed(req,res))return;const q=typeof req.query.q==='string'?req.query.q.trim():'';
  if(q.length<2||q.length>100){res.status(400).json({message:'Sökningen måste vara 2–100 tecken.'});return;}
  try{const data=await spotify('/search?type=track,artist,album,playlist&limit=10&q='+encodeURIComponent(q));
   const map=(key:string)=>(Array.isArray(data?.[key]?.items)?data[key].items:[]).map((v:any)=>catalogItem(v)).filter(Boolean);
   res.json({tracks:map('tracks'),artists:map('artists'),albums:map('albums'),playlists:map('playlists')});
  }catch(e){fail(res,e);}
 });
 router.get('/browse/:kind/:id',async(req,res)=>{
  if(!allowed(req,res))return;const {kind,id}=req.params,offset=Number(req.query.offset??0);
  if(!['artist','album','playlist'].includes(kind)||!/^[a-zA-Z0-9]{1,100}$/.test(id)||!Number.isInteger(offset)||offset<0||offset>10000){res.status(400).json({message:'Ogiltigt biblioteksval.'});return;}
  try{
   const uri='spotify:'+kind+':'+id,metadata=await spotify('/'+kind+'s/'+id);let page:any;
   if(kind==='artist')page=await spotify('/artists/'+id+'/albums?include_groups=album,single&limit=20&offset='+offset);
   else if(kind==='album')page=await spotify('/albums/'+id+'/tracks?limit=20&offset='+offset);
   else{try{page=await spotify('/playlists/'+id+'/items?limit=20&offset='+offset);}catch(e){if((e as {status?:number}).status!==404)throw e;page=await spotify('/playlists/'+id+'/tracks?limit=20&offset='+offset);}}
   const items=(Array.isArray(page?.items)?page.items:[]).map((raw:any,index:number)=>{
    const item=kind==='playlist'?raw?.item??raw?.track:raw;
    return catalogItem(kind==='album'?{...item,album:metadata}:item,kind==='artist'?undefined:uri,kind==='artist'?undefined:offset+index);
   }).filter(Boolean);
   res.json({item:catalogItem(metadata),items,nextOffset:page?.next?offset+20:null,total:Number.isFinite(page?.total)?page.total:null});
  }catch(e){fail(res,e);}
 });
}

/** Keep playback in Spotify's own context so its next-track handling survives page closure. */
export async function playbackSelection(action:string,body:any,spotify:Spotify){
 const uri=body?.uri;
 if(action==='queue'){if(typeof uri!=='string'||!/^spotify:track:[a-zA-Z0-9]{1,100}$/.test(uri))throw Error('Ogiltig låtadress.');return null;}
 if(action==='play_context'||action==='play_playlist'){
  if(typeof uri!=='string'||!/^spotify:(album|artist|playlist):[a-zA-Z0-9]{1,100}$/.test(uri))throw Error('Välj ett album, en artist eller en spellista.');
  if(action==='play_playlist'&&!uri.startsWith('spotify:playlist:'))throw Error('Välj en spellista.');
  return{context_uri:uri};
 }
 if(typeof uri!=='string'||!/^spotify:track:[a-zA-Z0-9]{1,100}$/.test(uri))throw Error('Ogiltig låtadress.');
 let context=body.contextUri;
 if(context!==undefined&&(typeof context!=='string'||!/^spotify:(album|playlist):[a-zA-Z0-9]{1,100}$/.test(context)))throw Error('Ogiltigt uppspelningssammanhang.');
 if(!context){const track=await spotify('/tracks/'+uri.split(':')[2]);context=track?.album?.uri;}
 if(typeof context!=='string'||!/^spotify:(album|playlist):[a-zA-Z0-9]{1,100}$/.test(context))throw Error('Spotify saknar album eller spellista för låten.');
 if(body.position!==undefined&&(!Number.isInteger(body.position)||body.position<0||body.position>10000))throw Error('Ogiltig låtposition.');
 return{context_uri:context,offset:body.position!==undefined?{position:body.position}:{uri}};
}
