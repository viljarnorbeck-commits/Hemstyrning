export type SharedView = {mode:'HOME'} | {mode:'FOCUS_OBJECT'|'FOLLOW_OBJECT';objectId:string} | {mode:'FREE_3D'};
export type ViewerView = {mode:'VIEW_CAMERA'|'VIEW_MOWER_CAMERA';cameraRef:string};
export type ViewState = SharedView & {epoch:string;version:number;expiresAt:number|null;reason:'command'|'activity'|'timeout'|'invalid'};
