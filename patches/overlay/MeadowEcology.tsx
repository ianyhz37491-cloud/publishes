import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useEffect,useMemo,useRef} from 'react';
import {getHeight} from '@/utils/terrain';
import {solar} from '@/solar';

const lowQuality=new URLSearchParams(window.location.search).get('quality')==='low';
const coarse=window.matchMedia('(pointer:coarse)').matches;
function rand(seed:number){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
type FlowerSite={x:number;z:number;y:number;h:number;phase:number;angle:number};

/** Three instanced meshes for a meadow of daisies; no individual React objects. */
function Daisies(){
  const stems=useRef<THREE.InstancedMesh>(null);
  const discs=useRef<THREE.InstancedMesh>(null);
  const petals=useRef<THREE.InstancedMesh>(null);
  const flowers=useMemo(()=>{
    const r=rand(1806),total=lowQuality?16:coarse?55:135;
    return Array.from({length:total},()=>{
      const x=(r()-.5)*9.2,z=(r()-.5)*9.2;
      return {x,z,y:getHeight(x,-z),h:.22+r()*.22,phase:r()*Math.PI*2,angle:r()*Math.PI*2};
    });
  },[]);
  const stemGeom=useMemo(()=>new THREE.CylinderGeometry(.012,.018,1,5),[]);
  const petalGeom=useMemo(()=>new THREE.SphereGeometry(1,8,5),[]);
  const discGeom=useMemo(()=>new THREE.SphereGeometry(1,8,6),[]);
  const stemMat=useMemo(()=>new THREE.MeshLambertMaterial({color:'#437a39'}),[]);
  const petalMat=useMemo(()=>new THREE.MeshLambertMaterial({color:'#f7f4df',side:THREE.DoubleSide}),[]);
  const discMat=useMemo(()=>new THREE.MeshLambertMaterial({color:'#dfb849'}),[]);
  const dummy=useMemo(()=>new THREE.Object3D(),[]);
  const acc=useRef(1);
  useEffect(()=>()=>{stemGeom.dispose();petalGeom.dispose();discGeom.dispose();stemMat.dispose();petalMat.dispose();discMat.dispose();},[stemGeom,petalGeom,discGeom,stemMat,petalMat,discMat]);
  useFrame(({clock},dt)=>{
    if(!stems.current||!discs.current||!petals.current)return;
    acc.current+=dt;
    if(acc.current<.055)return;
    acc.current=0;
    const time=clock.getElapsedTime();
    flowers.forEach((f,index)=>{
      const sway=(Math.sin(time*.8+f.phase)+Math.sin(time*.39+f.x*.7)*.36)*.055
        *solar.windMultiplier*(1+solar.rainMix*.28);
      const headX=f.x+sway,headZ=f.z+sway*.43;
      dummy.position.set(f.x+sway*.43,f.y+f.h*.5,f.z+sway*.18);
      dummy.rotation.set(0,0,-sway*.6);
      dummy.scale.set(.7,f.h,.7);dummy.updateMatrix();
      stems.current!.setMatrixAt(index,dummy.matrix);
      dummy.rotation.set(0,0,0);
      dummy.position.set(headX,f.y+f.h,headZ);
      dummy.scale.set(.045,.025,.045);dummy.updateMatrix();
      discs.current!.setMatrixAt(index,dummy.matrix);
      for(let p=0;p<8;p++){
        const angle=f.angle+p*Math.PI/4;
        dummy.position.set(headX+Math.cos(angle)*.064,f.y+f.h-.006,headZ+Math.sin(angle)*.064);
        dummy.rotation.set(-.12,-angle+Math.PI/2,0);
        dummy.scale.set(.032,.009,.073);dummy.updateMatrix();
        petals.current!.setMatrixAt(index*8+p,dummy.matrix);
      }
    });
    stems.current.instanceMatrix.needsUpdate=true;
    discs.current.instanceMatrix.needsUpdate=true;
    petals.current.instanceMatrix.needsUpdate=true;
  });
  return <>
    <instancedMesh ref={stems} args={[stemGeom,stemMat,flowers.length]} frustumCulled={false}/>
    <instancedMesh ref={petals} args={[petalGeom,petalMat,flowers.length*8]} frustumCulled={false}/>
    <instancedMesh ref={discs} args={[discGeom,discMat,flowers.length]} frustumCulled={false}/>
  </>;
}

const wingShape=(()=>{
  const shape=new THREE.Shape();
  shape.moveTo(0,0);
  shape.bezierCurveTo(.16,.06,.23,.22,.09,.23);
  shape.bezierCurveTo(.06,.34,-.10,.26,-.07,.09);
  shape.bezierCurveTo(-.08,.02,-.03,-.03,0,0);
  return shape;
})();

function Butterfly({index}:{index:number}){
  const body=useRef<THREE.Group>(null);
  const left=useRef<THREE.Mesh>(null),right=useRef<THREE.Mesh>(null);
  const wingGeom=useMemo(()=>new THREE.ShapeGeometry(wingShape,6),[]);
  const wingMat=useMemo(()=>new THREE.MeshLambertMaterial({
    color:index%3===0?'#e3bd72':index%3===1?'#f2edd5':'#dfc6a8',
    side:THREE.DoubleSide,transparent:true,opacity:.95
  }),[index]);
  useEffect(()=>()=>{wingGeom.dispose();wingMat.dispose();},[wingGeom,wingMat]);
  useFrame(({clock})=>{
    if(!body.current||!left.current||!right.current)return;
    const t=clock.getElapsedTime(),offset=index*2.19;
    const x=Math.sin(t*.23+offset)*2.8+Math.sin(t*.071+offset)*.7;
    const z=Math.cos(t*.18+offset*1.6)*2.5;
    const y=getHeight(x,-z)+.62+Math.sin(t*.64+offset)*.24;
    body.current.position.set(x,y,z);
    body.current.rotation.y=t*.13+offset+.25*Math.sin(t*.44+offset);
    body.current.rotation.z=.08*Math.sin(t*.85+offset);
    const visibility=solar.daylight>.64&&solar.rainMix<.28;
    body.current.visible=visibility;
    const flap=Math.sin(t*15.5+offset)*.67;
    left.current.rotation.y=flap;
    right.current.rotation.y=-flap;
  });
  return <group ref={body} scale={.72}>
    <mesh rotation={[0,0,Math.PI/2]}>
      <cylinderGeometry args={[.018,.024,.22,6]}/>
      <meshLambertMaterial color="#4b3d2f"/>
    </mesh>
    <mesh ref={left} geometry={wingGeom} material={wingMat} position={[-.01,0,0]} rotation={[0,0,0]}/>
    <mesh ref={right} geometry={wingGeom} material={wingMat} position={[.01,0,0]} scale={[-1,1,1]}/>
  </group>;
}

/** Night insects: point sprites brighten organically rather than constant flashing spheres. */
function Fireflies(){
  const count=lowQuality?14:coarse?36:92;
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry(),r=rand(5021);
    const positions=new Float32Array(count*3), phases=new Float32Array(count);
    for(let i=0;i<count;i++){
      const x=(r()-.5)*9.4,z=(r()-.5)*9.4;
      positions[i*3]=x;positions[i*3+1]=getHeight(x,-z)+.25+r()*1.15;positions[i*3+2]=z;
      phases[i]=r()*Math.PI*2;
    }
    g.setAttribute('position',new THREE.BufferAttribute(positions,3));
    g.setAttribute('aPhase',new THREE.BufferAttribute(phases,1));
    return g;
  },[count]);
  const material=useMemo(()=>new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uDark:{value:0},uRain:{value:0}},
    vertexShader:`
      attribute float aPhase;
      uniform float uTime,uDark,uRain;
      varying float vGlow;
      void main(){
        vec3 p=position;
        p.x+=sin(uTime*.24+aPhase)*.17;
        p.y+=sin(uTime*.48+aPhase*3.1)*.08;
        vGlow=pow(max(.0,sin(uTime*1.2+aPhase*6.0))*.65+.35,2.0)*uDark*(1.0-uRain);
        vec4 eye=modelViewMatrix*vec4(p,1.0);
        gl_PointSize=min(13.0,clamp(22.0/max(1.0,-eye.z),1.3,7.5));
        gl_Position=projectionMatrix*eye;
      }`,
    fragmentShader:`
      precision mediump float;varying float vGlow;
      void main(){
        float r=length(gl_PointCoord-vec2(.5));
        float inner=1.0-smoothstep(.02,.45,r);
        gl_FragColor=vec4(.91,.96,.49,inner*vGlow*.86);
      }`
  }),[]);
  useFrame(({clock})=>{
    material.uniforms.uTime.value=clock.getElapsedTime();
    material.uniforms.uDark.value=Math.max(0,(solar.darkness-.38)/.62);
    material.uniforms.uRain.value=solar.rainMix;
  });
  useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
  return <points geometry={geometry} material={material} frustumCulled={false}/>;
}

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

export function MeadowEcology(){
  return <>
    <Daisies/>
    {Array.from({length:lowQuality?0:coarse?3:6},(_,i)=><Butterfly key={i} index={i}/>)}
    <Fireflies/>
    <Rain/>
  </>;
}
