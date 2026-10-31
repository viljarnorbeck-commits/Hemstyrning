import{test,expect,type Page}from'@playwright/test';
async function setup(page:Page,authorized=true,canControl=true){
 const commands:any[]=[];let current='speaker-kitchen';let tokenCalls=0;
 await page.route('https://sdk.scdn.co/spotify-player.js',route=>route.fulfill({contentType:'application/javascript',body:`
 window.__sdk={players:[],activations:0,disconnects:0};
 window.Spotify={Player:class{constructor(options){this.options=options;this.listeners={};window.__sdk.players.push(this);}addListener(e,fn){this.listeners[e]=fn;return true;}emit(e,v={}){this.listeners[e]?.(v);}connect(){this.options.getOAuthToken(token=>{const n=Number(sessionStorage.getItem('test-sdk-counter')||0)+1;sessionStorage.setItem('test-sdk-counter',String(n));this.emit('ready',{device_id:'browser-'+n});});return Promise.resolve(true);}activateElement(){window.__sdk.activations++;return Promise.resolve();}disconnect(){window.__sdk.disconnects++;}}};window.onSpotifyWebPlaybackSDKReady();
 `}));
 await page.route('**/spotify-api/**',async route=>{
  const path=new URL(route.request().url()).pathname.slice('/spotify-api'.length);let data:any={};
  if(path==='/status')data={configured:true,connected:true,canControl,canConfigure:canControl,webPlaybackAuthorized:authorized,message:'Ansluten'};
  else if(path==='/sdk-token'){tokenCalls++;data={accessToken:'fake-sdk-access',expiresAt:Date.now()+3600000};}
  else if(path==='/playback')data={connected:true,playing:true,progressMs:1000,track:{name:'Testmusik',artist:'Simulerad artist',album:'Test',cover:'',durationMs:180000,url:null},device:{id:current,name:current.startsWith('browser-')?'Hemstyrning · Webbläsare':'Kök',volume_percent:35}};
  else if(path==='/devices')data={devices:[{id:'speaker-kitchen',name:'Kök',type:'Speaker',is_active:current==='speaker-kitchen',is_restricted:false,supports_volume:true,volume_percent:35},{id:'restricted',name:'Spärrad högtalare',type:'Speaker',is_active:false,is_restricted:true,supports_volume:false,volume_percent:null}]};
  else if(path==='/playlists')data={playlists:[]};
  else if(path==='/command'){const body=route.request().postDataJSON();commands.push(body);if(body.action==='transfer')current=body.deviceId;data={accepted:true};}
  await route.fulfill({json:data});
 });
 return{commands,get tokenCalls(){return tokenCalls;}};
}
test('browser registers without autoplay, appears in the device list, transfers only on selection and re-registers on reload',async({page})=>{
 const mock=await setup(page);await page.goto('/music');await expect(page.locator('.embedded-music')).toContainText('Testmusik');
 const row=page.locator('[data-spotify-device="browser-1"]');await expect(row).toContainText('den här webbläsaren');await expect(page.locator('[data-spotify-device="speaker-kitchen"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-spotify-device="restricted"]')).toBeDisabled();expect(mock.commands).toHaveLength(0);expect(mock.tokenCalls).toBe(1);
 await row.click();await expect.poll(()=>mock.commands.length).toBe(1);expect(mock.commands[0]).toMatchObject({action:'transfer',deviceId:'browser-1',play:true});await expect(row).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>(window as any).__sdk.activations)).toBe(1);
 await page.reload();await expect(page.locator('[data-spotify-device="browser-2"]')).toBeVisible();await expect(page.locator('[data-spotify-device="browser-1"]')).toHaveCount(0);expect(mock.commands).toHaveLength(1);
 expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain('fake-sdk-access');
 await page.evaluate(()=>(window as any).__sdk.players[0].emit('autoplay_failed'));await expect(page.getByRole('button',{name:'Tillåt ljud'})).toBeVisible();await page.getByRole('button',{name:'Tillåt ljud'}).click();await expect(page.getByRole('button',{name:'Tillåt ljud'})).toHaveCount(0);
 await page.evaluate(()=>(window as any).__sdk.players[0].emit('not_ready'));await expect(page.locator('[data-spotify-device="browser-2"]')).toHaveCount(0);await expect(page.locator('.browser-speaker-status')).toContainText('Återansluter');await page.screenshot({path:'/tmp/hem-spotify-devices.png'});
});
test('old permissions request reauthorization without fetching SDK tokens or transferring music',async({page})=>{
 const mock=await setup(page,false);await page.goto('/music');await expect(page.locator('.embedded-music')).toContainText('Testmusik');await expect(page.getByRole('button',{name:'Godkänn webbläsaruppspelning'})).toBeVisible();expect(mock.commands).toHaveLength(0);expect(mock.tokenCalls).toBe(0);expect(await page.locator('script[src="https://sdk.scdn.co/spotify-player.js"]').count()).toBe(0);
});
test('viewer can see speakers but cannot register or transfer, including on mobile',async({page})=>{
 const mock=await setup(page,true,false);await page.setViewportSize({width:390,height:844});await page.goto('/music');await expect(page.locator('.embedded-music')).toContainText('Testmusik');await page.getByRole('button',{name:'Enheter',exact:true}).click();await expect(page.locator('[data-spotify-device="speaker-kitchen"]')).toBeDisabled();expect(mock.commands).toHaveLength(0);expect(mock.tokenCalls).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
