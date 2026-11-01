import{fixture}from'./fixtures';
import{test,expect,type Page}from'./test';
test.beforeEach(async({page})=>{await fixture(page);});
async function setup(page:Page,authorized=true,canControl=true,confirmTransfer=true){
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
  else if(path==='/command'){const body=route.request().postDataJSON();commands.push(body);if(body.action==='transfer'&&confirmTransfer)current=body.deviceId;data={accepted:true};}
  await route.fulfill({json:data});
 });
 return{commands,get tokenCalls(){return tokenCalls;}};
}
async function chooser(page:Page){const trigger=page.getByRole('button',{name:'Välj uppspelningsenhet',exact:true});if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();return page.getByRole('menu',{name:'Välj uppspelningsenhet'});}
test('browser registers without autoplay, transfers only on selection and re-registers on reload',async({page})=>{
 const mock=await setup(page);await page.goto('/music');await expect(page.locator('.embedded-music')).toContainText('Testmusik');let menu=await chooser(page);
 await expect(menu.locator('[data-connect-device="browser-1"]')).toBeVisible();await expect(menu.locator('[data-connect-device="speaker-kitchen"]')).toHaveAttribute('aria-checked','true');await expect(menu.locator('[data-connect-device="restricted"]')).toHaveCount(0);expect(mock.commands).toHaveLength(0);
 await menu.locator('[data-connect-device="browser-1"]').click();await expect.poll(()=>mock.commands.length).toBe(1);expect(mock.commands[0]).toMatchObject({action:'transfer',deviceId:'browser-1',play:true});await expect(page.locator('.music-player-output strong')).toContainText('Hemstyrning');expect(await page.evaluate(()=>(window as any).__sdk.activations)).toBe(1);
 await page.reload();menu=await chooser(page);await expect(menu.locator('[data-connect-device="browser-2"]')).toBeVisible({timeout:30000});await expect(menu.locator('[data-connect-device="browser-1"]')).toHaveCount(0);expect(mock.commands).toHaveLength(1);
 expect(await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}))).not.toContain('fake-sdk-access');await page.keyboard.press('Escape');
 await page.evaluate(()=>(window as any).__sdk.players[0].emit('autoplay_failed'));await expect(page.getByRole('button',{name:'Tillåt ljud',exact:true})).toBeVisible();await page.getByRole('button',{name:'Tillåt ljud',exact:true}).click();await expect(page.getByRole('button',{name:'Tillåt ljud',exact:true})).toHaveCount(0);
 await page.evaluate(()=>(window as any).__sdk.players[0].emit('not_ready'));menu=await chooser(page);await expect(menu.locator('[data-connect-device="browser-2"]')).toHaveCount(0);await expect(page.locator('.browser-speaker-status')).toContainText('Återansluter');
});
test('old permissions request reauthorization without fetching SDK tokens or transferring music',async({page})=>{
 const mock=await setup(page,false);await page.goto('/music');await expect(page.locator('.embedded-music')).toContainText('Testmusik');await expect(page.getByRole('button',{name:'Godkänn webbläsaruppspelning'})).toBeVisible();expect(mock.commands).toHaveLength(0);expect(mock.tokenCalls).toBe(0);expect(await page.locator('script[src="https://sdk.scdn.co/spotify-player.js"]').count()).toBe(0);
});
test('viewer sees devices but cannot register or transfer on mobile',async({page})=>{
 const mock=await setup(page,true,false);await page.setViewportSize({width:390,height:844});await page.goto('/music?tab=devices');await expect(page.locator('.embedded-music')).toContainText('Testmusik');await expect(page.locator('input[name=q]')).toBeVisible();await expect(page.locator('[data-spotify=browser-retry]')).toHaveCount(0);const menu=await chooser(page);await expect(menu.locator('[data-connect-device="speaker-kitchen"]')).toBeDisabled();expect(mock.commands).toHaveLength(0);expect(mock.tokenCalls).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('accepted transfer keeps the previous device until Spotify confirms and reports missing acknowledgement',async({page})=>{
 await page.clock.install();const mock=await setup(page,true,true,false);await page.goto('/music');const menu=await chooser(page);await menu.locator('[data-connect-device="browser-1"]').click();await expect.poll(()=>mock.commands.length).toBe(1);await page.clock.runFor(12000);await expect(page.locator('.embedded-music')).toContainText('Spotify bekräftade inte enhetsbytet');await expect(page.locator('.music-player-output strong')).toHaveText('Kök');const retry=await chooser(page);await expect(retry.locator('[data-connect-device="browser-1"]')).toBeEnabled();await expect(retry.locator('[data-connect-device="speaker-kitchen"]')).toHaveAttribute('aria-checked','true');
});
test('failed first transfer leaves no selected device and first content can still target a ready browser',async({page})=>{
 await setup(page);let playing=false;const commands:any[]=[];
 await page.route('**/spotify-api/devices*',r=>r.fulfill({json:{devices:[]}}));
 await page.route('**/spotify-api/playback',r=>r.fulfill({json:{connected:true,playing,track:playing?{name:'Första låten',artist:'Mockartist',album:'Test',cover:'',durationMs:180000}:null,progressMs:0,device:playing?{id:'browser-1',name:'Hemstyrning · Webbläsare',volume_percent:35}:null}}));
 await page.route('**/spotify-api/search*',r=>r.fulfill({json:{tracks:[{uri:'spotify:track:testfirst',name:'Första låten',artist:'Mockartist',cover:''}]}}));
 await page.route('**/spotify-api/command',async r=>{const b=r.request().postDataJSON();commands.push(b);if(b.action==='transfer'){await r.fulfill({status:502,json:{message:'Spotify har ett tillfälligt serverfel (500).',spotifyError:{upstreamStatus:500}}});return;}if(b.action==='play_track')playing=true;await r.fulfill({json:{accepted:true}});});
 await page.goto('/control');await expect(page.locator('.compact-track h3')).toHaveText('Ingen låt spelas');const menu=await chooser(page);await menu.locator('[data-connect-device="browser-1"]').click();await expect(page.locator('.compact-feedback')).toContainText('serverfel');expect(commands).toHaveLength(1);await expect(page.locator('.compact-device-button strong')).toHaveText('Välj enhet');
 await page.locator('.app-sidebar nav a[href="/music"]').click();await page.locator('form[data-spotify-search] input').fill('Första');await page.locator('form[data-spotify-search] button').click();await page.locator('[data-spotify=play_track]').click();await expect(page.locator('.music-now h3')).toHaveText('Första låten');expect(commands[1]).toMatchObject({action:'play_track',deviceId:'browser-1',uri:'spotify:track:testfirst'});
});
test('device confirmation uses real active Connect status when playback omits its device',async({page})=>{
 await setup(page);let active=false;const commands:any[]=[];await page.route('**/spotify-api/playback',r=>r.fulfill({json:{connected:true,playing:false,track:{name:'Pausad låt',artist:'Mockartist',album:'Test',cover:'',durationMs:180000},progressMs:0,device:null}}));await page.route('**/spotify-api/devices*',r=>r.fulfill({json:{devices:[{id:'browser-1',name:'Hemstyrning · Webbläsare',type:'Computer',is_active:active,is_restricted:false,supports_volume:true,volume_percent:35}]}}));await page.route('**/spotify-api/command',r=>{const b=r.request().postDataJSON();commands.push(b);if(b.action==='transfer')active=true;return r.fulfill({json:{accepted:true}});});await page.goto('/music');const menu=await chooser(page);await menu.locator('[data-connect-device="browser-1"]').click();await expect(page.locator('.music-player-output strong')).toContainText('Hemstyrning');const confirmed=await chooser(page);await expect(confirmed.locator('[data-connect-device="browser-1"]')).toHaveAttribute('aria-checked','true');await expect(confirmed).toContainText('Aktiv');expect(commands).toHaveLength(1);
});