import {test,expect} from '@playwright/test';
test('ambient cards preserve animation and focus through confirmed commands',async({page,request})=>{
 const original=await request.get('/workspace-api/scene').then(r=>r.json());
 try{
  const config=structuredClone(original);config.presets=[{id:'halloween',name:'Halloween',icon:'🎃',color:'#ff8400',description:'Simulerad stämning',entityId:'script.halloween',canStop:true,hidden:false}];
  await request.put('/workspace-api/scene',{data:config});await page.goto('/control');
  await expect(page.locator('#control-status')).toContainText('Ansluten');
  const toggle=page.locator('#control-lights [data-action="toggle"]').first();
  await expect(toggle).toBeEnabled();
  const before=await toggle.getAttribute('aria-checked');
  await page.evaluate(()=>{const card=document.querySelector('.device-control')!;(window as any).card=card;(window as any).animation=card.getAnimations({subtree:true}).find(a=>(a as CSSAnimation).animationName==='card-drift');});
  await toggle.click();await expect(toggle).toHaveAttribute('aria-checked',before==='true'?'false':'true');
  await expect(page.locator('#control-error')).toContainText('Bekräftat');
  expect(await page.evaluate(()=>document.querySelector('.device-control')===(window as any).card)).toBe(true);
  expect(await page.evaluate(()=>document.querySelector('.device-control')!.getAnimations({subtree:true}).find(a=>(a as CSSAnimation).animationName==='card-drift')===(window as any).animation)).toBe(true);
  await page.locator('[data-preset="halloween"]').click();await expect(page.locator('[data-stop="true"]')).toBeVisible();await page.locator('[data-stop="true"]').click();await expect(page.locator('[data-stop="true"]')).toHaveCount(0);
  for(const [name,width,height] of [['desktop',1440,1000],['tablet',900,1100],['mobile',390,844]] as const){
   await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await page.locator('.device-control').first().evaluate(e=>e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(60);
   await page.screenshot({path:`test-results/control-${name}.png`,fullPage:true});
  }
  await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('.device-control').first().evaluate(e=>getComputedStyle(e,'::before').animationName)).toBe('none');
 }finally{await request.put('/workspace-api/scene',{data:original});}
});
