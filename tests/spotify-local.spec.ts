import {test,expect} from '@playwright/test';
test('device chooser merges local idle Connect receivers and hides their Cast duplicates without starting music',async({page})=>{
 const commands:any[]=[];let chosen=false;
 await page.route('**/spotify-api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(route.request().method()==='POST'){commands.push(route.request().postDataJSON());chosen=true;}
  let json:any={playlists:[],queue:[],tracks:[],artists:[],albums:[]};
  if(path.endsWith('/status'))json={configured:true,connected:true,canControl:true,canConfigure:false,webPlaybackAuthorized:false,message:'Test'};
  if(path.endsWith('/playback'))json={connected:true,playing:false,track:null,device:chosen?{id:'receiver-real-id',name:'Idle speaker',volume_percent:20}:null,progressMs:0};
  if(path.endsWith('/devices'))json={devices:chosen?[{id:'receiver-real-id',name:'Idle speaker',type:'Speaker',is_active:false,is_restricted:false,supports_volume:true,volume_percent:20}]:[]};if(path.endsWith('/command'))json={accepted:true,deviceId:'receiver-real-id'};
  if(path.endsWith('/local-devices'))json={available:true,devices:[{id:'cast',name:'Idle speaker',model:'',protocol:'Google Cast',announced:true,lastSeen:1},{id:'connect',name:'Idle speaker',model:'',protocol:'Spotify Connect',announced:true,lastSeen:1,spotifyId:'receiver-real-id',activationSupported:true}]};
  return route.fulfill({json});
 });
 await page.goto('/music');await page.getByRole('button',{name:'Välj uppspelningsenhet',exact:true}).click();
 const menu=page.getByRole('menu',{name:'Välj uppspelningsenhet'});
 await expect(menu.getByRole('menuitemradio')).toHaveCount(1);
 await expect(menu).toContainText('Idle speaker');await expect(menu).toContainText('Spotify Connect');
 await expect(page.getByRole('region',{name:'Spotify-enheter på nätverket'})).toHaveCount(0);
 await menu.getByRole('menuitemradio').click();await expect.poll(()=>commands).toEqual([{action:'activate',deviceId:'discovered-connect'},{action:'transfer',deviceId:'receiver-real-id',play:false}]);
});
