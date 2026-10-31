import {test,expect} from '@playwright/test';
test('shared navigation, vertical lamp list, horizontal detail rows and responsive pages',async({page})=>{
 await page.setViewportSize({width:1440,height:600});await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
 await expect(page.getByRole('navigation',{name:'Huvudnavigation'})).toBeVisible();
 await expect(page.locator('.control-page .music-widget')).toHaveCount(0);
 const list=page.locator('#control-lights');expect(await list.locator('.device-control').count()).toBeGreaterThanOrEqual(6);
 await list.focus();await page.keyboard.press('End');await expect.poll(()=>list.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 await list.evaluate(e=>e.scrollTop=0);await list.hover();await page.mouse.wheel(0,300);await expect.poll(()=>list.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 await list.locator('.device-select').first().click();await expect(page.locator('#control-details h1')).not.toHaveText('Välj en enhet.');
 for(const [name,width,height]of[['desktop',1440,1000],['tablet',900,1100],['mobile',390,844]]as const){await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/navigation-${name}.png`});}
 await page.getByRole('button',{name:'Öppna meny'}).click();await expect(page.getByRole('navigation',{name:'Huvudnavigation'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('body')).not.toHaveClass(/nav-open/);
 for(const route of ['/energy','/cars','/climate','/lights','/mower','/security','/music','/settings']){await page.goto(route);await expect(page.locator('.app-sidebar a[aria-current]')).toHaveAttribute('href',route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('vertical lamp list supports native touch swipe',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true}),page=await context.newPage();
 try{
  await page.route('**/workspace-api/scene',async r=>{const c=await(await r.fetch()).json(),lamp=c.objects.find((o:any)=>o.type==='light');c.objects.push(...Array.from({length:25},(_,i)=>({...lamp,id:'touch-light-'+i,name:'Touchlampa '+i,placementConfirmed:false})));await r.fulfill({json:c});});
  await page.goto('http://localhost:5173/control');await expect(page.locator('#control-status')).toContainText('Ansluten');const list=page.locator('#control-lights'),box=(await list.boundingBox())!,cdp=await context.newCDPSession(page),x=box.x+box.width*.5,y=box.y+Math.min(box.height-30,340);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*28}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>list.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 }finally{await context.close();}
});
