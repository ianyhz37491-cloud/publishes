/** World-anchored, tapered sampling shared by every meadow quality preset.
 * Density changes gradually with ground distance; no square tile has a special edge.
 * The three bands are GPU instanced with one shading and wind implementation.
 */
export type MeadowBand='near'|'middle'|'far';
export type MeadowQuality='desktop'|'touch'|'low';
export type MeadowBandSpec={extent:number;spacing:number;segments:number};
const SPECS:Record<MeadowQuality,Record<MeadowBand,MeadowBandSpec>>={
  desktop:{
    near:{extent:10.6,spacing:0.025,segments:7},
    middle:{extent:29.0,spacing:0.084,segments:7},
    far:{extent:52.0,spacing:0.285,segments:4},
  },
  touch:{
    near:{extent:10.6,spacing:0.0455,segments:7},
    middle:{extent:29.0,spacing:0.146,segments:5},
    far:{extent:52.0,spacing:0.52,segments:3},
  },
  low:{
    near:{extent:10.6,spacing:10/112,segments:7},
    middle:{extent:29.0,spacing:0.30,segments:5},
    far:{extent:52.0,spacing:0.94,segments:3},
  },
};
export function meadowSpec(quality:MeadowQuality,band:MeadowBand):MeadowBandSpec{
  return SPECS[quality][band];
}
export function smoothstep(start:number,end:number,x:number){
  const t=Math.max(0,Math.min(1,(x-start)/(end-start)));
  return t*t*(3-2*t);
}
export function meadowDensity(band:MeadowBand,r:number){
  if(band==='near')return 1-smoothstep(5.0,10.4,r);
  if(band==='middle')return smoothstep(3.0,8.7,r)*(1-smoothstep(14,28.4,r));
  return smoothstep(15,25,r)*(1-smoothstep(32,51.5,r));
}
function fract(n:number){return n-Math.floor(n);}
function hash(i:number,j:number,seed:number){
  return fract(Math.sin(i*127.1+j*311.7+seed*73.63)*43758.5453123);
}
export type MeadowPoint={x:number;z:number;size:number;accent:number};
export function sampleMeadowCell(quality:MeadowQuality,band:MeadowBand,i:number,j:number):MeadowPoint|null{
  const {spacing,extent}=meadowSpec(quality,band);
  const x=(i+0.5+(hash(i,j,11)-0.5)*0.72)*spacing;
  const z=(j+0.5+(hash(i,j,12)-0.5)*0.72)*spacing;
  if(Math.abs(x)>extent||Math.abs(z)>extent)return null;
  const radius=Math.hypot(x,z);
  if(hash(i,j,13)>=meadowDensity(band,radius))return null;
  const variation=hash(i,j,14);
  return {x,z,size:0.8+variation*0.4,accent:hash(i,j,15)<0.05?1:0};
}
