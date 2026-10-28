import {it,expect} from 'vitest';
import {YardRaster} from './yard-analysis.js';
import type {Point} from '../../../shared/yard-types.js';
function plane(r:YardRaster,x0:number,x1:number,z0:number,z1:number,y:number,slope=0){const a:Point=[x0,y,z0],b:Point=[x1,y+slope,z0],c:Point=[x1,y+slope,z1],d:Point=[x0,y,z1];r.triangle(a,b,c);r.triangle(a,c,d);}
it('separates a disconnected roof and vertical walls from connected sloping ground',()=>{const r=new YardRaster([0,0,0],[10,5,10],.5);plane(r,0,6,0,10,0,.8);plane(r,7,10,2,8,4);r.triangle([7,0,2],[7,4,2],[7,4,8]);const g=r.finish('scan');expect(g.kind[4*g.width+16]).toBe(2);expect(g.ground[4*g.width+16]).toBeNull();expect(g.ground[4*g.width+5]).toBeGreaterThan(0);expect(g.proposals.every(p=>p.status==='proposed')).toBe(true);});
it('retains holes as uncertain and conservatively bounds data size',()=>{const r=new YardRaster([0,0,0],[10,3,10]);plane(r,0,3,0,3,0);const g=r.finish('test');expect(g.kind[15*g.width+15]).toBe(0);expect(g.ground[15*g.width+15]).toBeNull();expect(g.proposals.some(p=>p.kind==='uncertain')).toBe(true);expect(g.width).toBeLessThanOrEqual(240);});
