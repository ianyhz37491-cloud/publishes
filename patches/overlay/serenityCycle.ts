/** Four equally long, deliberately non-astronomical moods.
 *  Pure model: all boundaries are colour/lighting continuous.
 *  Phase 0 sunrise, .25 daylight, .50 sunset, .75 moonlit night.
 */
export type SerenityMood = 'Sunrise' | 'Daylight' | 'Sunset' | 'Night';
export type SerenityMoment = {
  mood: SerenityMood;
  phase: number;
  progress: number;
  daylight: number;
  elevation: number;
  azimuth: number;
  twilight: number;
  darkness: number;
  starOpacity: number;
};
export function ease(v:number):number {
  const t=Math.max(0,Math.min(1,v));
  return t*t*(3-2*t);
}
export function momentAt(phase:number):SerenityMoment {
  const p=((phase%1)+1)%1;
  const stage=Math.min(3,Math.floor(p*4));
  const progress=p*4-stage;
  const e=ease(progress);
  let daylight:number,elevation:number,azimuth:number,twilight:number;
  if(stage===0){ // Night -> sunrise -> morning, given an entire quarter.
    daylight=0.45+0.55*e;
    elevation=-0.18+1.0*e;
    azimuth=-1.25+0.65*e;
    twilight=Math.sin(Math.PI*progress);
  } else if(stage===1){ // Soft sustained daylight, sun arcs high overhead.
    daylight=1;
    elevation=0.82+0.13*Math.sin(Math.PI*progress);
    azimuth=-0.6+1.2*e;
    twilight=0;
  } else if(stage===2){ // Afternoon -> golden hour -> blue hour.
    daylight=1-0.55*e;
    elevation=0.82-1.0*e;
    azimuth=0.6+0.65*e;
    twilight=Math.sin(Math.PI*progress);
  } else { // Moonlit darkness, not a black screen.
    daylight=0.45;
    elevation=-0.18-0.08*Math.sin(Math.PI*progress);
    // Carry the sun continuously beneath the horizon back toward the east.
    azimuth=1.25+(2*Math.PI-2.5)*e;
    twilight=0;
  }
  const darkness=(1-daylight)/0.55;
  const starOpacity=ease((darkness-0.12)/0.78);
  return {mood:(['Sunrise','Daylight','Sunset','Night'] as SerenityMood[])[stage],
    phase:p,progress,daylight,elevation,azimuth,twilight,darkness,starOpacity};
}
/** Triangular crossfade around a stage midpoint, wrapping seamlessly. */
export function atmosphereWeight(phase:number,stage:number):number {
  const mid=(stage+0.5)/4;
  const delta=Math.abs(((phase-mid+1.5)%1)-0.5);
  return Math.max(0,1-delta*4);
}
