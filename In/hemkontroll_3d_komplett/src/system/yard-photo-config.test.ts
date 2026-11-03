import{it,expect}from'vitest';
import{yardPhotoView,yardPhotoGround,yardPhoto}from'./yard-photo-config';
import type{ModelConfig}from'./types';
const model:ModelConfig={url:'/workspace-api/models/'+ '0'.repeat(64)+'.glb',label:'Gården',verified:false,position:[1.82,.5,-4.36],rotation:[0,0,0],scale:1};
it('keeps the photographed camera in the producer frame when the display placement changes',()=>{const a=yardPhotoView(model),b=yardPhotoView({...model,position:[11.82,2.5,-.36]});for(let i=0;i<3;i++){expect(b.position[i]-a.position[i]).toBeCloseTo([10,2,4][i]!);expect(b.target[i]-a.target[i]).toBeCloseTo([10,2,4][i]!);}expect(b.fov).toBe(a.fov);});
it('uses the approximate near-house ground rather than treating the roof as camera ground',()=>{expect(yardPhotoGround(model)).toBeCloseTo(.374213);expect(yardPhotoGround({...model,scale:2})).toBeCloseTo(.248426);expect(yardPhoto.holdoutRmsAt1600).toBeGreaterThan(yardPhoto.fitRmsAt1600);});
