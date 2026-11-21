import * as THREE from 'three';
import type {SerenityMood} from './serenityCycle';

export type MeadowWeather='clear'|'cloudy'|'drizzle'|'rain';
/** Shared frame-level state: one running scene, not React updates for each blade. */
export const solar={
  phase:0.08,
  mood:'Sunrise' as SerenityMood,
  daylight:0.45,
  twilight:0,
  darkness:1,
  tint:new THREE.Color('#9bb8e0'),
  skyHorizon:new THREE.Color('#b0d6e8'),
  skyZenith:new THREE.Color('#4e90c5'),
  fogColor:new THREE.Color('#95b9c4'),
  paused:false,
  cursorMotion:0,
  cursorForce:0,
  interactionEnabled:false,
  phaseManual:null as number|null,
  cycleSeconds:10,
  windMultiplier:1,
  soundVolume:0.78,
  route:'landing' as 'landing'|'work'|'field',
  workSoundLevel:0.24,
  workMuffle:true,
  weather:'clear' as MeadowWeather,
  weatherMix:0,
  rainMix:0,
};
