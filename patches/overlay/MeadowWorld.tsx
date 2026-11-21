import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useEffect,useMemo,useRef} from 'react';
import {grassGeometry} from '@/utils/grassGeometry';
import {getHeight} from '@/utils/terrain';
import {solar} from '@/solar';

function randomSequence(seed:number){
  let value=seed>>>0;
  return ()=>{value=(1664525*value+1013904223)>>>0;return value/4294967296;};
}
const lowQuality=new URLSearchParams(window.location.search).get('quality')==='low';
const coarse=window.matchMedia('(pointer:coarse)').matches;

/** The original 10-unit plane is replaced by a continuous 180-unit terrain.
 * Same upstream height function under foreground and horizon: no floating tile. */
export function MeadowWorld(){
  const mesh=useRef<THREE.Mesh>(null);
  const ground=useMemo(()=>{
    const g=new THREE.PlaneGeometry(180,180,180,180);
    const pos=g.getAttribute('position') as THREE.BufferAttribute;
    for(let i=0;i<pos.count;i++)pos.setZ(i,getHeight(pos.getX(i),pos.getY(i)));
    pos.needsUpdate=true;g.computeVertexNormals();return g;
  },[]);
  const uniforms=useMemo(()=>({
    uDaylight:{value:1},uNight:{value:0},
    uFogColor:{value:new THREE.Color('#7ab0b0')},
    uWeather:{value:0},
  }),[]);
  useEffect(()=>()=>ground.dispose(),[ground]);
  useFrame(()=>{
    uniforms.uDaylight.value=solar.daylight;
    uniforms.uNight.value=solar.darkness;
    uniforms.uWeather.value=solar.weatherMix;
    (uniforms.uFogColor.value as THREE.Color).copy(solar.fogColor);
  });
  return <>
    <mesh ref={mesh} geometry={ground} rotation={[-Math.PI/2,0,0]} receiveShadow={false}>
      <shaderMaterial uniforms={uniforms} side={THREE.FrontSide}
        vertexShader={`
          varying vec3 vWorld;varying vec3 vNormalWorld;
          void main(){
            vec4 p=modelMatrix*vec4(position,1.0);
            vWorld=p.xyz;vNormalWorld=normalize(mat3(modelMatrix)*normal);
            gl_Position=projectionMatrix*viewMatrix*p;
          }`}
        fragmentShader={`
          precision mediump float;
          varying vec3 vWorld;varying vec3 vNormalWorld;
          uniform vec3 uFogColor;uniform float uDaylight,uNight,uWeather;
          float noise(vec2 p){return fract(sin(dot(floor(p),vec2(127.1,311.7)))*43758.5453);}
          void main(){
            float detail=noise(vWorld.xz*3.4)*0.42+noise(vWorld.xz*19.0)*0.16;
            float wide=sin(vWorld.x*0.31+sin(vWorld.z*0.21))*0.5+0.5;
            vec3 soil=mix(vec3(.10,.205,.075),vec3(.18,.29,.095),detail*.65+wide*.25);
            float lamp=clamp(uDaylight*.8+.25,0.0,1.0);
            soil*=lamp*(.72+.28*max(0.0,normalize(vNormalWorld).y));
            vec3 moon=vec3(.075,.15,.21)*(0.75+detail*.38);
            soil=mix(soil,moon,smoothstep(.35,1.0,uNight));
            soil=mix(soil,vec3(.12,.21,.19),uWeather*.26);
            float dist=length(vWorld.xz);
            float fog=smoothstep(20.0,82.0,dist);
            soil=mix(soil,uFogColor,fog*.97);
            gl_FragColor=vec4(soil,1.0);
          }`}/>
    </mesh>
    <DistantGrass/>
  </>;
}

/** Sparse outer tufts and distance fog provide a horizon, not another 160k-blade tile. */
function DistantGrass(){
  const ref=useRef<THREE.InstancedMesh>(null);
  const count=lowQuality?900:coarse?6500:16500;
  const geom=useMemo(()=>grassGeometry(3,0.024,0.32,1.1),[]);
  const mat=useMemo(()=>new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    uniforms:{
      uTime:{value:0},uWind:{value:1},
      uDaylight:{value:1},uNight:{value:0},
      uFogColor:{value:new THREE.Color('#7daebe')},
      uRain:{value:0},
    },
    vertexShader:`
      uniform float uTime,uWind;
      varying vec2 vUv;varying vec3 vWorld;
      void main(){
        vUv=uv;
        vec4 origin=modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);
        vec3 p=position;
        float wave=sin(uTime*.73+origin.x*.31+origin.z*.19)*.065+
          sin(uTime*.29+origin.z*.73)*.042;
        p.x+=wave*pow(uv.y,1.65)*uWind;
        vec4 world=modelMatrix*instanceMatrix*vec4(p,1.0);
        vWorld=world.xyz;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      precision mediump float;
      uniform float uDaylight,uNight,uRain;uniform vec3 uFogColor;
      varying vec2 vUv;varying vec3 vWorld;
      void main(){
        float grain=fract(sin(dot(floor(vWorld.xz*33.0),vec2(127.1,311.7)))*43758.5453);
        vec3 grass=mix(vec3(.08,.21,.065),vec3(.31,.51,.16),pow(vUv.y,.9));
        grass*=mix(.88,1.12,grain);
        grass*=clamp(uDaylight*.75+.28,0.0,1.0);
        grass=mix(grass,vec3(.09,.18,.27),smoothstep(.35,1.0,uNight));
        grass=mix(grass,vec3(.13,.25,.18),uRain*.25);
        float fog=smoothstep(13.0,66.0,length(vWorld.xz));
        gl_FragColor=vec4(mix(grass,uFogColor,fog*.99),1.0);
      }`
  }),[]);
  useEffect(()=>{
    if(!ref.current)return;
    const rand=randomSequence(1937);
    const dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){
      const angle=rand()*Math.PI*2;
      const radius=4.8+Math.pow(rand(),2.3)*62;
      const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
      dummy.position.set(x,getHeight(x,-z),z);
      dummy.rotation.y=rand()*Math.PI*2;
      const scale=(.65+rand()*.7)*Math.min(1.3,1+radius*.012);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i,dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate=true;
    ref.current.computeBoundingSphere();
  },[count]);
  useEffect(()=>()=>{geom.dispose();mat.dispose();},[geom,mat]);
  useFrame(({clock})=>{
    mat.uniforms.uTime.value=clock.getElapsedTime();
    mat.uniforms.uWind.value=solar.windMultiplier*(1+solar.rainMix*.25);
    mat.uniforms.uDaylight.value=solar.daylight;
    mat.uniforms.uNight.value=solar.darkness;
    mat.uniforms.uRain.value=solar.weatherMix;
    (mat.uniforms.uFogColor.value as THREE.Color).copy(solar.fogColor);
  });
  return <instancedMesh ref={ref} args={[geom,mat,count]} frustumCulled={false}/>;
}
