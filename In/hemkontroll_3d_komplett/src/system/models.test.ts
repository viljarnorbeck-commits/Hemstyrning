import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ModelManager, applyCalibration } from './models';
import type { ModelConfig, Season } from './types';
const calibration: ModelConfig = {url:'/models/test.glb',label:'Test',verified:true,position:[1,2,3],rotation:[-90,30,0],scale:1.5};
describe('independent season model roots', () => {
  it('switches four calibrated models without moving shared device coordinates', async () => {
    const scene = new THREE.Scene(), devices = new THREE.Group(), lamp = new THREE.Object3D();
    lamp.position.set(12,3,-9); devices.add(lamp); scene.add(devices);
    const loader = { loadAsync: vi.fn(async () => ({scene:new THREE.Group()})) };
    const manager = new ModelManager(loader as never); scene.add(manager.root);
    for (const [i,season] of (['summer','autumn','firstSnow','winter'] as Season[]).entries()) {
      await manager.select(season,{...calibration,url:`/models/${season}.glb`,position:[i*3,0,i],scale:1+i});
      expect(manager.active).toBe(season);
      expect(lamp.getWorldPosition(new THREE.Vector3()).toArray()).toEqual([12,3,-9]);
      expect(manager.root.children).toHaveLength(1);
    }
  });
  it('reuses the same large asset for reference slots and applies each calibration independently', async () => {
    const loader = {loadAsync:vi.fn(async()=>({scene:new THREE.Group()}))};
    const manager=new ModelManager(loader as never);
    await manager.select('summer',calibration);
    await manager.select('winter',{...calibration,scale:2,position:[8,0,0]});
    expect(loader.loadAsync).toHaveBeenCalledTimes(1);
    expect(manager.root.children[0].position.toArray()).toEqual([8,0,0]);
    expect(manager.root.children[0].scale.x).toBe(2);
  });
  it('ignores an obsolete load when a newer selection wins',async()=>{
    let finish!: (value: unknown)=>void;
    const loader={loadAsync:vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValue({scene:new THREE.Group()})};
    const manager=new ModelManager(loader as never);
    const older=manager.select('summer',calibration);
    await manager.select('winter',{...calibration,url:'/models/winter.glb'});
    finish({scene:new THREE.Group()}); await older;
    expect(manager.active).toBe('winter');
  });
});

it('keeps a Z-up ground plane horizontal when calibrating north', () => {
  const root = new THREE.Group();
  applyCalibration(root, {...calibration,rotation:[-90,20,0],scale:1});
  const up = new THREE.Vector3(0,0,1).transformDirection(root.matrixWorld);
  expect(up.y).toBeCloseTo(1); expect(up.x).toBeCloseTo(0); expect(up.z).toBeCloseTo(0);
});
it('uses an unsimplified reference only when requested, and neutral diagnostics restore original materials',async()=>{
 const root=new THREE.Group(),original=new THREE.MeshStandardMaterial({color:'#bf9065',vertexColors:true}),mesh=new THREE.Mesh(new THREE.BoxGeometry(),original);root.add(mesh);const loader={loadAsync:vi.fn(async(_url:string)=>({scene:root}))},manager=new ModelManager(loader as never);manager.reference=true;await manager.select('autumn',{...calibration,url:'/models/daniels.glb'});expect(loader.loadAsync.mock.calls[0][0]).toBe('/models/daniels-reference.glb');manager.setNeutral(true);expect(mesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);expect(mesh.material.color.getHex()).toBe(original.color.getHex());manager.setNeutral(false);expect(mesh.material).toBe(original);manager.dispose();
});
