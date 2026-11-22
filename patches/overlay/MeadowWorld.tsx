import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useEffect,useMemo} from 'react';
import {getHeight} from '@/utils/terrain';
import {solar} from '@/solar';
import {useWindStore} from '@/stores/windStore';

/** Procedural leaf microtexture only for sub-pixel foliage, not an image scene. */
function turfTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=768;canvas.height=768;
  const context=canvas.getContext('2d');
  if(!context)throw new Error('Canvas 2D needed for procedural ground grass');
  const ctx=context;
  let seed=9145;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle='#356020';ctx.fillRect(0,0,768,768);
  // Dappled stems from the original root/tip grass palette. Draw with wrapping
  // copies so the repeat has no axis-aligned seams or visible photographic tile.
  for(let i=0;i<13500;i++){
    const x=rand()*768,y=rand()*768;
    const length=5+rand()*17,width=.7+rand()*2.8;
    const dx=(rand()-.5)*length*.8,dy=-(.55+rand()*.45)*length;
    const light=rand(),shade=.69+light*.64;
    const green=light<.38?[36,81,23]:light<.75?[57,112,30]:[87,146,49];
    ctx.fillStyle=`rgb(${green.map(n=>Math.min(255,Math.round(n*shade))).join(',')})`;
    for(const ox of [-768,0,768])for(const oy of [-768,0,768]){
      // Most strokes draw only once; a duplicated copy near an edge wraps.
      if(x+ox+dx < -20 || x+ox-dx>788 || y+oy+dy < -20 || y+oy>788)continue;
      ctx.beginPath();
      ctx.moveTo(x+ox-width/2,y+oy);
      ctx.quadraticCurveTo(x+ox+dx*.36-width/2,y+oy+dy*.52,x+ox+dx,y+oy+dy);
      ctx.quadraticCurveTo(x+ox+dx*.56+width/2,y+oy+dy*.42,x+ox+width/2,y+oy);
      ctx.closePath();ctx.fill();
    }
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=2;
  texture.generateMipmaps=true;
  return texture;
}

/** The ground follows the same 180-unit source terrain as every grass root.
 * Its detail handles the sub-pixel canopy; it never replaces real near grass. */
export function MeadowWorld(){
  const ground=useMemo(()=>{
    const g=new THREE.PlaneGeometry(180,180,180,180);
    const positions=g.getAttribute('position') as THREE.BufferAttribute;
    for(let i=0;i<positions.count;i++)
      positions.setZ(i,getHeight(positions.getX(i),positions.getY(i)));
    positions.needsUpdate=true;g.computeVertexNormals();
    return g;
  },[]);
  const turf=useMemo(turfTexture,[]);
  const uniforms=useMemo(()=>({
    uDaylight:{value:1},uNight:{value:0},
    uFogColor:{value:new THREE.Color('#7ab0b0')},
    uWeather:{value:0},uTurf:{value:turf},
    uTime:{value:0},uWind:{value:new THREE.Vector2(1,0)},
  }),[turf]);
  useEffect(()=>()=>{ground.dispose();turf.dispose();},[ground,turf]);
  useFrame(()=>{
    uniforms.uDaylight.value=solar.daylight;
    uniforms.uNight.value=solar.darkness;
    uniforms.uWeather.value=solar.weatherMix;
    (uniforms.uFogColor.value as THREE.Color).copy(solar.fogColor);
    const wind=useWindStore.getState();
    uniforms.uTime.value=wind.time;
    (uniforms.uWind.value as THREE.Vector2).set(wind.directionVec[0],wind.directionVec[1]);
  });
  return <mesh geometry={ground} rotation={[-Math.PI/2,0,0]}>
    <shaderMaterial side={THREE.FrontSide} uniforms={uniforms}
      vertexShader={`
        varying vec3 vWorld;varying vec3 vNormalWorld;
        void main(){
          vec4 p=modelMatrix*vec4(position,1.0);
          vWorld=p.xyz;
          vNormalWorld=normalize(mat3(modelMatrix)*normal);
          gl_Position=projectionMatrix*viewMatrix*p;
        }`}
      fragmentShader={`
        precision mediump float;
        uniform sampler2D uTurf;
        uniform vec3 uFogColor;
        uniform float uDaylight,uNight,uWeather,uTime;
        uniform vec2 uWind;
        varying vec3 vWorld;varying vec3 vNormalWorld;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 q=floor(p),f=fract(p);
          f=f*f*(3.-2.*f);
          return mix(mix(hash(q),hash(q+vec2(1.,0.)),f.x),
            mix(hash(q+vec2(0.,1.)),hash(q+vec2(1.,1.)),f.x),f.y);
        }
        void main(){
          vec2 p=vWorld.xz;
          float macro=noise(p*.23);
          float bunch=noise(p*2.1);
          float fine=noise(p*10.0);
          vec2 drift=uWind*.005*sin(uTime*.66+p.x*.27+p.y*.36);
          vec3 micro=texture2D(uTurf,p*.135+drift).rgb;
          float detail=.38*macro+.38*bunch+.24*fine;
          vec3 base=mix(vec3(.095,.225,.073),vec3(.19,.35,.12),
            clamp(detail*.87+.08,0.,1.));
          float blend=smoothstep(3.0,10.0,length(p));
          base=mix(base,micro*(.77+.25*macro),blend*.81);
          base*=clamp(.28+uDaylight*.79,0.,1.)
            *(.82+.18*max(0.,normalize(vNormalWorld).y));
          vec3 moon=vec3(.08,.16,.22)*(.78+detail*.32);
          base=mix(base,moon,smoothstep(.34,1.,uNight));
          base=mix(base,vec3(.12,.225,.20),uWeather*.18);
          float fog=smoothstep(20.0,86.0,length(p));
          gl_FragColor=vec4(mix(base,uFogColor,fog*.97),1.);
        }`}/>
  </mesh>;
}
