import{it,expect}from'vitest';import{connectDevices,mergeNetworkDevices}from'./spotify-connect';import type{ConnectDevice}from'./spotify-device-picker';
const device=(id:string,is_active=false):ConnectDevice=>({id,name:id,type:'Speaker',is_active,is_restricted:false,supports_volume:true,volume_percent:25});
it('offers local activation only when the helper confirms support, without claiming active account playback',()=>{
 const row={id:'a'.repeat(24),name:'Speaker',model:'',protocol:'Spotify Connect',announced:true,lastSeen:1,spotifyId:'hardware-id',activationSupported:true};
 expect(mergeNetworkDevices([],[row])[0]).toMatchObject({id:'discovered-'+row.id,requiresActivation:true,is_restricted:false,is_active:false});
 expect(mergeNetworkDevices([],[{...row,announced:false}])[0].is_restricted).toBe(true);
 expect(mergeNetworkDevices([],[{...row,protocol:'Google Cast'}])[0].is_restricted).toBe(true);
});
it('merges only an actual ready SDK ID with real provider devices without duplicates or claiming active playback',()=>{const api=[device('speaker',true),device('browser')],result=connectDevices(api,'browser','Hemstyrning',new Set());expect(result).toHaveLength(2);expect(result[1]).toMatchObject({id:'browser',is_local:true,is_active:false});expect(api[1]).not.toHaveProperty('is_local');const early=connectDevices([device('speaker')],'ready-local','Hemstyrning',new Set());expect(early[1]).toMatchObject({id:'ready-local',is_active:false,is_local:true,volume_percent:null});});
it('omits failed or retired SDK IDs and never creates a browser row before ready',()=>{expect(connectDevices([device('old'),device('speaker')],'','Hemstyrning',new Set(['old'])).map(d=>d.id)).toEqual(['speaker']);expect(connectDevices([],'','Hemstyrning',new Set())).toEqual([]);expect(connectDevices([],'invalid id','Hemstyrning',new Set())).toEqual([]);});
it('prefers Connect over a Cast duplicate but requires account availability before allowing selection',()=>{
 const base={model:'',announced:true,lastSeen:1};const rows=[{...base,id:'cast',name:'Living room',protocol:'Google Cast'},{...base,id:'connect',name:'Living room',protocol:'Spotify Connect',spotifyId:'real-spotify-id'},{...base,id:'cast-only',name:'Bedroom',protocol:'Google Cast'}];
 const result=mergeNetworkDevices([],rows);expect(result).toHaveLength(2);expect(result[0]).toMatchObject({id:'discovered-connect',type:'Spotify Connect',is_restricted:true});expect(result[0].unavailableReason).toContain('Spotify-appen');expect(result[1].is_restricted).toBe(true);
 const reported={...device('api-id'),name:'Living room'};expect(mergeNetworkDevices([reported],rows).filter(d=>d.name==='Living room')).toEqual([reported]);
});
