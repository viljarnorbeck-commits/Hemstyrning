import {it,expect} from 'vitest';
import {freshYardWeather,yardWeatherAppearance} from './yard-weather';
import type {WeatherView} from './weather-source';

it.each([
 ['sunny','sunny'],['partlycloudy','partlycloudy'],['cloudy','cloudy'],['rainy','rain'],['pouring','rain'],['lightning-rainy','rain'],['snowy','snow'],['snowy-rainy','sleet'],['fog','fog'],['windy','windy'],['unknown','neutral'],['unavailable','neutral'],['','neutral'],['clear-night','clear-night'],
])('renders %s as %s without inventing a different weather type',(condition,kind)=>{const style=yardWeatherAppearance(condition,20);expect(style.kind).toBe(kind);expect(style.brightness).toBeGreaterThan(.9);expect(style.brightness).toBeLessThan(1.1);if(!['sunny','partlycloudy'].includes(condition))expect(style.sunlight).toBe(0);});
it('keeps partly cloudy nights cloudy and suppresses sun tint after sunset',()=>{expect(yardWeatherAppearance('partlycloudy',-12)).toMatchObject({kind:'partlycloudy',light:'night',sunlight:0});expect(yardWeatherAppearance('sunny',-12)).toMatchObject({kind:'clear-night',light:'night',sunlight:0});expect(yardWeatherAppearance('clear-night',25).sunlight).toBe(0);expect(yardWeatherAppearance('sunny',20).sunlight).toBe(1);expect(yardWeatherAppearance('partlycloudy',20).sunlight).toBe(.35);});
it('keeps twilight finite and separate from full day and night',()=>{expect(yardWeatherAppearance('cloudy',0).light).toBe('evening');expect(yardWeatherAppearance('',NaN)).toMatchObject({kind:'neutral',light:'night',sunlight:0});});
it('rejects unavailable, disconnected, future and stale HA weather while accepting last_reported',()=>{
 const now=Date.now(),view=(age:number,state='rainy',connected=true):WeatherView=>({connected,source:'ha',label:'HA',description:'Regn',state:{entity_id:'weather.home',state,attributes:{},last_updated:new Date(now-age).toISOString()}});
 expect(freshYardWeather(view(0),now)).toBe(true);expect(freshYardWeather(view(91*60000),now)).toBe(false);expect(freshYardWeather(view(-2*60000),now)).toBe(false);expect(freshYardWeather(view(0,'unknown'),now)).toBe(false);expect(freshYardWeather(view(0,'unavailable'),now)).toBe(false);expect(freshYardWeather(view(0,'rainy',false),now)).toBe(false);
 const reported=view(86400000);reported.state!.last_reported=new Date(now).toISOString();expect(freshYardWeather(reported,now)).toBe(true);
});
