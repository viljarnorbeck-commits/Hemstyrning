import {it,expect} from 'vitest';
import {GestureGate,type SurfacePointer} from './surface-input';
const finger=(id=1,x=100,y=200,marker?:string):SurfacePointer=>({id,x,y,type:'touch',primary:id===1,button:0,marker});
it('classifies a stationary single touch and a close double tap without two activations',()=>{
 const g=new GestureGate();g.down(finger());expect(g.up(1,100,200,100)).toMatchObject({kind:'tap'});g.down(finger());expect(g.up(1,103,202,310)).toMatchObject({kind:'double'});
});
it('blocks the entire two-to-one finger sequence even when the remaining finger does not move',()=>{
 const g=new GestureGate();g.down(finger());g.down(finger(2));expect(g.up(1,100,200,100)).toBeNull();expect(g.up(2,100,200,110)).toBeNull();g.down(finger());expect(g.up(1,100,200,600)?.kind).toBe('tap');
});
it('rejects out-and-back drags, cancelled touches and non-primary mouse buttons',()=>{
 const g=new GestureGate();g.down(finger());g.move(1,145,200);g.move(1,100,200);expect(g.up(1,100,200,100)).toBeNull();g.down(finger());g.cancel(1);expect(g.up(1,100,200,200)).toBeNull();g.down({...finger(),type:'mouse',button:2});expect(g.up(1,100,200,300)).toBeNull();
});
it('keeps marker identity for valid taps and cancels it for multitouch',()=>{
 const g=new GestureGate();g.down(finger(1,100,200,'lamp'));expect(g.up(1,100,200,100)?.tap.marker).toBe('lamp');g.down(finger(1,100,200,'lamp'));g.down(finger(2));expect(g.up(1,100,200,200)).toBeNull();expect(g.up(2,100,200,210)).toBeNull();
});
