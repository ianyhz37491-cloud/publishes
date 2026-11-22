import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useEffect,useMemo} from 'react';
import {getHeight} from '@/utils/terrain';
import {solar} from '@/solar';

/** Same deterministic terrain height as every grass instance.
 * This surface only supplies soil/grass colour at genuinely sub-pixel distances;
 * visible blades now all belong to the single unified grass renderer. */
export function MeadowWorld(){
  const ground=useMemo(()=>{
    const geometry=new THREE.PlaneGeometry(180,180,180,180);
    const positions=geometry.getAttribute('position') as THREE.BufferAttribute;
    for(let i=0;i<positions.count;i++){
      positions.setZ(i,getHeight(positions.getX(i),positions.getY(i)));
    }
    positions.needsUpdate=true;geometry.computeVertexNormals();
    return geometry;
  },[]);
  const uniforms=useMemo(()=>({
    uDaylight:{value:1},uNight:{value:0},
    uFogColor:{value:new THREE.Color('#7ab0b0')},uWeather:{value:0},
  }),[]);
  useEffect(()=>()=>ground.dispose(),[ground]);
  useFrame(()=>{
    uniforms.uDaylight.value=solar.daylight;
    uniforms.uNight.value=solar.darkness;
    uniforms.uWeather.value=solar.weatherMix;
    (uniforms.uFogColor.value as THREE.Color).copy(solar.fogColor);
  });
  return <mesh geometry={ground} rotation={[-Math.PI/2,0,0]} receiveShadow={false}>
    <shaderMaterial side={THREE.FrontSide} uniforms={uniforms}
      vertexShader={`
        varying vec3 vWorld;varying vec3 vNormalWorld;
        void main(){
          vec4 w=modelMatrix*vec4(position,1.0);
          vWorld=w.xyz;
          vNormalWorld=normalize(mat3(modelMatrix)*normal);
          gl_Position=projectionMatrix*viewMatrix*w;
        }`}
      fragmentShader={`
        precision mediump float;
        varying vec3 vWorld;varying vec3 vNormalWorld;
        uniform vec3 uFogColor;uniform float uDaylight,uNight,uWeather;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 q=floor(p),f=fract(p);
          f=f*f*(3.0-2.0*f);
          return mix(mix(hash(q),hash(q+vec2(1.,0.)),f.x),
            mix(hash(q+vec2(0.,1.)),hash(q+vec2(1.,1.)),f.x),f.y);
        }
        void main(){
          // The fine-scale green structure continues the blade base colour after
          // individual distant silhouettes fall below a pixel on screen.
          vec2 p=vWorld.xz;
          float macro=noise(p*.27);
          float bunch=noise(p*2.7);
          float fibre=noise(p*25.0);
          float brightness=.45*macro+.38*bunch+.17*fibre;
          vec3 base=mix(vec3(.095,.225,.073),vec3(.205,.363,.126),
            clamp(brightness*.96+.07,0.0,1.0));
          float slope=.83+.17*max(0.0,normalize(vNormalWorld).y);
          base*=slope*clamp(.28+uDaylight*.79,0.0,1.0);
          vec3 dark=vec3(.085,.16,.22)*(.8+brightness*.22);
          base=mix(base,dark,smoothstep(.34,1.0,uNight));
          base=mix(base,vec3(.12,.225,.2),uWeather*.18);
          float distance=length(p);
          float haze=smoothstep(20.0,86.0,distance);
          gl_FragColor=vec4(mix(base,uFogColor,haze*.97),1.0);
        }`}/>
  </mesh>;
}
