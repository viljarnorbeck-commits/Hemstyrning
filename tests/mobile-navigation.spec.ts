import {test,expect,type Page,type CDPSession} from '@playwright/test';
import {fixture} from './fixtures';

async function setup(page:Page,objects=false){
 await fixture(page);
 await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),config=await response.json();config.quality='low';config.sky.mode='procedural';config.panoramas=[];
 for(const model of Object.values(config.models) as any[])Object.assign(model,{url:'/models/daniels.glb',position:[0,0,0],rotation:[-90,0,0],scale:1});
 if(!objects)config.objects=[];else{const lamp=config.objects.find((o:any)=>o.type==='light');lamp.position=[0,4,0];config.objects=[lamp];}
 await route.fulfill({json:config});});
 await page.goto('/');await expect(page.locator('#connection-status')).toHaveText('Ansluten');await expect(page.locator('#model-status')).toBeHidden();await expect(page.locator('#garden')).toHaveAttribute('data-camera-target',/^\[/);
}
async function state(page:Page){return page.locator('#garden').evaluate(el=>{const c=el as HTMLElement;return{position:JSON.parse(c.dataset.cameraPosition!),target:JSON.parse(c.dataset.cameraTarget!),distance:Number(c.dataset.cameraDistance),mode:c.dataset.navigationMode,following:c.dataset.following};});}
const difference=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
const touch=(id:number,x:number,y:number)=>({id,x,y,radiusX:2,radiusY:2,force:1});
async function gesture(cdp:CDPSession,points:{id:number;x:number;y:number}[][]){
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points[0]});
 for(const touchPoints of points.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}

test('compact desktop status, flowing Spotify/calendar and hidden but usable control scrollbars',async({page})=>{
 await setup(page,true);
 const strip=await page.locator('.home-status-strip').boundingBox();expect(strip!.width).toBeLessThanOrEqual(850);expect(strip!.width).toBeLessThan(1200);expect(strip!.x).toBeLessThan(40);
 const music=page.locator('.music-widget'),calendar=page.locator('.right-calendar');let m=await music.boundingBox(),c=await calendar.boundingBox();expect(c!.y-m!.y-m!.height).toBeCloseTo(12,0);
 await music.evaluate(el=>(el as HTMLElement).style.minHeight='430px');m=await music.boundingBox();c=await calendar.boundingBox();expect(c!.y-m!.y-m!.height).toBeCloseTo(12,0);await music.evaluate(el=>(el as HTMLElement).style.minHeight='');
 await expect(page.locator('.calendar-today')).not.toBeEmpty();await page.locator('.home-right [data-calendar="more"]').click();await expect(page.locator('.home-right [data-calendar="more"]')).toHaveAttribute('aria-expanded','true');await page.locator('.home-right [data-calendar="open"]').click();await expect(page.locator('.calendar-panel')).toBeVisible();await page.locator('[data-close-calendar]').click();
 const style=await page.locator('.home-quick-controls').evaluate(el=>({scrollbar:getComputedStyle(el).scrollbarWidth,webkit:getComputedStyle(el,'::-webkit-scrollbar').display,overflow:getComputedStyle(el).overflowY}));expect(style).toMatchObject({scrollbar:'none',webkit:'none',overflow:'auto'});
 // Use the actual configured device list for scroll verification in the next navigation.
 await page.unroute('**/workspace-api/scene');await page.reload();await expect(page.locator('#connection-status')).toHaveText('Ansluten');
 const controls=page.locator('.home-quick-controls');await controls.evaluate(el=>{(el as HTMLElement).style.bottom='430px';el.scrollTop=0;});await controls.hover();await page.mouse.wheel(0,450);await expect.poll(()=>controls.evaluate(el=>el.scrollTop)).toBeGreaterThan(20);await controls.focus();await page.keyboard.press('Home');await page.keyboard.press('PageDown');await expect.poll(()=>controls.evaluate(el=>el.scrollTop)).toBeGreaterThan(20);
 await page.screenshot({path:'/tmp/hemkontroll-layout-compact.png'});
});

for(const [name,width,height] of [['iPhone',390,844],['Android',412,915],['Tablet',820,1180],['Landscape',844,390]] as const){
 test(`${name} compact music, status, camera tools and direct calendar stay within the viewport`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});const page=await context.newPage();
 try{await setup(page);for(const selector of ['.home-status-strip','.music-widget','.mobile-home-nav','#camera-mode','#clean-view']){const box=await page.locator(selector).boundingBox();expect(box,selector).not.toBeNull();expect(box!.x,selector).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width,selector).toBeLessThanOrEqual(width+1);expect(box!.y,selector).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height,selector).toBeLessThanOrEqual(height+1);}
  expect((await page.locator('.home-status-strip').boundingBox())!.width).toBeLessThan(width-35);
  const cover=await page.locator('.music-widget').boundingBox(),mode=await page.locator('#camera-mode').boundingBox(),full=await page.locator('#clean-view').boundingBox();expect(mode!.y+mode!.height).toBeLessThanOrEqual(cover!.y);expect(full!.y+full!.height).toBeLessThanOrEqual(cover!.y);
  await page.locator('.mobile-home-nav [data-view="calendar"]').tap();await expect(page.locator('.calendar-panel')).toBeVisible();await page.locator('[data-close-calendar]').tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`/tmp/hemkontroll-layout-${name}.png`});
 }finally{await context.close();}
 });
}

test('native Chromium touch rotates, pans, pinches, focuses and switches one-handed camera mode',async({browser})=>{
 test.setTimeout(180000);const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();
 try{await setup(page);const cdp=await context.newCDPSession(page);const initial=await state(page);
  await gesture(cdp,[[touch(1,140,310)],[touch(1,170,320)],[touch(1,210,340)]]);await expect.poll(async()=>difference((await state(page)).position,initial.position)).toBeGreaterThan(2);
  await page.locator('#reset-button').tap();await page.waitForTimeout(350);const beforePan=await state(page);
  await gesture(cdp,[[touch(1,135,310),touch(2,235,310)],[touch(1,150,325),touch(2,250,325)],[touch(1,170,345),touch(2,270,345)]]);await expect.poll(async()=>difference((await state(page)).target,beforePan.target)).toBeGreaterThan(.5);
  const beforePinch=await state(page);await gesture(cdp,[[touch(1,145,340),touch(2,245,340)],[touch(1,125,340),touch(2,265,340)],[touch(1,95,340),touch(2,295,340)]]);await expect.poll(async()=>(await state(page)).distance).toBeLessThan(beforePinch.distance*.85);
  await page.locator('#reset-button').tap();await page.waitForTimeout(400);const beforeFocus=await state(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,265,435)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,265,435)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(async()=>difference((await state(page)).target,beforeFocus.target)).toBeGreaterThan(1);
  await page.locator('#camera-mode').tap();await expect(page.locator('#garden')).toHaveAttribute('data-navigation-mode','pan');const panMode=await state(page);await gesture(cdp,[[touch(1,130,330)],[touch(1,170,350)],[touch(1,220,360)]]);await expect.poll(async()=>difference((await state(page)).target,panMode.target)).toBeGreaterThan(.5);
  const current=await state(page);expect(current.position[1]).toBeGreaterThan(.8);expect(Math.hypot(current.target[0],current.target[2])).toBeLessThan(45);
  // Adding/removing a finger resets the native controls' baseline, not the camera.
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,150,330)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,165,335)]});const one=await state(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,165,335),touch(2,260,350)]});const two=await state(page);expect(difference(one.position,two.position)).toBeLessThan(3);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[touch(2,260,350)]});const remaining=await state(page);expect(difference(two.position,remaining.position)).toBeLessThan(3);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }finally{await context.close();}
});

test('touch on a lamp activates once; marker drags, pinches and double taps never send a service command',async({browser})=>{
 test.setTimeout(180000);const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();let commands=0;
 await page.route('**/connection-api/services/light/*',route=>{commands++;return route.fulfill({status:503,json:{message:'Test · ingen utrustning styrs'}});});
 try{await setup(page,true);const marker=page.locator('.device-marker').first(),cdp=await context.newCDPSession(page);await expect(marker).toBeVisible();await marker.tap();await expect.poll(()=>commands).toBe(1);await expect(marker).not.toHaveAttribute('aria-busy','true');
  let box=await marker.boundingBox(),x=box!.x+box!.width/2,y=box!.y+box!.height/2;const camera=await state(page);await gesture(cdp,[[touch(1,x,y)],[touch(1,x+30,y+10)],[touch(1,x+65,y+20)]]);await expect.poll(async()=>difference((await state(page)).position,camera.position)).toBeGreaterThan(1);await page.waitForTimeout(400);expect(commands).toBe(1);
  await page.locator('#reset-button').tap();await page.waitForTimeout(400);box=await marker.boundingBox();x=box!.x+box!.width/2;y=box!.y+box!.height/2;
  await gesture(cdp,[[touch(1,x,y),touch(2,x+65,y)],[touch(1,x-15,y),touch(2,x+85,y)]]);await page.waitForTimeout(400);expect(commands).toBe(1);
  await page.locator('#reset-button').tap();await page.waitForTimeout(400);box=await marker.boundingBox();x=box!.x+box!.width/2;y=box!.y+box!.height/2;
  for(let i=0;i<2;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,x,y)]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}await page.waitForTimeout(500);expect(commands).toBe(1);
 }finally{await context.close();}
});

test('manual touch navigation exits LUBA follow mode and camera clearance survives close zoom',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();
 try{await fixture(page);await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),config=await response.json();config.quality='low';config.sky.mode='procedural';config.panoramas=[];for(const m of Object.values(config.models) as any[])Object.assign(m,{url:'/models/daniels.glb',position:[0,0,0],rotation:[-90,0,0],scale:1});await route.fulfill({json:config});});await page.goto('/');await expect(page.locator('#connection-status')).toHaveText('Ansluten');await expect(page.locator('#model-status')).toBeHidden();
  await page.locator('.mobile-home-nav [data-view="home"]').tap();await page.locator('#home-dashboard [data-follow]').first().tap();await expect.poll(async()=>(await state(page)).following).not.toBe('');const cdp=await context.newCDPSession(page);
  await gesture(cdp,[[touch(1,160,310)],[touch(1,190,330)],[touch(1,230,350)]]);await expect.poll(async()=>(await state(page)).following).toBe('');
  await page.locator('#reset-button').tap();await gesture(cdp,[[touch(1,195,500)],[touch(1,195,320)],[touch(1,195,160)]]);await page.mouse.move(195,370);const beforeZoom=(await state(page)).distance;for(let i=0;i<10;i++)await page.mouse.wheel(0,-1000);
  // Clearance may legitimately stop the camera before OrbitControls.minDistance.
  await expect.poll(async()=>(await state(page)).distance).toBeLessThan(beforeZoom*.4);expect((await state(page)).position[1]).toBeGreaterThanOrEqual(.89);
 }finally{await context.close();}
});

test('a native mobile swipe scrolls the dashboard with invisible scrollbars while 3D stays paused',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();
 try{await setup(page);await page.locator('.mobile-home-nav [data-view="home"]').tap();const frames=await page.locator('#garden').getAttribute('data-render-frames'),cdp=await context.newCDPSession(page);
  await gesture(cdp,[[touch(1,300,680)],[touch(1,300,580)],[touch(1,300,480)],[touch(1,300,350)]]);
  await expect.poll(()=>page.locator('#home-dashboard').evaluate(el=>el.scrollTop)).toBeGreaterThan(40);expect(await page.locator('#garden').getAttribute('data-render-frames')).toBe(frames);expect(await page.locator('#home-dashboard').evaluate(el=>getComputedStyle(el).scrollbarWidth)).toBe('none');
 }finally{await context.close();}
});
