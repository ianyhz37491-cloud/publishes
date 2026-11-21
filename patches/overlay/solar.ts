import * as THREE from 'three';
import type {SerenityMood} from './serenityCycle';
/** Frame-shared animation state. No React rerenders on wind or pointer movement. */
export const solar={
  phase:0.08, mood:'Sunrise' as SerenityMood,
  daylight:0.45, twilight:0, darkness:1,
  tint:new THREE.Color('#9bb8e0'),
  paused:false,
  cursorMotion:0,
  cursorForce:0,
};
