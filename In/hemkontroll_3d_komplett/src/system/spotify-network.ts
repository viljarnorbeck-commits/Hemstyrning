import './spotify-network.css';

export interface NetworkReceiver {id:string;name:string;model:string;protocol:string;announced:boolean;lastSeen:number;spotifyId?:string}
export function networkReceivers(value:unknown):NetworkReceiver[]{
 const rows=(value as {devices?:unknown})?.devices;
 if(!Array.isArray(rows))throw new Error('Ogiltigt svar från lokal upptäckt');
 return rows.slice(0,200).filter((r):r is NetworkReceiver=>!!r&&typeof r==='object'&&
  typeof r.id==='string'&&typeof r.name==='string'&&typeof r.protocol==='string'&&
  typeof r.model==='string'&&typeof r.announced==='boolean'&&typeof r.lastSeen==='number');
}

/** Independent of HA state and Spotify playback. Keeps the same DOM across panel updates. */
export class SpotifyNetwork extends EventTarget{
 readonly root=document.createElement('section');
 private status=document.createElement('p');private list=document.createElement('div');
 private refresh=document.createElement('button');private controller?:AbortController;
 private timer?:ReturnType<typeof setTimeout>;private disposed=false;
 count=0;
 receivers:NetworkReceiver[]=[];
 constructor(){super();this.root.className='spotify-network';this.root.setAttribute('aria-label','Spotify-enheter på nätverket');
  const title=document.createElement('h3');title.textContent='Enheter på nätverket · även utan uppspelning';
  this.status.setAttribute('role','status');this.refresh.textContent='Sök på nätverket';
  const note=document.createElement('p');note.className='network-note';note.textContent='Lokal upptäckt startar ingen musik. En nätverksannons bekräftar inte uppspelningsstatus. Mottagare som saknas i Spotifys lista kan ännu inte väljas här.';
  this.root.append(title,this.status,this.refresh,this.list,note);this.refresh.onclick=()=>void this.update();
  void this.update();
 }
 async update(){
  if(this.disposed||this.controller)return;clearTimeout(this.timer);this.refresh.disabled=true;
  this.controller=new AbortController();const timeout=setTimeout(()=>this.controller?.abort(),5000);
  try{
   // The loopback helper is available on this computer. Remote/mobile deployments
   // use the same-origin backend route, never the phone's own loopback address.

   const url='/spotify-api/local-devices';
   const response=await fetch(url,{cache:'no-store',signal:this.controller.signal});
   if(!response.ok)throw new Error('Lokal upptäckt är inte tillgänglig');
   const data=await response.json();if(data.available!==true)throw new Error('Discovery offline');const rows=networkReceivers(data);if(this.disposed)return;
   this.receivers=rows;this.list.replaceChildren();
   for(const device of rows){const row=document.createElement('article');row.className='network-receiver';
    const name=document.createElement('strong');name.textContent=device.name;
    const detail=document.createElement('small');detail.textContent=`${device.protocol}${device.model?' · '+device.model:''}`;
    const state=document.createElement('span');state.textContent=device.announced?'Annonserar på nätverket':'Tidigare upptäckt · tillgänglighet obekräftad';
    row.append(name,detail,state);this.list.append(row);
   }
   this.count=rows.filter(r=>r.announced).length;
   this.status.textContent=rows.length?'Lokalt upptäckta mottagare. Ingen uppspelning krävs.':'Inga nätverksannonser hittades. Sovande eller avstängda mottagare kan vara osynliga.';
   this.dispatchEvent(new Event('change'));
  }catch{
   if(this.disposed)return;this.receivers=[];this.count=0;this.status.textContent='Lokal upptäckt är frånkopplad. Eventuella rader nedan är tidigare resultat, inte bekräftat tillgängliga.';
   this.list.querySelectorAll('article span').forEach(row=>row.textContent='Tidigare upptäckt · tillgänglighet obekräftad');
   this.dispatchEvent(new Event('change'));
  }finally{clearTimeout(timeout);this.controller=undefined;this.refresh.disabled=false;
   if(!this.disposed)this.timer=setTimeout(()=>{if(!document.hidden)void this.update();else this.schedule();},10000);
  }
 }
 private schedule(){if(!this.disposed)this.timer=setTimeout(()=>{if(!document.hidden)void this.update();else this.schedule();},10000);}
 dispose(){this.disposed=true;clearTimeout(this.timer);this.controller?.abort();this.root.remove();}
}
