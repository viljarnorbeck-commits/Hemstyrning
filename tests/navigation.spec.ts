import{test,expect}from'@playwright/test';
test('shared navigation, lamp carousel and responsive pages',async({page})=>{
 await page.goto('/control');await expect(page.locator('#control-status')).toContainText('Ansluten');
 await expect(page.getByRole('navigation',{name:'Huvudnavigation'})).toBeVisible();
 await expect(page.locator('.control-page .music-widget')).toHaveCount(0);
 const track=page.locator('#control-lights');await expect(track.locator('.device-control')).toHaveCount(6);
 await track.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>track.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
 await track.evaluate(e=>e.scrollLeft=0);await track.hover();await page.mouse.wheel(0,300);await expect.poll(()=>track.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Föregående lampor'}).click();
 await track.locator('.device-select').first().click();await expect(page.locator('#control-details h1')).not.toHaveText('Välj en enhet.');
 for(const [name,width,height]of[['desktop',1440,1000],['tablet',900,1100],['mobile',390,844]]as const){await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/navigation-${name}.png`,fullPage:true});}
 await page.getByRole('button',{name:'Öppna meny'}).click();await expect(page.getByRole('navigation',{name:'Huvudnavigation'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('body')).not.toHaveClass(/nav-open/);
 for(const route of ['/energy','/cars','/climate','/lights','/mower','/security','/music','/settings']){await page.goto(route);await expect(page.locator('.app-sidebar a[aria-current]')).toHaveAttribute('href',route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});

test('lamp carousel supports native touch swipe',async({browser})=>{
 const context=await browser.newContext({viewport:{width:900,height:1100},hasTouch:true,isMobile:true});const page=await context.newPage();
 try{await page.goto('http://localhost:5173/control');await expect(page.locator('#control-status')).toContainText('Ansluten');const track=page.locator('#control-lights');await track.scrollIntoViewIfNeeded();const box=(await track.boundingBox())!;const cdp=await context.newCDPSession(page);const x=box.x+box.width*.8,y=box.y+80;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*35,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(()=>track.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);}finally{await context.close();}
});
