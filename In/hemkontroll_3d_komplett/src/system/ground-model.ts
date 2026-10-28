import type {YardGrid} from '../../../../shared/yard-types';
import type {SceneObject} from './types';
import {groundSurface} from './navigation';
export function gridGround(grid:YardGrid|undefined,x:number,z:number){if(!grid)return null;const col=Math.floor((x-grid.originX)/grid.cellSize),row=Math.floor((z-grid.originZ)/grid.cellSize);if(col<0||row<0||col>=grid.width||row>=grid.height)return null;const i=row*grid.width+col;return grid.kind[i]===1?grid.ground[i]??null:null;}
/** Never raycast the photographic mesh: a roof is not a ground measurement. */
export function cameraFloor(x:number,z:number,zones:SceneObject[],grid:YardGrid|undefined,fallback:number){return groundSurface(x,z,zones)?.height??gridGround(grid,x,z)??grid?.fallbackHeight??fallback;}
export function constrainGroundCamera(position:{x:number;y:number;z:number},target:{x:number;y:number;z:number},height:(x:number,z:number)=>number){
 const floor=height(position.x,position.z),focus=height(target.x,target.z);target.y=Math.max(target.y,focus+.15);position.y=Math.max(position.y,floor+.9,target.y+.1);
}
