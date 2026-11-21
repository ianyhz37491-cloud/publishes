import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Clouds, OrbitControls, Sky, Stars } from '@react-three/drei';
import { useControls } from 'leva';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { GrassField } from '@/components/GrassField';
import { GenerateTerrain } from '@/components/Terrain';
import { WindSystem } from '@/components/WindSystem';
import { useSunStore } from '@/stores/sunStore';
import { solar } from '@/solar';
import '@/live.css';

const NIGHT_GRASS=new THREE.Color('#7896cb'),DAY_GRASS=new THREE.Color('#ffffff');
const SUNSET_GRASS=new THREE.Color('#ffd3ac'),SUN_LIGHT=new THREE.Color('#fff6df'),SUNSET_LIGHT=new THREE.Color('#ffb56b');

function Atmosphere(){
  const config=useControls('Atmosphere',{animated:true,cycleSeconds:{value:10,min:6,max:180,step:1},startingTime:{value:0.42,min:0,max:1,step:0.01},clouds:true});
  const sun=useRef<THREE.DirectionalLight>(null),hemisphere=useRef<THREE.HemisphereLight>(null);
  const sky=useRef<THREE.Mesh>(null),night=useRef<THREE.ShaderMaterial>(null);
  const stars=useRef<THREE.Points>(null),cloudGroup=useRef<THREE.Group>(null);
  const originalColors=useRef<Float32Array|null>(null),lastBrightness=useRef(-1),reduced=useRef(false);
  const direction=useMemo(()=>new THREE.Vector3(),[]),sunlight=useMemo(()=>new THREE.Color(),[]);
  useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{reduced.current=q.matches;};update();
    q.addEventListener('change',update);return ()=>q.removeEventListener('change',update);},[]);
  useFrame(({clock})=>{
    const seconds=clock.getElapsedTime(),phase=(config.startingTime+((config.animated&&!reduced.current)?seconds/config.cycleSeconds:0))%1;
    const a=phase*Math.PI*2-Math.PI/2,altitude=Math.sin(a);
    const day=THREE.MathUtils.smoothstep(altitude,-0.17,0.22);
    const dusk=day*(1-THREE.MathUtils.smoothstep(altitude,0.04,0.56)),darkness=1-day;
    direction.set(Math.cos(a)*0.48,altitude,-0.85).normalize();
    useSunStore.getState().sunDirection.copy(direction);
    solar.daylight=day;solar.phase=phase;
    solar.tint.copy(NIGHT_GRASS).lerp(DAY_GRASS,day).lerp(SUNSET_GRASS,dusk*0.43);
    if(sun.current){
      sun.current.position.copy(direction).multiplyScalar(60);
      sun.current.intensity=Math.max(0,altitude)*2.8+0.04;
      sun.current.color.copy(sunlight.copy(SUN_LIGHT).lerp(SUNSET_LIGHT,dusk*0.73));
    }
    if(hemisphere.current)hemisphere.current.intensity=0.12+1.35*day;
    if(sky.current){
      const material=sky.current.material as THREE.ShaderMaterial;
      const uniform=material.uniforms?.sunPosition;
      if(uniform)(uniform.value as THREE.Vector3).copy(direction);
    }
    if(night.current)night.current.uniforms.uOpacity.value=Math.pow(darkness,1.08)*0.992;
    if(cloudGroup.current){cloudGroup.current.visible=config.clouds;cloudGroup.current.position.x=Math.sin(seconds*0.033)*2.8;}
    if(stars.current){
      const attr=stars.current.geometry.getAttribute('color') as THREE.BufferAttribute;
      if(attr){
        if(!originalColors.current)originalColors.current=new Float32Array(attr.array as Float32Array);
        const brightness=THREE.MathUtils.smoothstep(darkness,0.37,0.94);
        if(Math.abs(brightness-lastBrightness.current)>0.015&&originalColors.current){
          const colors=attr.array as Float32Array;
          for(let i=0;i<colors.length;i++)colors[i]=originalColors.current[i]*brightness;
          attr.needsUpdate=true;lastBrightness.current=brightness;
        }
      }
    }
  });
  return <>
    <Sky ref={sky} distance={1400} turbidity={3.5} rayleigh={1.65} mieCoefficient={0.0045} mieDirectionalG={0.82}/>
    <mesh frustumCulled={false} renderOrder={-100}>
      <sphereGeometry args={[350,32,20]}/>
      <shaderMaterial ref={night} transparent depthWrite={false} side={THREE.BackSide} uniforms={{uOpacity:{value:0}}}
        vertexShader="varying vec3 vSkyDirection; void main(){vSkyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        fragmentShader="uniform float uOpacity;varying vec3 vSkyDirection;void main(){float h=smoothstep(-0.22,0.83,normalize(vSkyDirection).y);vec3 c=mix(vec3(0.022,0.035,0.075),vec3(0.004,0.009,0.030),h);gl_FragColor=vec4(c,uOpacity);}"/>
    </mesh>
    <Stars ref={stars} radius={110} depth={65} count={1800} factor={3.3} saturation={0.08} fade speed={0.2}/>
    <directionalLight ref={sun} color="#fff6df" intensity={2.2} position={[25,40,-15]}/>
    <hemisphereLight ref={hemisphere} args={['#d2e6ff','#1e3017',1.4]}/>
    <group ref={cloudGroup}>
      <Clouds material={THREE.MeshLambertMaterial} limit={44}>
        <Cloud seed={15} segments={12} bounds={[8,1.4,2]} position={[-15,14,-31]} volume={4.4} opacity={0.23} fade={40} speed={0.06}/>
        <Cloud seed={29} segments={14} bounds={[11,1.7,2]} position={[4,12,-44]} volume={4.1} opacity={0.20} fade={50} speed={0.045}/>
        <Cloud seed={48} segments={10} bounds={[6,1.3,2]} position={[23,15,-32]} volume={4.6} opacity={0.19} fade={42} speed={0.055}/>
      </Clouds>
    </group>
  </>;
}

function AmbientSound(){
  const [playing,setPlaying]=useState(false),[name,setName]=useState('');
  const ctx=useRef<AudioContext|null>(null),media=useRef<HTMLAudioElement|null>(null);
  const sampleUrl=useRef<string|null>(null),windGain=useRef<GainNode|null>(null);
  function createWind(c:AudioContext){
    const b=c.createBuffer(1,Math.round(c.sampleRate*3),c.sampleRate),data=b.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*0.6;
    const s=c.createBufferSource();s.buffer=b;s.loop=true;
    const lo=c.createBiquadFilter();lo.type='lowpass';lo.frequency.value=310;
    const hi=c.createBiquadFilter();hi.type='highpass';hi.frequency.value=42;
    const g=c.createGain();g.gain.value=0.065;s.connect(lo).connect(hi).connect(g).connect(c.destination);s.start();windGain.current=g;
  }
  async function toggle(){
    try{
      if(!ctx.current){ctx.current=new AudioContext();createWind(ctx.current);}
      if(!media.current){const a=new Audio(import.meta.env.BASE_URL+'audio/meadow.ogg');a.loop=true;a.volume=0.10;media.current=a;}
      if(playing){media.current.pause();await ctx.current.suspend();setPlaying(false);}
      else{const p=ctx.current.resume();const m=media.current.play().catch(()=>{});await p;await m;setPlaying(true);}
    }catch(e){console.warn('Audio unavailable',e);setPlaying(false);}
  }
  async function upload(e:ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0];if(!f)return;
    media.current?.pause();if(sampleUrl.current)URL.revokeObjectURL(sampleUrl.current);
    sampleUrl.current=URL.createObjectURL(f);
    const a=new Audio(sampleUrl.current);a.loop=true;a.volume=0.10;media.current=a;setName(f.name);
    if(playing)try{await a.play();}catch{ /* unsupported file */ }
  }
  useEffect(()=>{
    const id=window.setInterval(()=>{
      if(ctx.current?.state==='running'&&windGain.current)
        windGain.current.gain.setTargetAtTime(0.065+0.016*solar.daylight,ctx.current.currentTime,0.12);
      if(media.current)media.current.volume=0.024+0.13*solar.daylight;
    },300);
    return ()=>{window.clearInterval(id);media.current?.pause();
      if(sampleUrl.current)URL.revokeObjectURL(sampleUrl.current);
      if(ctx.current)void ctx.current.close();};
  },[]);
  return <div className="landscape-audio">
    <button type="button" aria-pressed={playing} onClick={()=>{void toggle();}}>{playing?'Sound on':'Sound off'}</button>
    <label>{name?'Recording loaded':'+ Field recording'}
      <input type="file" accept="audio/*" onChange={e=>{void upload(e);}}/></label>
  </div>;
}
function Clock(){
  const [phase,setPhase]=useState(solar.phase);
  useEffect(()=>{const id=window.setInterval(()=>setPhase(solar.phase),300);return ()=>window.clearInterval(id);},[]);
  const hour=Math.floor(phase*24),minute=Math.floor((phase*24-hour)*60);
  const label=hour<5||hour>=20?'Night':hour<8?'Dawn':hour<17?'Daylight':'Dusk';
  return <div className="landscape-clock"><span>{label}</span>
    <strong>{String(hour).padStart(2,'0')}:{String(minute).padStart(2,'0')}</strong></div>;
}
export default function LiveLandscape(){
  return <div className="landscape-root">
    <Canvas camera={{position:[0.2,1.35,3.6],fov:62,near:0.06,far:2400}}
      dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}
      style={{width:'100%',height:'100%'}} fallback={<p>WebGL is unavailable.</p>}>
      <color attach="background" args={['#11203b']}/><Atmosphere/>
      <GenerateTerrain/><GrassField/><WindSystem/>
      <OrbitControls target={[0,0.4,-1.5]} enablePan={false} minDistance={1}
        maxDistance={9} maxPolarAngle={Math.PI/2-0.035} enableDamping dampingFactor={0.045}/>
    </Canvas>
    <div className="landscape-ui"><Clock/><AmbientSound/></div>
    <span className="landscape-cue">Drag to look around · Move over grass to bend it</span>
  </div>;
}
