import * as THREE from 'three';
import {useFrame,useThree} from '@react-three/fiber';
import {useEffect,useMemo,useRef} from 'react';
import vertex from '@/shaders/grass.vert';
import fragment from '@/shaders/grass.frag';
import {useSunStore} from '@/stores/sunStore';
import {useWindStore} from '@/stores/windStore';
import {getHeight} from '@/utils/terrain';
import {grassGeometry} from '@/utils/grassGeometry';
import {solar} from '@/solar';
import {WakeField} from '@/WakeField';
import {meadowSpec,sampleMeadowCell,type MeadowBand,type MeadowQuality} from '@/meadowLayout';

const BANDS:MeadowBand[]=['near','middle','far'];
function fract(v:number){return v-Math.floor(v);}
function hash(x:number,z:number,seed:number){
  return fract(Math.sin(x*127.1+z*311.7+seed*67.13)*43758.5453);
}
function clumpFor(x:number,z:number){
  const size=0.1,cx=Math.floor(x/size),cz=Math.floor(z/size);
  let best=Infinity,centerX=0,centerZ=0,cellX=0,cellZ=0;
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const ix=cx+dx,iz=cz+dz;
    const sx=(ix+hash(ix,iz,17))*size;
    const sz=(iz+hash(ix,iz,29))*size;
    const dist=(sx-x)*(sx-x)+(sz-z)*(sz-z);
    if(dist<best){best=dist;centerX=sx;centerZ=sz;cellX=ix;cellZ=iz;}
  }
  return {dx:centerX-x,dz:centerZ-z,dist:Math.sqrt(best)/size,
    angle:hash(cellX,cellZ,31)*Math.PI*2+(hash(Math.floor(x*37),Math.floor(z*37),43)-.5)};
}
function meshForBand(quality:MeadowQuality,band:MeadowBand,material:THREE.ShaderMaterial){
  const {extent,spacing,segments}=meadowSpec(quality,band);
  const points:{x:number;z:number;size:number;accent:number}[]=[];
  const steps=Math.ceil(extent/spacing);
  for(let i=-steps;i<steps;i++)for(let j=-steps;j<steps;j++){
    const point=sampleMeadowCell(quality,band,i,j);
    if(point)points.push(point);
  }
  const geometry=grassGeometry(segments,quality==='low'?0.044:0.02,0.5,2.0);
  const count=points.length;
  const angles=new Float32Array(count),centers=new Float32Array(count*2);
  const distances=new Float32Array(count),accents=new Float32Array(count);
  const mesh=new THREE.InstancedMesh(geometry,material,count),dummy=new THREE.Object3D();
  mesh.name='Unified grass / '+band;
  mesh.frustumCulled=false; // World-space bands are one budgeted draw each.
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  for(let i=0;i<count;i++){
    const p=points[i],clump=clumpFor(p.x,p.z);
    dummy.position.set(p.x,getHeight(p.x,-p.z),p.z);
    dummy.scale.setScalar(p.size);
    dummy.rotation.set(0,0,0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
    angles[i]=clump.angle;
    centers[i*2]=clump.dx;centers[i*2+1]=clump.dz;
    distances[i]=clump.dist;accents[i]=p.accent;
  }
  geometry.setAttribute('aClumpAngle',new THREE.InstancedBufferAttribute(angles,1));
  geometry.setAttribute('aClumpCenter',new THREE.InstancedBufferAttribute(centers,2));
  geometry.setAttribute('aClumpDist',new THREE.InstancedBufferAttribute(distances,1));
  geometry.setAttribute('aAccent',new THREE.InstancedBufferAttribute(accents,1));
  mesh.instanceMatrix.needsUpdate=true;
  mesh.computeBoundingSphere();
  return mesh;
}

/** One material, one clock, one height function and one blade family throughout
 * the field. Only instance sampling and far-distance polygon budget vary. */
export function GrassField(){
  const quality:MeadowQuality=useMemo(()=>{
    const low=new URLSearchParams(window.location.search).get('quality')==='low';
    return low?'low':window.matchMedia('(pointer:coarse)').matches?'touch':'desktop';
  },[]);
  const wake=useMemo(()=>new WakeField(128),[]);
  const wakeTexture=useMemo(()=>{
    const t=new THREE.DataTexture(wake.pixels,wake.size,wake.size,THREE.RGBAFormat);
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;
    t.generateMipmaps=false;t.needsUpdate=true;return t;
  },[wake]);
  const material=useMemo(()=>new THREE.ShaderMaterial({
    vertexShader:vertex,fragmentShader:fragment,side:THREE.DoubleSide,
    uniforms:{
      uTime:{value:0},uSunDirection:{value:new THREE.Vector3()},
      uColorSeed:{value:new THREE.Vector2(25.5,13.2)},
      uWaveScale:{value:.08},uWaveSpeed:{value:.15},
      uWaveThreshold:{value:.1},uWaveWidth:{value:.3},uWaveStrength:{value:.4},
      uWindDirection:{value:new THREE.Vector2()},uWindSpeed:{value:.4},
      uWindStrength:{value:.15},uNoiseScale:{value:.15},
      uDirectionVariation:{value:.3},uBendAngle:{value:.8},
      uDomeStrength:{value:.05},uTurbScale:{value:.1},
      uTurbSpeed:{value:.5},uTurbAmount:{value:.03},
      uDaylight:{value:1},uSkyTint:{value:new THREE.Color('#ffffff')},
      uFogColor:{value:new THREE.Color('#7ab0b0')},uRain:{value:0},
      uWakeTexture:{value:wakeTexture},
    },
  }),[wakeTexture]);
  const meshes=useMemo(()=>BANDS.map(band=>meshForBand(quality,band,material)),[quality,material]);
  useEffect(()=>()=>{meshes.forEach(mesh=>mesh.geometry.dispose());material.dispose();wakeTexture.dispose();},[meshes,material,wakeTexture]);

  const {camera,gl}=useThree();
  const pointerNdc=useRef(new THREE.Vector2()),inside=useRef(false);
  const ray=useRef(new THREE.Raycaster()),hit=useRef(new THREE.Vector3());
  const pointer=useRef(new THREE.Vector2(1000,1000));
  const previous=useRef(new THREE.Vector2(1000,1000));
  const wasActive=useRef(false);
  useEffect(()=>{
    const canvas=gl.domElement;
    const move=(event:PointerEvent)=>{
      if(!solar.interactionEnabled)return;
      const box=canvas.getBoundingClientRect();
      if(!box.width||!box.height)return;
      pointerNdc.current.set(2*(event.clientX-box.left)/box.width-1,1-2*(event.clientY-box.top)/box.height);
      inside.current=true;
    };
    const leave=()=>{inside.current=false;wasActive.current=false;};
    canvas.addEventListener('pointermove',move,{passive:true});
    canvas.addEventListener('pointerleave',leave);
    canvas.addEventListener('pointerup',leave);
    canvas.addEventListener('pointercancel',leave);
    window.addEventListener('blur',leave);
    return()=>{
      canvas.removeEventListener('pointermove',move);
      canvas.removeEventListener('pointerleave',leave);
      canvas.removeEventListener('pointerup',leave);
      canvas.removeEventListener('pointercancel',leave);
      window.removeEventListener('blur',leave);
    };
  },[gl]);

  useFrame((_state,delta)=>{
    const wind=useWindStore.getState(),sun=useSunStore.getState(),u=material.uniforms;
    u.uTime.value=wind.time;
    u.uSunDirection.value=sun.sunDirection;
    u.uWaveScale.value=wind.waveScale;u.uWaveSpeed.value=wind.waveSpeed;
    u.uWaveStrength.value=wind.waveStrength;u.uWaveThreshold.value=wind.waveThreshold;
    u.uWaveWidth.value=wind.waveWidth;
    (u.uWindDirection.value as THREE.Vector2).set(wind.directionVec[0],wind.directionVec[1]);
    u.uWindSpeed.value=wind.windSpeed;
    u.uWindStrength.value=wind.currentStrength*solar.windMultiplier*(1+solar.rainMix*.35);
    u.uNoiseScale.value=wind.noiseScale;u.uDirectionVariation.value=wind.directionVariation;
    u.uBendAngle.value=wind.bendAngle;u.uDomeStrength.value=wind.domeStrength;
    u.uTurbScale.value=wind.turbScale;u.uTurbSpeed.value=wind.turbSpeed;
    u.uTurbAmount.value=wind.turbAmount;
    u.uDaylight.value=solar.daylight;u.uRain.value=solar.rainMix;
    (u.uSkyTint.value as THREE.Color).copy(solar.tint);
    (u.uFogColor.value as THREE.Color).copy(solar.fogColor);

    let active=solar.interactionEnabled&&inside.current;
    if(active){
      ray.current.setFromCamera(pointerNdc.current,camera);
      const line=ray.current.ray;
      if(Math.abs(line.direction.y)>0.0001){
        let distance=-line.origin.y/line.direction.y;
        for(let n=0;n<3&&distance>0;n++){
          line.at(distance,hit.current);
          distance=(getHeight(hit.current.x,-hit.current.z)-line.origin.y)/line.direction.y;
        }
        if(distance>0){
          line.at(distance,hit.current);
          if(Math.abs(hit.current.x)<5&&Math.abs(hit.current.z)<5)
            pointer.current.set(hit.current.x,hit.current.z);
          else active=false;
        }else active=false;
      }else active=false;
    }
    const dt=Math.min(delta,.05);
    let motion=0;
    if(active&&wasActive.current){
      const dist=pointer.current.distanceTo(previous.current);
      if(dist>.014&&dist<6){
        const force=Math.min(1,Math.max(.4,dist/Math.max(dt,.016)*.20));
        wake.paint({x:previous.current.x,z:previous.current.y},
          {x:pointer.current.x,z:pointer.current.y},force);
        motion=Math.min(1,dist*4);
      }
    }
    if(wake.tick(dt))wakeTexture.needsUpdate=true;
    solar.cursorMotion+=(motion-solar.cursorMotion)*Math.min(1,dt*(motion>solar.cursorMotion?8:4));
    solar.cursorForce=motion;
    wasActive.current=active;previous.current.copy(pointer.current);
  });
  return <group name="serenity-unified-grass">{meshes.map(mesh=><primitive key={mesh.name} object={mesh}/>)}</group>;
}
