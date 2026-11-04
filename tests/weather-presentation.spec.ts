import {test,expect} from './test';
import {fixture} from './fixtures';

test('yard photo follows simulator weather types including sleet and missing data without HA commands',async({page,request})=>{
 test.setTimeout(90000);
 await fixture(page);const info=await request.get('/connection-api/info').then(r=>r.json());expect(info.mode).toBe('simulator');
 let writes=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/connection-api/'))writes++;});
 await page.goto('/');await expect(page.locator('#connection-status')).toContainText('Ansluten');const stage=page.locator('.yard-photograph');
 try{for(const [state,kind]of [['sunny',/^(sunny|clear-night)$/],['partlycloudy','partlycloudy'],['cloudy','cloudy'],['rainy','rain'],['pouring','rain'],['snowy','snow'],['snowy-rainy','sleet'],['fog','fog'],['unknown','neutral'],['unavailable','neutral']] as const){
  expect((await request.post('/dev-api/states/weather.home',{data:{state,attributes:{simulated:true,temperature:4}}})).ok()).toBe(true);
  await expect(stage).toHaveAttribute('data-weather',kind);await expect(stage).toHaveAttribute('data-weather-source',['unknown','unavailable'].includes(state)?'unavailable':'simulator');
  const brightness=await stage.evaluate(el=>Number((el as HTMLElement).style.getPropertyValue('--photo-brightness')));
  expect(brightness).toBeGreaterThan(.65);expect(brightness).toBeLessThan(1.1);
  if(await stage.getAttribute('data-light')==='night')expect(brightness).toBeLessThan(.82);
  await page.screenshot({path:'.build-tools/weather-'+state+'.png',animations:'disabled'});
 }}finally{await request.delete('/dev-api/states/weather.home');}expect(writes).toBe(0);
});

test('outdoor temperature opens cached seven-day SMHI forecast on desktop tablet and phone',async({page})=>{
 await fixture(page);const now=Date.now(),today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),scene=await response.json();scene.weather={provider:'smhi',placeName:'Kyrkås, Östersund',latitude:63.215,longitude:14.85};await route.fulfill({json:scene});});
 await page.route('**/connection-api/info',route=>route.fulfill({json:{mode:'home-assistant',commandsEnabled:false}}));
 let weatherReads=0;
 await page.route('**/connection-api/weather',route=>{weatherReads++;return route.fulfill({json:{source:'smhi',available:true,placeName:'Kyrkås, Östersund',referenceTime:new Date(now).toISOString(),fetchedAt:new Date(now).toISOString(),validTime:new Date(now).toISOString(),condition:'rainy',description:'Regn',attributes:{temperature:4,forecast:true},days:Array.from({length:7},(_,i)=>({date:new Date(Date.parse(today+'T12:00Z')+i*86400000).toISOString().slice(0,10),min:i-3,max:i+2,windMax:4,condition:['rainy','snowy','cloudy','sunny','fog','snowy-rainy','partlycloudy'][i],description:'Prognos '+i,sampleCount:24,partial:i===0}))}});});
 await page.goto('/');await expect(page.locator('.yard-photograph')).toHaveAttribute('data-weather','rain');const before=weatherReads;
 await page.getByRole('button',{name:'Utetemperatur · visa veckoprognos'}).click();const dialog=page.locator('.week-forecast-dialog');await expect(dialog).toBeVisible();await expect(dialog.locator('.forecast-day')).toHaveCount(7);expect(weatherReads).toBe(before);await expect(dialog).not.toContainText('Hämtar');
 for(const [width,height]of [[1440,960],[900,1100],[390,844]]){await page.setViewportSize({width,height});const box=await dialog.boundingBox();expect(box!.width).toBeLessThan(width);expect(box!.height).toBeLessThan(height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'.build-tools/forecast-'+width+'.png',animations:'disabled'});}
 await page.mouse.click(2,2);await expect(dialog).not.toBeVisible();
});

test('SMHI sunshine follows the actual solar day and never creates sunlight at night',async({page})=>{
 await fixture(page);let instant=Date.parse('2026-06-21T12:00:00Z');
 await page.route('**/workspace-api/scene',async route=>{const response=await route.fetch(),scene=await response.json();scene.weather={provider:'smhi',placeName:'Kyrkås, Östersund',latitude:63.215,longitude:14.85};await route.fulfill({json:scene});});
 await page.route('**/connection-api/info',route=>route.fulfill({json:{mode:'home-assistant',commandsEnabled:false}}));
 await page.route('**/connection-api/weather',route=>route.fulfill({json:{source:'smhi',available:true,placeName:'Kyrkås, Östersund',referenceTime:new Date(instant).toISOString(),validTime:new Date(instant).toISOString(),fetchedAt:new Date(instant).toISOString(),condition:'sunny',description:'Klart',attributes:{temperature:5,forecast:true},days:[]}}));
 for(const [date,kind,light,sunlight]of [['2026-06-21T12:00:00Z','sunny','day',1],['2026-01-15T00:00:00Z','clear-night','night',0]]as const){instant=Date.parse(date);await page.clock.setFixedTime(new Date(instant));await page.goto('/?weather-review='+kind);const stage=page.locator('.yard-photograph');await expect(stage).toHaveAttribute('data-weather',kind);await expect(stage).toHaveAttribute('data-light',light);await expect(stage).toHaveAttribute('data-weather-source','smhi');expect(await stage.evaluate(el=>Number((el as HTMLElement).style.getPropertyValue('--photo-sunlight')))).toBe(sunlight);await page.screenshot({path:'.build-tools/weather-solar-'+light+'.png',animations:'disabled'});}
});
