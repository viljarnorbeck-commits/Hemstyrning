import {test,expect} from '@playwright/test';
test('network receivers appear in the app without playback or Spotify login, and become unconfirmed after discovery loss',async({page})=>{
 let available=true;
 await page.route('**/spotify-api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/spotify-api/local-devices')return route.fulfill({json:{available,devices:[{id:'cast',name:'Idle speaker',model:'Cast',protocol:'Google Cast',announced:true,lastSeen:Date.now()/1000},{id:'previous',name:'Previous speaker',model:'',protocol:'Spotify Connect',announced:false,lastSeen:1}]}});
  return route.fulfill({json:{configured:false,connected:false,canControl:false,canConfigure:false,message:'Test: no Spotify account'}});
 });
 await page.goto('/music');await page.getByRole('tab',{name:'Enheter',exact:true}).click();
 const network=page.getByRole('region',{name:'Spotify-enheter på nätverket'});
 await expect(network).toContainText('Idle speaker');await expect(network).toContainText('Annonserar på nätverket');await expect(network).toContainText('Previous speaker');
 await expect(network).toContainText('Tidigare upptäckt · tillgänglighet obekräftad');
 available=false;await network.getByRole('button',{name:'Sök på nätverket'}).click();
 await expect(network).toContainText('Lokal upptäckt är frånkopplad');
 await expect(network.getByText('Annonserar på nätverket',{exact:true})).toHaveCount(0);
});
