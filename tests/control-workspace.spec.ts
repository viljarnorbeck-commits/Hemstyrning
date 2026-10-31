import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';

test('discovered lamp requires persistence, then confirms switch and dimmer through the protected API',async({page,request})=>{
 const original=await request.get('/workspace-api/scene').then(r=>r.json());
 const lamp=original.objects.find((o:any)=>o.type==='light');
 try{
  await request.put('/workspace-api/scene',{data:{...original,objects:original.objects.filter((o:any)=>o.id!==lamp.id)}});
  await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
  const id='ha-'+lamp.entityId,card=page.locator(`#control-lights [data-card="${id}"]`);
  await card.locator('.device-select').click();await expect(page.locator('#control-details h1')).toHaveText(lamp.name);
  await expect(card.locator('[role=switch]')).toBeDisabled();
  expect((await request.post('/connection-api/light',{headers:{'X-Hemkontroll-Mode':'live'},data:{object_id:id,on:true}})).status()).toBe(403);
  await page.locator('[data-register]').click();await expect(page.locator('#control-error')).toContainText('koppling sparad');
  const saved=await request.get('/workspace-api/scene').then(r=>r.json());expect(saved.objects.find((o:any)=>o.id===id)).toMatchObject({entityId:lamp.entityId,placementConfirmed:false});
  const toggle=card.locator('[role=switch]'),before=await toggle.getAttribute('aria-checked');
  await expect(toggle).toBeEnabled();await toggle.click();await expect(toggle).toHaveAttribute('aria-checked',before==='true'?'false':'true');
  await expect(page.locator('#control-error')).toContainText('Bekräftat');await expect(toggle).toBeFocused();
  const slider=card.locator('[data-dim]');const box=(await slider.boundingBox())!;await slider.click({position:{x:box.width*.7,y:box.height/2}});
  await expect(page.locator('#control-error')).toContainText('Bekräftat');
  await expect.poll(async()=>{const s=await request.get('/dev-api/states').then(r=>r.json());return s.find((v:any)=>v.entity_id===lamp.entityId).attributes.brightness;}).toBeGreaterThan(100);
  await page.reload();await expect(page.locator('#control-status')).toContainText('Ansluten');await expect(card.locator('[role=switch]')).toBeEnabled();
  await page.route('**/connection-api/services/light/**',async route=>{await new Promise(r=>setTimeout(r,400));await route.continue();});
  await card.locator('[role=switch]').click();await expect(page.locator('#control-error')).toContainText('Väntar');
  const other=page.locator('#control-lights .device-select').first();await other.click();await expect(page.locator('#control-error')).toContainText('Bekräftat');
  await expect(other).toBeFocused(); // A late acknowledgement must not steal focus from the newly selected lamp.
 }finally{await request.put('/workspace-api/scene',{data:original});}
});

test('read-only source explains disabled controls without blocking selection or saving configuration',async({page})=>{
 let commands=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))commands++;});
 await page.route('**/connection-api/info',r=>r.fulfill({json:{mode:'home-assistant',commandsEnabled:false,controlBlockReason:'read-only'}}));
 await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
 await expect(page.locator('#control-permission')).toContainText('Skrivskyddad');
 await page.locator('#control-lights .device-select').first().click();await expect(page.locator('#control-details h1')).not.toHaveText('Välj en enhet.');
 for(const button of await page.locator('[role=switch]').all())await expect(button).toBeDisabled();
 for(const slider of await page.locator('#control-details input').all())await expect(slider).toBeDisabled();
 await page.getByRole('link',{name:'Om styrbehörighet'}).click();await expect(page.locator('#control-permissions')).toContainText('uttryckliga godkännande');expect(commands).toBe(0);
});

test('vertical lamps and navigation scroll by wheel and keyboard at low height; right controls scroll separately',async({page,request})=>{
 const original=await request.get('/workspace-api/scene').then(r=>r.json());
 try{
  const lamp=original.objects.find((o:any)=>o.type==='light');
  await request.put('/workspace-api/scene',{data:{...original,objects:[...original.objects,...Array.from({length:35},(_,i)=>({...lamp,id:'scroll-lamp-'+i,name:'Scrolllampa '+i,placementConfirmed:false}))]}});
  await page.setViewportSize({width:1280,height:600});await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
  const nav=page.getByRole('navigation',{name:'Huvudnavigation'});await nav.hover();await page.mouse.wheel(0,700);await expect.poll(()=>nav.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await nav.locator('a').last().focus();await expect(nav.locator('a').last()).toBeInViewport();
  const list=page.locator('#control-lights');await list.hover();await page.mouse.wheel(0,1800);await expect.poll(()=>list.evaluate(e=>e.scrollTop)).toBeGreaterThan(500);
  await list.focus();await page.keyboard.press('End');await expect.poll(()=>list.evaluate(e=>e.scrollTop)).toBeGreaterThan(1000);
  const last=list.locator('.device-select').last();await last.scrollIntoViewIfNeeded();await last.click();await expect(page.locator('#control-details h1')).toHaveText(await last.locator('b').innerText());
  const right=page.locator('.control-right');await right.focus();await page.keyboard.press('End');await expect.poll(()=>right.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{await request.put('/workspace-api/scene',{data:original});}
});

test('neutral theme, compact lamps and mobile page reachability at all requested sizes',async({page})=>{
 for(const [width,height]of[[1920,1080],[2560,1440],[1280,800],[1024,768],[800,1280],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
  await expect(page.locator('.control-page .music-widget')).toHaveCount(0);
  const card=page.locator('.lamp-card').first();await card.locator('.device-select').click();
  expect(await card.innerText()).not.toMatch(/Ej områdesplacerad|\bAV\b|\bPÅ\b/);
  expect(await card.evaluate(e=>e.getBoundingClientRect().height)).toBeLessThan(110);
  expect(await page.locator('.app-sidebar').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(25, 27, 31)');
  expect(await page.locator('.control-page').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(51, 52, 58)');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===390){await page.locator('#control-presets').scrollIntoViewIfNeeded();await expect(page.locator('#control-presets')).toBeInViewport();}
  await page.screenshot({path:`test-results/corrected-control-${width}x${height}.png`});
 }
});

test('technical overview is almost opaque neutral glass without removing the live scene',async({page})=>{
 await fixture(page);await page.goto('/');await expect(page.locator('.home-overview article')).toHaveCount(10);
 expect(await page.locator('.home-overview article').first().evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgba(30, 32, 36, 0.97)');
 await expect(page.locator('#garden')).toBeVisible();await page.screenshot({path:'test-results/corrected-home-desktop.png'});
});

test('every function page and settings can reach the final content with native page scrolling',async({page})=>{
 await page.setViewportSize({width:1024,height:600});
 for(const path of ['/energy','/cars','/climate','/lights','/mower','/security','/music','/settings']){
  await page.goto(path);await expect(page.locator('.nav-ha')).toHaveClass(/connected/);
  if(path==='/lights')continue; // Its two independent scroll regions are exercised above.
  const main=page.locator('main');await main.hover({position:{x:Math.min(400,(await main.boundingBox())!.width/2),y:100}});await page.mouse.wheel(0,12000);
  const end=main.locator(':scope > *').last();await end.scrollIntoViewIfNeeded();await expect(end).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
 }
});

test('right room lamp confirms two toggles and dimming in simulator',async({page,request})=>{
 await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
 const card=page.locator('#room-lights .lamp-card').first(),toggle=card.locator('[role=switch]');
 const before=await toggle.getAttribute('aria-checked');
 for(const expected of [before==='true'?'false':'true',before]){
  const command=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/connection-api/'));
  await toggle.click();expect((await command).ok()).toBe(true);await expect(toggle).toHaveAttribute('aria-checked',expected!);
  await expect(page.locator('#control-lights .lamp-card').first().locator('[role=switch]')).toHaveAttribute('aria-checked',expected!);
 }
 const slider=card.locator('[data-dim]'),box=(await slider.boundingBox())!;
 await slider.click({position:{x:box.width*.6,y:box.height/2}});await expect(page.locator('#control-error')).toContainText('Bekräftat');
 await expect(page.locator('#control-lights .lamp-card').first().locator('[data-dim]')).toHaveValue(await slider.inputValue());
});
