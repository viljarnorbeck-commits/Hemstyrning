import {escapeHtml as esc} from './panels';
import {icon} from './app-navigation';
export type SpotifyItem={uri:string;name:string;kind?:'track'|'artist'|'album'|'playlist';artist?:string;owner?:string;cover?:string;image?:string;contextUri?:string;position?:number;playable?:boolean};
export type CatalogResult={tracks:SpotifyItem[];artists:SpotifyItem[];albums:SpotifyItem[];playlists:SpotifyItem[]};
export type BrowseResult={item:SpotifyItem|null;items:SpotifyItem[];nextOffset:number|null;total:number|null};
function cover(value:string){try{const u=new URL(value);return u.protocol==='https:'&&['i.scdn.co','mosaic.scdn.co'].includes(u.hostname)?esc(u.href):'';}catch{return '';}}
export function libraryRows(items:SpotifyItem[],allow:boolean){
 return items.map((t,i)=>{
  const kind=t.kind??t.uri.split(':')[1],track=kind==='track',src=cover(t.cover??t.image??''),label=kind==='artist'?'Artist':kind==='album'?'Album':kind==='playlist'?'Spellista':'Låt';
  return `<article class="music-catalog-${kind}" data-dom-key="catalog-${esc(t.uri)}-${i}"><div class="music-result-art">${src?`<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'<span aria-hidden="true">♪</span>'}</div><div class="music-result-copy">${track?`<b>${esc(t.name)}</b>`:`<button type="button" class="music-browse-title" data-browse="${esc(t.uri)}" aria-label="Öppna ${esc(t.name)}">${esc(t.name)}</button>`}<small>${esc([label,t.owner||t.artist].filter(Boolean).join(' · '))}</small></div><button type="button" data-spotify="${track?'play_track':'play_context'}" data-uri="${esc(t.uri)}" ${t.contextUri?`data-context="${esc(t.contextUri)}"`:''} ${t.position!==undefined?`data-position="${t.position}"`:''} aria-label="Spela ${esc(t.name)}" ${allow&&t.playable!==false?'':'disabled'}>${icon('play')}<span>Spela</span></button>${track?`<button type="button" class="music-queue-add" data-spotify="queue" data-uri="${esc(t.uri)}" aria-label="Lägg ${esc(t.name)} i kön" ${allow&&t.playable!==false?'':'disabled'}>+ Kö</button>`:`<button type="button" data-browse="${esc(t.uri)}" aria-label="Visa innehåll i ${esc(t.name)}">Öppna</button>`}</article>`;
 }).join('');
}
