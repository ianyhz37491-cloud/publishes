import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {CATEGORIES,filterProjects,type CategoryFilter,type ProjectRecord} from '@/projectCatalog';

const MOTION='cubic-bezier(.2,.73,.18,1)';
const motionAllowed=()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ProjectTile({project}:{project:ProjectRecord}){
  return <li className="work-tile" data-project-id={project.id}
    aria-label={`${project.id}, reserved empty slot`}>
    <div className="work-tile-image" aria-hidden="true"><span className="work-tile-marker">—</span></div>
    <div className="work-tile-caption">
      <span className="work-code">{project.id}</span>
      <span className="work-empty">UNPUBLISHED</span>
    </div>
  </li>;
}

function CategoryNav({filter,onSelect}:{filter:CategoryFilter;onSelect:(next:CategoryFilter)=>void}){
  const nav=useRef<HTMLElement>(null);
  const [marker,setMarker]=useState({x:0,width:0,ready:false});
  const measure=useCallback(()=>{
    const container=nav.current;
    const selected=container?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if(!container||!selected)return;
    const outer=container.getBoundingClientRect();
    const rect=selected.getBoundingClientRect();
    setMarker({x:rect.left-outer.left,width:rect.width,ready:true});
  },[]);
  useEffect(()=>{
    let frame=requestAnimationFrame(measure);
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;
    if(nav.current)observer?.observe(nav.current);
    const fontPromise=document.fonts?.ready;
    if(fontPromise)void fontPromise.then(measure);
    return ()=>{cancelAnimationFrame(frame);observer?.disconnect();};
  },[measure,filter]);
  return <nav ref={nav} className="work-filters" aria-label="Project categories">
    {CATEGORIES.map(category=><button type="button" key={category}
      className={filter===category?'is-active':''}
      aria-pressed={filter===category} onClick={()=>onSelect(category)}>{category}</button>)}
    <span aria-hidden="true" className="filter-indicator"
      style={{transform:`translateX(${marker.x}px)`,width:marker.width,opacity:marker.ready?1:0}}/>
  </nav>;
}

/** FLIP reordering: surviving cards slide, excluded cards fade, incoming cards emerge. */
export function AnimatedCatalogue(){
  const [filter,setFilter]=useState<CategoryFilter>('ALL');
  const grid=useRef<HTMLOListElement>(null);
  const ghostLayer=useRef<HTMLDivElement>(null);
  const oldRects=useRef(new Map<string,DOMRect>());
  const previouslyVisible=useRef(new Set<string>());
  const initialized=useRef(false);
  const animations=useRef<Animation[]>([]);

  const changeFilter=useCallback((next:CategoryFilter)=>{
    if(next===filter)return;
    const items=grid.current?.querySelectorAll<HTMLElement>('[data-project-id]');
    oldRects.current.clear();
    previouslyVisible.current.clear();
    animations.current.forEach(animation=>animation.cancel());
    animations.current=[];
    ghostLayer.current?.replaceChildren();
    if(items){
      const containerRect=grid.current!.getBoundingClientRect();
      const nextIds=new Set(filterProjects(next).map(item=>item.id));
      items.forEach(node=>{
        const code=node.dataset.projectId||'';
        const rect=node.getBoundingClientRect();
        oldRects.current.set(code,rect);
        previouslyVisible.current.add(code);
        if(!nextIds.has(code)&&motionAllowed()&&ghostLayer.current){
          const ghost=node.cloneNode(true) as HTMLElement;
          ghost.setAttribute('aria-hidden','true');
          ghost.classList.add('work-tile-ghost');
          Object.assign(ghost.style,{
            position:'absolute',
            top:`${rect.top-containerRect.top}px`,
            left:`${rect.left-containerRect.left}px`,
            width:`${rect.width}px`,
            height:`${rect.height}px`,
            pointerEvents:'none'
          });
          ghostLayer.current.append(ghost);
          const exit=ghost.animate([
            {opacity:1,transform:'translateY(0px) scale(1)'},
            {opacity:0,transform:'translateY(-9px) scale(.94)'}
          ],{duration:260,easing:MOTION,fill:'forwards'});
          void exit.finished.catch(()=>{}).then(()=>ghost.remove());
          animations.current.push(exit);
        }
      });
    }
    setFilter(next);
  },[filter]);

  useLayoutEffect(()=>{
    if(!initialized.current){initialized.current=true;return;}
    const nodes=grid.current?.querySelectorAll<HTMLElement>('[data-project-id]');
    if(!nodes)return;
    if(!motionAllowed()){oldRects.current.clear();return;}
    nodes.forEach(node=>{
      const id=node.dataset.projectId||'';
      const old=oldRects.current.get(id);
      if(old){
        const current=node.getBoundingClientRect();
        const dx=old.left-current.left,dy=old.top-current.top;
        if(Math.abs(dx)+Math.abs(dy)>.5)
          animations.current.push(node.animate([
            {transform:`translate(${dx}px,${dy}px)`},
            {transform:'translate(0,0)'}
          ],{duration:540,easing:MOTION}));
      }else{
        animations.current.push(node.animate([
          {opacity:0,transform:'translateY(18px) scale(.95)'},
          {opacity:1,transform:'translateY(0) scale(1)'}
        ],{duration:440,easing:MOTION}));
      }
    });
    oldRects.current.clear();
  },[filter]);

  useEffect(()=>()=>{animations.current.forEach(a=>a.cancel());},[]);

  const projects=filterProjects(filter);
  return <>
    <CategoryNav filter={filter} onSelect={changeFilter}/>
    <div className="work-explanation" role="status">
      <span>Catalogue structure</span><span>Projects to be published</span>
    </div>
    <div className="work-grid-frame">
      <ol ref={grid} className="work-grid" aria-label={`${projects.length} reserved project slots`}>
        {projects.map(project=><ProjectTile project={project} key={project.id}/>)}
      </ol>
      <div ref={ghostLayer} className="work-grid-ghosts" aria-hidden="true"/>
    </div>
  </>;
}
