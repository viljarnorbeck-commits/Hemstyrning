export interface GeoPoint {latitude:number;longitude:number;altitude?:number}
export function geographicToLocal(p:GeoPoint,origin:GeoPoint,northOffset?:number):[number,number,number];
export function localToGeographic(p:[number,number,number],origin:GeoPoint,northOffset?:number):GeoPoint;
