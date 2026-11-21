import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {Cloud,Clouds,Stars} from '@react-three/drei';
import {useControls} from 'leva';
import {useEffect,useMemo,useRef} from 'react';
import {useSunStore} from '@/stores/sunStore';
import {solar,type MeadowWeather} from '@/solar';
import {momentAt} from '@/serenityCycle';

const dayHorizon=new THREE.Color('#80bfda');
const dayZenith=new THREE.Color('#327fac');
const sunriseHorizon=new THREE.Color('#e5b5a0');
const sunriseZenith=new THREE.Color('#547fb5');
const sunsetHorizon=new THREE.Color('#e4a27f');
const sunsetZenith=new THREE.Color('#5b6e9b');
const nightHorizon=new THREE.Color('#293f64');
const nightZenith=new THREE.Color('#09172f');
const stormHorizon=new THREE.Color('#899da5');
const stormZenith=new THREE.Color('#4c6577');
const nightGrass=new THREE.Color('#9bb8e0');
const warmGrass=new THREE.Color('#f4c6a1');
const dayGrass=new THREE.Color('#ffffff');
const sunlight=new THREE.Color('#fff5db');
const sunsetLight=new THREE.Color('#ffc086');
const weatherOrder:MeadowWeather[]=['clear','cloudy','drizzle','clear'];

/** Independent scenic cycles; light, clouds and rain transition without remounting. */
export function SerenityAtmosphere(){
  const cfg=useControls('Serenity sky',{animated:true,clouds:true});
  const sky=useRef<THREE.ShaderMaterial>(null);
  const sun=useRef<THREE.DirectionalLight>(null);
  const hemi=useRef<THREE.HemisphereLight>(null);
  const stars=useRef<THREE.Points>(null);
  const clouds=useRef<THREE.Group>(null);
  const starColors=useRef<Float32Array|null>(null);
  const previousStars=useRef(-1);
  const phase=useRef(.08);
  const reduced=useRef(false);
  const direction=useMemo(()=>new THREE.Vector3(),[]);
  const lightColor=useMemo(()=>new THREE.Color(),[]);
  const horizon=useMemo(()=>new THREE.Color(),[]);
  const zenith=useMemo(()=>new THREE.Color(),[]);
  const baseHorizon=useMemo(()=>new THREE.Color(),[]);
  const baseZenith=useMemo(()=>new THREE.Color(),[]);
  const skyUniforms=useMemo(()=>({
    uHorizon:{value:new THREE.Color(dayHorizon)},
    uZenith:{value:new THREE.Color(dayZenith)},
    uSunDir:{value:new THREE.Vector3(0,0,1)},
    uSunWarmth:{value:0},
    uSunStrength:{value:.4},
  }),[]);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed=()=>{reduced.current=query.matches;};
    changed();query.addEventListener('change',changed);
    return ()=>query.removeEventListener('change',changed);
  },[]);
  useFrame(({clock},delta)=>{
    const dt=Math.min(Math.max(delta,0),.05),t=clock.getElapsedTime();
    if(solar.phaseManual!==null){
      phase.current=((solar.phaseManual%1)+1)%1;solar.phaseManual=null;
    }else if(cfg.animated&&!reduced.current&&!solar.paused){
      phase.current=(phase.current+dt/solar.cycleSeconds)%1;
    }
    const m=momentAt(phase.current);
    solar.phase=m.phase;solar.mood=m.mood;solar.daylight=m.daylight;
    solar.twilight=m.twilight;solar.darkness=m.darkness;

    const automatic=weatherOrder[Math.floor(t/105)%weatherOrder.length];
    const next=solar.weatherMode==='auto'?automatic:solar.weatherMode;
    solar.weather=next;
    const cloudTarget=next==='clear'?0:next==='cloudy'?.52:next==='drizzle'?.72:1;
    const rainTarget=next==='drizzle'?.36:next==='rain'?1:0;
    solar.weatherMix+=(cloudTarget-solar.weatherMix)*(1-Math.exp(-dt*.86));
    solar.rainMix+=(rainTarget-solar.rainMix)*(1-Math.exp(-dt*.72));

    const sunrise=m.mood==='Sunrise'?Math.sin(Math.PI*m.progress):0;
    const sunset=m.mood==='Sunset'?Math.sin(Math.PI*m.progress):0;
    const warm=Math.max(sunrise,sunset);
    baseHorizon.copy(dayHorizon).lerp(nightHorizon,m.darkness);
    baseZenith.copy(dayZenith).lerp(nightZenith,m.darkness);
    if(sunrise>0){baseHorizon.lerp(sunriseHorizon,sunrise*.82);baseZenith.lerp(sunriseZenith,sunrise*.67);}
    if(sunset>0){baseHorizon.lerp(sunsetHorizon,sunset*.88);baseZenith.lerp(sunsetZenith,sunset*.74);}
    const overcast=solar.weatherMix*(1-m.darkness*.55);
    horizon.copy(baseHorizon).lerp(stormHorizon,overcast*.93);
    zenith.copy(baseZenith).lerp(stormZenith,overcast*.86);
    solar.skyHorizon.copy(horizon);
    solar.skyZenith.copy(zenith);
    solar.fogColor.copy(horizon).lerp(new THREE.Color('#668e8b'),.30);
    skyUniforms.uHorizon.value.copy(horizon);
    skyUniforms.uZenith.value.copy(zenith);

    direction.set(Math.cos(m.azimuth)*Math.cos(m.elevation),
      Math.sin(m.elevation),-Math.sin(m.azimuth)*Math.cos(m.elevation)).normalize();
    useSunStore.getState().sunDirection.copy(direction);
    solar.tint.copy(nightGrass).lerp(dayGrass,(m.daylight-.45)/.55)
      .lerp(warmGrass,.42*m.twilight);
    if(sun.current){
      sun.current.position.copy(direction).multiplyScalar(65);
      sun.current.intensity=(.25+Math.max(0,Math.sin(m.elevation))*2.0*m.daylight)*(1-solar.weatherMix*.55);
      sun.current.color.copy(lightColor.copy(sunlight).lerp(sunsetLight,.8*m.twilight));
    }
    if(hemi.current)hemi.current.intensity=(.65+.9*((m.daylight-.45)/.55))*(1-solar.weatherMix*.32);
    skyUniforms.uSunDir.value.copy(direction);
    skyUniforms.uSunWarmth.value=warm;
    skyUniforms.uSunStrength.value=(1-m.darkness)*(1-solar.weatherMix*.85);
    if(clouds.current){
      clouds.current.visible=cfg.clouds;
      // Individual Cloud.speed props animate them independently. Group motion stays subtle.
      clouds.current.position.x=Math.sin(t*.009)*1.8;
    }
    if(stars.current){
      const attribute=stars.current.geometry.getAttribute('color') as THREE.BufferAttribute|undefined;
      if(attribute){
        const data=attribute.array as Float32Array;
        if(!starColors.current)starColors.current=new Float32Array(data);
        if(Math.abs(m.starOpacity-previousStars.current)>.012&&starColors.current){
          for(let i=0;i<data.length;i++)data[i]=starColors.current[i]*m.starOpacity;
          attribute.needsUpdate=true;previousStars.current=m.starOpacity;
        }
      }
    }
  });
  return <>
    <mesh frustumCulled={false} renderOrder={-100}>
      <sphereGeometry args={[360,48,32]}/>
      <shaderMaterial ref={sky} side={THREE.BackSide} depthWrite={false} uniforms={skyUniforms}
        vertexShader={`
          varying vec3 vSkyDirection;
          void main(){
            vSkyDirection=position;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
          }`}
        fragmentShader={`
          precision highp float;
          varying vec3 vSkyDirection;
          uniform vec3 uHorizon,uZenith,uSunDir;
          uniform float uSunWarmth,uSunStrength;
          void main(){
            vec3 d=normalize(vSkyDirection);
            float horizon=clamp(d.y*.72+.23,0.0,1.0);
            vec3 sky=mix(uHorizon,uZenith,pow(horizon,.62));
            float sunDot=max(0.0,dot(d,normalize(uSunDir)));
            float halo=pow(sunDot,46.0)*.22+pow(sunDot,600.0)*.42;
            vec3 warm=mix(vec3(.85,.93,1.0),vec3(1.0,.74,.46),uSunWarmth);
            sky=mix(sky,warm,clamp(halo*uSunStrength,0.0,.44));
            gl_FragColor=vec4(sky,1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`}/>
    </mesh>
    <Stars ref={stars} radius={110} depth={65} count={1250} factor={2.9} saturation={.04} fade speed={.04}/>
    <directionalLight ref={sun} color="#fff5db" intensity={2} position={[25,35,-15]}/>
    <hemisphereLight ref={hemi} args={['#bfdcff','#385d34',1.1]}/>
    <group ref={clouds}>
      <Clouds material={THREE.MeshLambertMaterial} limit={60}>
        <Cloud seed={12} segments={15} bounds={[7,1.15,2.2]} position={[-17,15,-30]} volume={4.7} opacity={.28} fade={39} speed={.014}/>
        <Cloud seed={28} segments={17} bounds={[10,1.3,2.3]} position={[-1,13,-38]} volume={4.4} opacity={.24} fade={44} speed={.012}/>
        <Cloud seed={44} segments={13} bounds={[7,1.25,2.2]} position={[17,14,-28]} volume={4.2} opacity={.24} fade={41} speed={.011}/>
        <Cloud seed={62} segments={11} bounds={[5,1.1,2.1]} position={[26,16,-48]} volume={3.5} opacity={.20} fade={48} speed={.009}/>
        <Cloud seed={79} segments={14} bounds={[6,1.25,2.3]} position={[-29,11,-54]} volume={3.9} opacity={.23} fade={50} speed={.015}/>
        <Cloud seed={95} segments={10} bounds={[5,1.1,1.9]} position={[4,18,-61]} volume={3.3} opacity={.17} fade={53} speed={.008}/>
      </Clouds>
    </group>
  </>;
}
