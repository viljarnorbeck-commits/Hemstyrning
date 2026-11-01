import {it,expect} from 'vitest';
import {measurementHistoryPoints,historyAttributes} from './measurement-history-data';
import {configureSensorBindings} from './entity-bindings';
const row=(t:number,state:string,unit:string,simulated=false)=>({last_updated:new Date(t).toISOString(),state,attributes:{unit_of_measurement:unit,simulated}});
it('converts actual power and energy, keeps gaps and rejects unrelated units and out-of-period samples',()=>{
 expect(measurementHistoryPoints([row(1000,'2500','W'),row(2000,'unavailable','W'),row(3000,'8','kWh'),row(4000,'','W'),row(9000,'42','W')],'kW',0,5000)).toEqual([{t:1000,value:2.5},{t:2000,value:null},{t:3000,value:null},{t:4000,value:null}]);
 expect(measurementHistoryPoints([row(1000,'1500','Wh')],'kWh',0,5000)[0]?.value).toBe(1.5);
});
it('uses the same temperature correction for actual history and never applies it to simulated readings',()=>{
 const points=measurementHistoryPoints([row(1000,'4','°C'),row(2000,'4','°C',true)],'°C',0,5000,-.7);
 expect(points[0]?.value).toBeCloseTo(3.3);expect(points[1]?.value).toBe(4);
});
it('binds the history to the configured sensor and escapes labels instead of inventing a source',()=>{
 configureSensorBindings({sensorBindings:{'sensor.example':'sensor.replacement'}});
 expect(historyAttributes('sensor.example','kW','<El>')).toContain('data-measurement-history="sensor.replacement"');
 expect(historyAttributes('$unbound','SEK','Kostnad')).toContain('data-measurement-history=""');
 expect(historyAttributes('sensor.example','kW','<El>')).toContain('&lt;El&gt;');
 configureSensorBindings({});
});
