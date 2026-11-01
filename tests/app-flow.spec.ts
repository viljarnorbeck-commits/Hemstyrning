import {test,expect} from './test';
import {fixture} from './fixtures';
test.beforeEach(async({page})=>{await fixture(page);await page.route('**/spotify-api/**',r=>r.fulfill({json:{configured:false,connected:false,canControl:false,message:'Simulerat test'}}));});
test('reselecting the current route preserves the view and filter while background 3D pauses and resumes',async({page})=>{
 await page.goto('/control');await expect(page.locator('.nav-ha')).toHaveClass(/connected/);
 await page.evaluate(()=>{(window as any).__flowRoot=document.querySelector('.control-page');});
 await page.getByRole('button',{name:'Sök bland enheter',exact:true}).click();await page.getByRole('searchbox',{name:'Sök i kontrollpanelens enhetslista'}).fill('testfilter');
 await page.getByRole('link',{name:'Kontrollpanel',exact:true}).click();
 expect(await page.evaluate(()=>document.querySelector('.control-page')===(window as any).__flowRoot)).toBe(true);
 await expect(page.locator('#control-search')).toHaveValue('testfilter');
 await page.getByRole('link',{name:'Hem',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-app-route','/');
 await expect.poll(async()=>Number(await page.locator('#garden').getAttribute('data-render-frames'))).toBeGreaterThan(2);
 await page.getByRole('link',{name:'Kontrollpanel',exact:true}).click();await expect(page.locator('body')).toHaveAttribute('data-app-route','/control');
 await page.waitForTimeout(250);const frames=await page.locator('#garden').getAttribute('data-render-frames');await page.waitForTimeout(400);expect(await page.locator('#garden').getAttribute('data-render-frames')).toBe(frames);
});
test('persisted page lifecycle reconnects without replacing the document or destroying 3D',async({page})=>{
 await page.goto('/');await expect(page.locator('.nav-ha')).toHaveClass(/connected/);
 await page.evaluate(()=>{(window as any).__retainedCanvas=document.querySelector('#garden');window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
 await expect(page.locator('.nav-ha')).toHaveClass(/connected/);
 expect(await page.evaluate(()=>document.querySelector('#garden')===(window as any).__retainedCanvas)).toBe(true);
 const before=await page.locator('#garden').getAttribute('data-render-frames');await expect.poll(()=>page.locator('#garden').getAttribute('data-render-frames')).not.toBe(before);
});
