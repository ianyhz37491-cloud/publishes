import * as THREE from 'three';
import {useFrame} from '@react-three/fiber';
import {useEffect,useMemo} from 'react';
import {getHeight} from '@/utils/terrain';
import {useWindStore} from '@/stores/windStore';
import {solar} from '@/solar';
import {smoothstep,type MeadowQuality} from '@/meadowLayout';

/**
 * Distant grass clumps are geometry LOD, not a photographic scene or a terrain
 * colour overlay. The atlas is drawn from tapered leaves with the same
 * Zephyr-derived root/tip palette; 28–42 leaves share one GPU quad instance.
 * Crossed cutouts supply volume without thousands of high-cost vertex-shaded
 * single blades. Full Zephyr blades remain authoritative in near/middle range.
 */
function hash(i:number,j:number,s:number){
  const a=Math.sin(i*127.1+j*311.7+s*74.29)*43758.5453123;
  return a-Math.floor(a);
}
function makeTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas 2D required for procedural grass cutouts');
  for(let variant=0;variant<4;variant++){
    let seed=variant*1057+7741;
    const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    ctx.save();ctx.translate(variant*256,0);
    // Back-to-front layering prevents a transparent rectangular tuft silhouette.
    const leaves=36+variant*2;
    for(let layer=0;layer<leaves;layer++){
      const rootX=42+rand()*172;
      const baseY=244+rand()*15;
      const high=75+rand()*153;
      const tipX=Math.max(3,Math.min(253,rootX+(rand()-.5)*118));
      const drift=(rand()-.5)*30;
      const width=2.4+rand()*7.5;
      const shade=.80+rand()*.30;
      const gradient=ctx.createLinearGradient(rootX,baseY,tipX,baseY-high);
      gradient.addColorStop(0,`rgb(${Math.round(23*shade)},${Math.round(57*shade)},${Math.round(18*shade)})`);
      gradient.addColorStop(.56,`rgb(${Math.round(42*shade)},${Math.round(89*shade)},${Math.round(27*shade)})`);
      gradient.addColorStop(1,`rgb(${Math.round(73*shade)},${Math.round(137*shade)},${Math.round(42*shade)})`);
      ctx.beginPath();
      ctx.moveTo(rootX-width,baseY);
      ctx.bezierCurveTo(rootX-width+drift*.25,baseY-high*.40,tipX-drift*.30,baseY-high*.82,tipX,baseY-high);
      ctx.bezierCurveTo(tipX+width*.25,baseY-high*.72,rootX+width+drift*.4,baseY-high*.24,rootX+width,baseY);
      ctx.closePath();
      ctx.fillStyle=gradient;ctx.fill();
    }
    ctx.restore();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.ClampToEdgeWrapping;
  texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=2;
  texture.generateMipmaps=true;
  return texture;
}
function clumpGeometry(){
  // One crossed leaf silhouette in local coordinates; no camera-facing sprites.
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(const angle of [0,Math.PI*.5]){
    const start=positions.length/3;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    for(let row=0;row<3;row++){
      const y=row*.275;
      for(let side=0;side<2;side++){
        const x=(side===0?-.27:.27);
        positions.push(x*cos,y,x*sin);
        uvs.push(side,row*.5);
      }
    }
    for(let row=0;row<2;row++){
      const idx=start+row*2;
      indices.push(idx,idx+1,idx+2,idx+1,idx+3,idx+2);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
type Clump={x:number;z:number;size:number;variation:number;angle:number};
function clumps(quality:MeadowQuality){
  const spacing=quality==='desktop'?0.36:quality==='touch'?0.52:0.78;
  const radius=quality==='desktop'?56:quality==='touch'?49:43;
  const n=Math.ceil(radius/spacing);
  const points:Clump[]=[];
  for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){
    const x=(i+.5+(hash(i,j,1)-.5)*.82)*spacing;
    const z=(j+.5+(hash(i,j,2)-.5)*.82)*spacing;
    const r=Math.hypot(x,z);
    if(r>radius)continue;
    // Blend in under physical middle-grass geometry. Avoid special square edges.
    const fadeIn=smoothstep(6.2,12,r);
    const fadeOut=1-smoothstep(radius-12,radius,r);
    const thinning=r<21?.88:r<39?.64:.45;
    if(hash(i,j,3)>fadeIn*fadeOut*thinning)continue;
    points.push({x,z,
      size:.80+hash(i,j,4)*.32,
      angle:hash(i,j,5)*Math.PI*2,
      variation:Math.floor(hash(i,j,6)*4),
    });
  }
  return points;
}

export function MeadowCanopy(){
  const quality:MeadowQuality=useMemo(()=>{
    const low=new URLSearchParams(window.location.search).get('quality')==='low';
    return low?'low':window.matchMedia('(pointer:coarse)').matches?'touch':'desktop';
  },[]);
  const cutouts=useMemo(makeTexture,[]);
  const geometry=useMemo(clumpGeometry,[]);
  const material=useMemo(()=>new THREE.ShaderMaterial({
    side:THREE.DoubleSide,transparent:false,depthWrite:true,
    uniforms:{
      uAtlas:{value:cutouts},uTime:{value:0},uWind:{value:0},
      uWindDirection:{value:new THREE.Vector2(1,0)},
      uDaylight:{value:1},uNight:{value:0},uRain:{value:0},
      uFogColor:{value:new THREE.Color('#7ab0b0')},
    },
    vertexShader:`
      attribute float aVariant;
      uniform float uTime,uWind;
      uniform vec2 uWindDirection;
      varying vec2 vUv;varying vec3 vWorld;
      void main(){
        vUv=vec2((uv.x+aVariant)*.25,uv.y);
        vec4 origin=modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.);
        vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);
        float influence=pow(uv.y,1.6);
        float wave=sin(uTime*.68+origin.x*.29+origin.z*.32)*.055
          +sin(uTime*.31+origin.x*.17-origin.z*.24)*.04;
        world.xz+=uWindDirection*(.022+wave)*influence*uWind;
        vWorld=world.xyz;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      precision mediump float;
      uniform sampler2D uAtlas;
      uniform float uDaylight,uNight,uRain;
      uniform vec3 uFogColor;
      varying vec2 vUv;varying vec3 vWorld;
      void main(){
        vec4 leaf=texture2D(uAtlas,vUv);
        if(leaf.a<.27)discard;
        vec3 green=leaf.rgb*clamp(.25+uDaylight*.80,0.,1.0);
        green=mix(green,vec3(.08,.17,.245)*(0.70+vUv.y*.28),smoothstep(.33,1.,uNight));
        green=mix(green,vec3(.12,.24,.19),uRain*.14);
        float fog=smoothstep(19.,81.,length(vWorld.xz));
        green=mix(green,uFogColor,fog*.96);
        gl_FragColor=vec4(green,1.);
      }`,
  }),[cutouts]);
  const mesh=useMemo(()=>{
    const points=clumps(quality);
    const instanced=new THREE.InstancedMesh(geometry,material,points.length);
    instanced.name='Procedural distant Zephyr grass clumps';
    instanced.frustumCulled=false;
    const dummy=new THREE.Object3D();
    const variants=new Float32Array(points.length);
    for(let i=0;i<points.length;i++){
      const point=points[i];
      dummy.position.set(point.x,getHeight(point.x,-point.z)-.012,point.z);
      dummy.rotation.set(0,point.angle,0);
      dummy.scale.setScalar(point.size);
      dummy.updateMatrix();
      instanced.setMatrixAt(i,dummy.matrix);
      variants[i]=point.variation;
    }
    geometry.setAttribute('aVariant',new THREE.InstancedBufferAttribute(variants,1));
    instanced.instanceMatrix.needsUpdate=true;
    instanced.computeBoundingSphere();
    return instanced;
  },[geometry,material,quality]);
  useFrame(()=>{
    const state=useWindStore.getState(),u=material.uniforms;
    u.uTime.value=state.time;
    u.uWind.value=solar.windMultiplier*(1+solar.rainMix*.25);
    (u.uWindDirection.value as THREE.Vector2).set(state.directionVec[0],state.directionVec[1]);
    u.uDaylight.value=solar.daylight;
    u.uNight.value=solar.darkness;
    u.uRain.value=solar.rainMix;
    (u.uFogColor.value as THREE.Color).copy(solar.fogColor);
  });
  useEffect(()=>()=>{mesh.dispose();geometry.dispose();material.dispose();cutouts.dispose();},[mesh,geometry,material,cutouts]);
  return <primitive object={mesh}/>;
}
