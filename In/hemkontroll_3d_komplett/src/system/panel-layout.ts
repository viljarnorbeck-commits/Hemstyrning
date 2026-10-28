/** Subdivide the original solar group's 1.2 × 2 footprint without changing its placed transform. */
export function panelLayout(count:number){
 const n=Math.max(0,Math.min(200,Math.round(count)));if(!n)return[];
 const columns=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/columns),width=1.2/columns,depth=2/rows;
 return Array.from({length:n},(_,i)=>({x:(i%columns-(columns-1)/2)*width,z:(Math.floor(i/columns)-(rows-1)/2)*depth,width:width*.95,depth:depth*.95}));
}
