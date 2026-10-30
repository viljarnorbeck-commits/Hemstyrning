import {test,expect} from '@playwright/test';
import {fixture} from './fixtures';
import sharp from 'sharp';
import jsQR from 'jsqr';
let original:any,settings:any,player:string,cars:any[];
test.beforeEach(async({page,request})=>{
 await fixture(page);
 original=await request.get('/workspace-api/scene').then(r=>r.json());settings=await request.get('/dev-api/settings').then(r=>r.json());
 const states=await request.get('/dev-api/states').then(r=>r.json());player=states.find((s:any)=>s.entity_id.startsWith('media_player.')&&s.attributes.app_id==='spotify').entity_id;
 const config=structuredClone(original),base=config.objects.find((o:any)=>o.type==='car')??config.objects[0];
 cars=states.filter((s:any)=>s.attributes.command_entities?.climate).map((s:any,i:number)=>({...base,id:'ui-car-'+i,type:'car',name:'Bil '+(i+1),entityId:s.entity_id,bindings:{climate:s.attributes.command_entities.climate,charging:s.attributes.command_entities.charging},presence:'home'}));
 config.objects=config.objects.filter((o:any)=>o.type!=='car').concat(cars);config.music={entities:[player],activeEntity:player,jamUrl:'',jamSavedAt:''};
 config.quality='low';config.sky.mode='procedural';config.panoramas=[];
 await request.put('/workspace-api/scene',{data:config});await request.post('/dev-api/states/'+player,{data:{state:'paused',attributes:{supported_features:16384|1|32|16|4|2048,media_title:'Ljus över gården',media_artist:'Hemkontroll · testartist',media_album_name:'Nordiska rum · simulator',media_duration:214,media_position:32,entity_picture:'/textures/music/dawn.svg',source:'Vardagsrum',source_list:['Vardagsrum','Kök','Mobil']}}});
});
test.afterEach(async({request})=>{await request.put('/workspace-api/scene',{data:original});await request.put('/dev-api/settings',{data:settings.settings});await request.delete('/dev-api/states/'+player);await request.post('/dev-api/services/media_player/media_pause',{data:{entity_id:player}});});
async function open(page:any){await page.goto('/?view=3d');await expect(page.locator('#connection-status')).toHaveText('Ansluten');await expect(page.locator('#model-status')).toBeHidden();}

test('desktop direct controls confirm each car, all lights and robot commands independently',async({page,request})=>{
 await open(page);const left=page.locator('.home-quick-controls');
 const lamps=original.objects.filter((o:any)=>o.type==='light'&&o.entityId.startsWith('light.'));
 for(const l of lamps)await request.post('/dev-api/services/light/turn_off',{data:{entity_id:l.entityId}});
 await left.getByRole('button',{name:/Tänd alla/}).click();await expect(left.getByRole('button',{name:/Släck alla/})).toBeEnabled();await left.getByRole('button',{name:/Släck alla/}).click();await expect(left.getByRole('button',{name:/Tänd alla/})).toBeEnabled();
 for(const car of cars)await request.post('/dev-api/services/climate/turn_off',{data:{entity_id:car.bindings.climate}});
 for(const car of cars){const card=left.locator(`[data-device="${car.id}"]`);await card.getByRole('button',{name:'Starta värme'}).click();await expect(card.getByRole('button',{name:'Stoppa värme'})).toBeEnabled();}
 for(const car of cars){expect((await request.get('/dev-api/states').then(r=>r.json())).find((s:any)=>s.entity_id===car.bindings.climate).state).toBe('heat');}
 for(const section of ['mower','vacuum']){const card=left.locator(`[data-section="${section}"]`);await card.getByRole('button',{name:'Starta',exact:true}).click();await expect(card.getByRole('button',{name:'Pausa',exact:true})).toBeEnabled();await card.getByRole('button',{name:'Pausa',exact:true}).click();await card.getByRole('button',{name:'Återvänd',exact:true}).click();}
 await page.screenshot({path:'/tmp/hemkontroll-controls-desktop.png'});
});

test('Spotify now playing, sources, volume, missing music, unsupported and unavailable states',async({page,request})=>{
 await open(page);await expect(page.locator('.music-widget')).toContainText('Ljus över gården');await page.locator('.music-open').click();const modal=page.locator('dialog.music-panel');
 await expect(modal).toContainText('Pausad');await modal.getByRole('button',{name:'Spela musik',exact:true}).click();await expect(modal.locator('.playback-state')).toHaveText('Spelar');
 await modal.locator('#music-source').selectOption('Kök');await expect(modal.locator('#music-source')).toHaveValue('Kök');await expect(modal.locator('#music-volume')).toBeEnabled();
 await modal.locator('#music-volume').fill('63');await modal.locator('#music-volume').dispatchEvent('change');await expect.poll(async()=>Number((await request.get('/dev-api/states').then(r=>r.json())).find((s:any)=>s.entity_id===player).attributes.volume_level),{timeout:15000}).toBeCloseTo(.63,2);
 await expect(modal.getByRole('button',{name:'Nästa låt'})).toBeEnabled();await modal.getByRole('button',{name:'Nästa låt'}).click();await expect(modal).toContainText('Kväll vid havet');await modal.getByRole('button',{name:'Föregående låt'}).click();await expect(modal).toContainText('Ljus över gården');
 await request.post('/dev-api/states/'+player,{data:{state:'idle',attributes:{media_title:null,media_artist:null,media_album_name:null,entity_picture:null,media_position:null,media_duration:null}}});await expect(modal).toContainText('Ingen musik spelas');
 await request.post('/dev-api/states/'+player,{data:{state:'paused',attributes:{supported_features:0}}});await expect(modal.getByRole('button',{name:'Spela musik'})).toBeDisabled();
 await request.post('/dev-api/states/'+player,{data:{state:'unavailable'}});await expect(modal).toContainText('Otillgänglig');await expect(modal.locator('#music-source')).toBeDisabled();await expect(modal.locator('#music-volume')).toBeDisabled();
});

test('Jam uses a saved invitation, rejects track URLs, removes links and labels demo QR',async({page})=>{
 await open(page);await page.locator('.music-open').click();const modal=page.locator('dialog.music-panel');await expect(modal).toContainText('Ingen Jam-inbjudningslänk');
 await modal.getByRole('button',{name:'Visa Jam QR-kod'}).click();await expect(page.locator('#toast')).toContainText('Ingen giltig Jam');
 await modal.locator('summary').click();await modal.locator('#jam-url').fill('https://open.spotify.com/track/1234567890');await modal.getByRole('button',{name:'Spara musikinställningar'}).click();await expect(page.locator('#toast')).toContainText('inte en låt');
 await modal.locator('#jam-url').fill('https://open.spotify.com/socialsession/TESTONLY0123456789?si=test');await modal.getByRole('button',{name:'Spara musikinställningar'}).click();await expect(modal).toContainText('Sessionens status kan inte verifieras');await modal.getByRole('button',{name:'Visa Jam QR-kod'}).click();await expect(modal.locator('.jam-qr img')).toHaveAttribute('src',/^data:image\/png;base64,/);
 const png=Buffer.from((await modal.locator('.jam-qr img').getAttribute('src'))!.split(',')[1],'base64'),decoded=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});expect(jsQR(new Uint8ClampedArray(decoded.data),decoded.info.width,decoded.info.height)?.data).toBe('https://open.spotify.com/socialsession/TESTONLY0123456789?si=test');
 await modal.getByRole('button',{name:'Demonstrera QR',exact:false}).click();await expect(modal.locator('figcaption')).toContainText('Ingen riktig Spotify Jam');
 await modal.locator('summary').click();await modal.getByRole('button',{name:'Ta bort Jam-länk'}).click();await expect(modal).toContainText('Ingen Jam-inbjudningslänk');
});

test('list mode stops the animation loop, preserves camera and clean fullscreen restores UI',async({page})=>{
 await open(page);await page.locator('#list-button').click();await expect(page.locator('#home-dashboard')).toBeVisible();await expect(page.locator('#garden')).toBeHidden();
 for(const title of ['Belysning','Bilar','Gräsklippare','Robotdammsugare','Elförbrukning','Solpaneler','Väder','Spotify','Kalender'])await expect(page.locator('#home-dashboard').getByRole('heading',{name:title,exact:true})).toBeVisible();
 const frames=await page.locator('#garden').getAttribute('data-render-frames'),camera=await page.locator('#garden').getAttribute('data-camera');await page.waitForTimeout(1200);expect(await page.locator('#garden').getAttribute('data-render-frames')).toBe(frames);
 await page.locator('#list-button').click();await expect(page.locator('#garden')).toBeVisible();expect(await page.locator('#garden').getAttribute('data-camera')).toBe(camera);await expect.poll(()=>page.locator('#garden').getAttribute('data-render-frames')).not.toBe(frames);
 await page.locator('#clean-view').click();await expect(page.locator('.music-widget')).toBeHidden();await expect(page.locator('.home-status-strip')).toBeHidden();await expect(page.locator('.home-quick-controls')).toBeHidden();await page.getByRole('button',{name:'Återgå till normalläge',exact:true}).click();await expect(page.locator('.music-widget')).toBeVisible();await expect(page.locator('.home-quick-controls')).toBeVisible();
});

test('mobile portrait and landscape provide bottom navigation and scrollable dashboard without overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await expect(page.locator('.home-quick-controls')).toBeHidden();await expect(page.locator('.music-widget')).toBeVisible();await page.locator('.mobile-home-nav [data-view="music"]').click();await expect(page.locator('dialog.music-panel')).toBeVisible();await page.getByRole('button',{name:'Stäng musik',exact:true}).click();
 await page.locator('#list-button').click();await expect(page.locator('#home-dashboard')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/hemkontroll-home-mobile.png'});
 await page.setViewportSize({width:844,height:390});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('.mobile-home-nav [data-view="3d"]').click();await expect(page.locator('#garden')).toBeVisible();await page.locator('#clean-view').click();await expect(page.locator('.mobile-home-nav')).toBeHidden();await page.getByRole('button',{name:'Återgå till normalläge',exact:true}).click();await expect(page.locator('.mobile-home-nav')).toBeVisible();
});
