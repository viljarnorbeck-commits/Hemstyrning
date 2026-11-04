import type {HistoryPoint} from './function-data';

export type HistorySnapshot={rows:HistoryPoint[];start:number;end:number};
/** Shared by background history loading, the dialog and home-card availability. */
export const measurementHistoryCache=new Map<string,HistorySnapshot>();
