export type Point=[number,number,number];
export interface YardGrid {version:1;key:string;createdAt:string;originX:number;originZ:number;cellSize:number;width:number;height:number;ground:(number|null)[];kind:number[];confidence:number[];fallbackHeight:number;bounds:{min:Point;max:Point};proposals:YardProposal[];notes:string[]}
export interface YardProposal {id:string;kind:'ground'|'obstacle'|'uncertain';confidence:number;points:Point[];status:'proposed'|'approved'|'rejected';zone?:string}
export interface RouteEdge {id:string;from:Point;to:Point;runs:number;confidence:number;lastSeen:number;activity:string;area:string;changed:boolean}
export interface LearnedGraph {referenceKey:string;builtAt:string;edges:RouteEdge[];samples:number;runs:number;source:string;stale?:boolean}
