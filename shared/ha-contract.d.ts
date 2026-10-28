export interface StateLike {state:string;attributes:Record<string,unknown>}
export const MEDIA_FEATURES:Readonly<Record<string,number>>;
export function available(state:StateLike|undefined):boolean;
export function mediaSupports(state:StateLike|undefined,service:string):boolean;
export function robotSupports(state:StateLike|undefined,action:string):boolean;
export function canonicalJamUrl(input:unknown):string|null;
export function spotifyShortUrl(input:unknown):string|null;
