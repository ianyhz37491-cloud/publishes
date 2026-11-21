import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {Cloud,Clouds,Sky,Stars} from '@react-three/drei';
import {useControls} from 'leva';
import {useEffect,useMemo,useRef,type ComponentRef} from 'react';
import {useSunStore} from '@/stores/sunStore';
import {solar} from '@/solar';
import {momentAt} from '@/serenityCycle';

const nightGrass=new THREE.Color('#9bb8e0');
const warmGrass=new THREE.Color('#f4c6a1');
const dayGrass=new THREE.Color('#ffffff');
const sunlight=new THREE.Color('#fff5db');
const sunsetLight=new THREE.Color('#ffc086');

/** Slow physical wind and clouds are independent of the stylised 10s sky clock. */
export function SerenityAtmosphere(){
  const cfg=useControls('Serenity sky',{
    animated:true,
    cycleSeconds:{value:10,min:10,max:180,step:1},
    startingTime:{value:0.08,min:0,max:1,step:0.01},
    clouds:true
  });
  const sky=useRef<ComponentRef<typeof Sky>>(null);
  const night=useRef<THREE.ShaderMaterial>(null);
  const sun=useRef<THREE.DirectionalLight>(null);
  const hemi=useRef<THREE.HemisphereLight>(null);
  const stars=useRef<THREE.Points>(null);
  const cloudGroup=useRef<THREE.Group>(null);
  const starColors=useRef<Float32Array|null>(null);
  const previousStars=useRef(-1);
  const reduced=useRef(false);
  const direction=useMemo(()=>new THREE.Vector3(),[]);
  const lightColor=useMemo(()=>new THREE.Color(),[]);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>{reduced.current=query.matches;};
    changed();
    query.addEventListener('change',changed);
    return ()=>query.removeEventListener('change',changed);
  },[]);
  useFrame(({clock})=>{
    const time=clock.getElapsedTime();
    const phase=(cfg.startingTime+((cfg.animated&&!reduced.current)?time/cfg.cycleSeconds:0))%1;
    const m=momentAt(phase);
    solar.phase=m.phase;
    solar.mood=m.mood;
    solar.daylight=m.daylight;
    solar.twilight=m.twilight;
    solar.darkness=m.darkness;
    direction.set(Math.cos(m.azimuth)*Math.cos(m.elevation),Math.sin(m.elevation),-Math.sin(m.azimuth)*Math.cos(m.elevation)).normalize();
    // Mutate the existing store vector to avoid rerendering the entire scene each frame.
    useSunStore.getState().sunDirection.copy(direction);
    solar.tint.copy(nightGrass).lerp(dayGrass,(m.daylight-0.45)/0.55).lerp(warmGrass,0.42*m.twilight);
    if(sun.current){
      sun.current.position.copy(direction).multiplyScalar(55);
      sun.current.intensity=0.20+Math.max(0,Math.sin(m.elevation))*2.2*m.daylight;
      sun.current.color.copy(lightColor.copy(sunlight).lerp(sunsetLight,0.8*m.twilight));
    }
    if(hemi.current)hemi.current.intensity=0.62+0.98*((m.daylight-0.45)/0.55);
    if(sky.current){
      const uniform=(sky.current.material as THREE.ShaderMaterial).uniforms?.sunPosition;
      if(uniform)(uniform.value as THREE.Vector3).copy(direction);
    }
    if(night.current)night.current.uniforms.uOpacity.value=0.77*m.darkness;
    if(cloudGroup.current){
      cloudGroup.current.visible=cfg.clouds;
      // Very slow landscape-wide drift; no scene warping or sun-clock coupling.
      cloudGroup.current.position.x=Math.sin(time*0.016)*2.8;
    }
    if(stars.current){
      const attribute=stars.current.geometry.getAttribute('color') as THREE.BufferAttribute|undefined;
      if(attribute){
        const data=attribute.array as Float32Array;
        if(!starColors.current)starColors.current=new Float32Array(data);
        if(Math.abs(m.starOpacity-previousStars.current)>0.012 && starColors.current){
          for(let i=0;i<data.length;i++)data[i]=starColors.current[i]*m.starOpacity;
          attribute.needsUpdate=true;
          previousStars.current=m.starOpacity;
        }
      }
    }
  });
  return <>
    <Sky ref={sky} distance={1400} turbidity={3.3} rayleigh={1.6} mieCoefficient={0.004} mieDirectionalG={0.82}/>
    <mesh frustumCulled={false} renderOrder={-100}>
      <sphereGeometry args={[350,32,20]}/>
      <shaderMaterial ref={night} transparent depthWrite={false} side={THREE.BackSide} uniforms={{uOpacity:{value:0}}}
        vertexShader="varying vec3 vSkyDirection;void main(){vSkyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        fragmentShader="uniform float uOpacity;varying vec3 vSkyDirection;void main(){float h=smoothstep(-0.22,0.85,normalize(vSkyDirection).y);vec3 c=mix(vec3(0.11,0.17,0.29),vec3(0.026,0.065,0.17),h);gl_FragColor=vec4(c,uOpacity);}"/>
    </mesh>
    <Stars ref={stars} radius={110} depth={65} count={1500} factor={3.1} saturation={0.06} fade speed={0.05}/>
    <directionalLight ref={sun} color="#fff5db" intensity={2} position={[25,35,-15]}/>
    <hemisphereLight ref={hemi} args={['#bbd7ff','#405a36',1.1]}/>
    <group ref={cloudGroup}>
      <Clouds material={THREE.MeshLambertMaterial} limit={36}>
        <Cloud seed={15} segments={10} bounds={[8,1.2,2]} position={[-15,14,-31]} volume={4.2} opacity={0.22} fade={40} speed={0.018}/>
        <Cloud seed={29} segments={12} bounds={[11,1.5,2]} position={[4,12,-44]} volume={4.1} opacity={0.20} fade={50} speed={0.015}/>
        <Cloud seed={48} segments={9} bounds={[6,1.3,2]} position={[23,15,-32]} volume={4.4} opacity={0.18} fade={42} speed={0.013}/>
      </Clouds>
    </group>
  </>;
}
