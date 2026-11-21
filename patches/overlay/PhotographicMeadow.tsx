import {useEffect,useRef,useState} from 'react';

const FILES={
  background:'media/meadow-depth/background.webp',
  original:'media/meadow-depth/original.webp',
  stems:'media/meadow-depth/stems.webp',
  near:'media/meadow-depth/near.webp',
} as const;
const urls=Object.fromEntries(
  Object.entries(FILES).map(([key,path])=>[key,new URL(path,document.baseURI).href])
) as Record<keyof typeof FILES,string>;

type Props={active:boolean};

/**
 * A genuine photographic scene with fine vegetation alpha edges. This is
 * constrained 2.5D, not a 3D free-roam engine. The orb is inserted *between*
 * actual photographic layers rather than simply drawn over a stock image.
 */
export function PhotographicMeadow({active}:Props){
  const root=useRef<HTMLDivElement>(null);
  const stage=useRef<HTMLDivElement>(null);
  const raf=useRef(0);
  const pointer=useRef({x:0,y:0});
  const smooth=useRef({x:0,y:0});
  const [missing,setMissing]=useState(false);
  const [orbVisible,setOrbVisible]=useState(true);
  const [isMoving,setMoving]=useState(true);
  useEffect(()=>{
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setMoving(!reduced.matches);
    reduced.addEventListener('change',change);change();
    return()=>reduced.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    if(!active||missing||!stage.current)return;
    let last=performance.now(),elapsed=0;
    const draw=(now:number)=>{
      const dt=Math.min(.07,Math.max(0,(now-last)/1000));last=now;
      elapsed+=dt;
      const easing=1-Math.exp(-dt*3.3);
      smooth.current.x+=(pointer.current.x-smooth.current.x)*easing;
      smooth.current.y+=(pointer.current.y-smooth.current.y)*easing;
      const x=smooth.current.x,y=smooth.current.y;
      const node=stage.current;
      if(node){
        const drift=isMoving?Math.sin(elapsed*.34)*.014:0;
        const bob=isMoving?Math.sin(elapsed*.71)*.016:0;
        node.style.setProperty('--photo-bg-x',`${(-x*5).toFixed(2)}px`);
        node.style.setProperty('--photo-bg-y',`${(-y*3).toFixed(2)}px`);
        node.style.setProperty('--photo-stem-x',`${(x*9).toFixed(2)}px`);
        node.style.setProperty('--photo-stem-y',`${(y*6).toFixed(2)}px`);
        node.style.setProperty('--photo-near-x',`${(x*17).toFixed(2)}px`);
        node.style.setProperty('--photo-near-y',`${(y*11).toFixed(2)}px`);
        node.style.setProperty('--orb-left',`${((.49+x*.20+drift)*100).toFixed(2)}%`);
        node.style.setProperty('--orb-top',`${((.57+y*.135+bob)*100).toFixed(2)}%`);
      }
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(raf.current);
  },[active,missing,isMoving]);
  const onMove=(clientX:number,clientY:number)=>{
    if(!active||!root.current)return;
    const r=root.current.getBoundingClientRect();
    pointer.current.x=Math.max(-1,Math.min(1,(clientX-r.left-r.width/2)/(r.width/2)));
    pointer.current.y=Math.max(-1,Math.min(1,(clientY-r.top-r.height/2)/(r.height/2)));
  };
  return <div ref={root} className={`photographic-meadow ${active?'is-active':''}`}
    aria-hidden={!active} data-depth-scene="photographic"
    onPointerMove={e=>onMove(e.clientX,e.clientY)}
    onPointerLeave={()=>{pointer.current.x=0;pointer.current.y=0;}}
    onTouchMove={e=>{
      const touch=e.touches[0];if(touch)onMove(touch.clientX,touch.clientY);
    }}>
    <div className="photo-depth-stage" ref={stage}>
      <img className="photo-depth-background" src={urls.background} alt=""
        draggable={false}
        onError={()=>setMissing(true)}/>
      {orbVisible&&<div className="photo-depth-orb" aria-hidden="true"><span className="orb-glint"/></div>}
      <img className="photo-depth-stems" src={urls.stems} alt="" draggable={false}/>
      <img className="photo-depth-near" src={urls.near} alt="" draggable={false}/>
      <div className="photo-depth-grain" aria-hidden="true"/>
    </div>
    <div className="photo-depth-corner" aria-hidden="true">
      <span>PHOTOGRAPHIC STUDY / 01</span>
      <span>SPENCER DEMERA · UNSPLASH</span>
    </div>
    <div className="photo-depth-tools">
      <button type="button" tabIndex={active?0:-1}
        aria-pressed={orbVisible} onClick={()=>setOrbVisible(v=>!v)}>
        {orbVisible?'Hide object':'Show object'}
      </button>
      <span className="photo-depth-instruction">Move pointer for parallax</span>
    </div>
    {missing&&<div className="photo-depth-error" role="status">
      The photographic layers are unavailable. Return to the 3D meadow.
    </div>}
  </div>;
}
