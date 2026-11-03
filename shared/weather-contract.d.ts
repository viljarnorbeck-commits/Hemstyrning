export interface SmhiDayForecast {
  date:string;min:number|null;max:number|null;windMax:number|null;
  condition?:string;description?:string;sampleCount:number;partial:boolean;
}
/** A SMHI forecast, never an observed Home Assistant sensor reading. */
export interface SmhiForecast {
  source:'smhi';available:boolean;placeName:string;message?:string;
  referenceTime?:string;validTime?:string;fetchedAt?:string;
  condition?:string;description?:string;attributes?:Record<string,unknown>;
  days?:SmhiDayForecast[];
}
