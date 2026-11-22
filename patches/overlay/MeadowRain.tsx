import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useEffect,useMemo} from 'react';
import {solar} from '@/solar';
const lowQuality=new URLSearchParams(window.location.search).get('quality')==='low';
const coarse=window.matchMedia('(pointer:coarse)').matches;
function rand(seed:number){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
/** Lightweight wind-slanted precipitation; hidden gradually when the weather clears. */
function Rain(){
  const count=lowQuality?120:coarse?310:820;
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry(),r=rand(607);
    const positions=new Float32Array(count*6),speeds=new Float32Array(count*2);
    for(let i=0;i<count;i++){
      const x=(r()-.5)*26,z=(r()-.5)*26,y=r()*12,v=.75+r()*.65;
      positions.set([x,y,z,x+.05,y+.29,z+.03],i*6);
      speeds[i*2]=speeds[i*2+1]=v;
    }
    g.setAttribute('position',new THREE.BufferAttribute(positions,3));
    g.setAttribute('aSpeed',new THREE.BufferAttribute(speeds,1));
    return g;
  },[count]);
  const material=useMemo(()=>new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.NormalBlending,
    uniforms:{uTime:{value:0},uRain:{value:0},uWind:{value:0}},
    vertexShader:`
      attribute float aSpeed;
      uniform float uTime,uWind;
      varying float vDepth;
      void main(){
        vec3 p=position;
        float fall=mod(p.y-uTime*(5.1+aSpeed*2.6),12.0);
        p.y=fall-1.2;
        p.x+=uWind*(12.0-fall)*.09;
        vDepth=1.0-smoothstep(6.0,19.0,length(p.xz));
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
      }`,
    fragmentShader:`
      precision mediump float;uniform float uRain;varying float vDepth;
      void main(){gl_FragColor=vec4(.69,.82,.89,uRain*vDepth*.32);}
      `
  }),[]);
  useFrame(({clock})=>{
    material.uniforms.uTime.value=clock.getElapsedTime();
    material.uniforms.uRain.value=solar.rainMix;
    material.uniforms.uWind.value=solar.windMultiplier;
  });
  useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
  return <lineSegments geometry={geometry} material={material} frustumCulled={false}/>;
}

export function MeadowRain(){return <Rain/>;}
