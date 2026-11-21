import {useCallback,useEffect,useRef,useState} from 'react';
import {CATEGORIES,filterProjects,type CategoryFilter,type ProjectRecord} from '@/projectCatalog';
import {SerenitySound} from '@/SerenitySound';
import {solar} from '@/solar';
import type {SerenityMood} from '@/serenityCycle';
import {routeFromHash,hashForRoute,type PortfolioRoute} from '@/portfolioRoutes';

const MOODS:SerenityMood[]=['Sunrise','Daylight','Sunset','Night'];

function ProjectTile({project}:{project:ProjectRecord}){
  return <li className="work-tile" aria-label={`${project.id}, reserved empty slot`}>
    <div className="work-tile-image" aria-hidden="true"><span className="work-tile-marker">—</span></div>
    <div className="work-tile-caption">
      <span className="work-code">{project.id}</span>
      <span className="work-empty">UNPUBLISHED</span>
    </div>
  </li>;
}

function FieldControls({onReturn,onReset,visible}:{onReturn:()=>void;onReset:()=>void;visible:boolean}){
  const [open,setOpen]=useState(false);
  const [paused,setPaused]=useState(solar.paused);
  const [duration,setDuration]=useState(solar.cycleSeconds);
  const [wind,setWind]=useState(solar.windMultiplier);
  const [volume,setVolume]=useState(solar.soundVolume);
  const [selectedMood,setSelectedMood]=useState('Automatic');
  const [currentMood,setCurrentMood]=useState<SerenityMood>(solar.mood);
  useEffect(()=>{
    const id=window.setInterval(()=>setCurrentMood(solar.mood),500);
    return ()=>window.clearInterval(id);
  },[]);
  return <aside className={`field-controls ${visible?'field-controls-visible':''}`} aria-hidden={!visible}>
    <div className="field-actions">
      <button type="button" onClick={onReturn}>← Return to work</button>
      <button type="button" aria-expanded={open} aria-controls="field-settings"
        onClick={()=>setOpen(v=>!v)}>{open?'Close settings':'Field settings'} <span aria-hidden="true">{open?'−':'+'}</span></button>
    </div>
    <div className="field-settings" id="field-settings" hidden={!open || !visible}>
      <p className="field-current">{selectedMood==='Automatic'?`Currently ${currentMood.toLowerCase()}`:`${selectedMood.toLowerCase()} · manual`}</p>
      <div className="field-setting">
        <label htmlFor="field-mood">Light</label>
        <select id="field-mood" value={selectedMood} onChange={e=>{
          const next=e.target.value;setSelectedMood(next);
          if(next==='Automatic'){solar.paused=false;setPaused(false);}
          else {setCurrentMood(next as SerenityMood);solar.phaseManual=(MOODS.indexOf(next as SerenityMood)+0.5)/4;solar.paused=true;setPaused(true);}
        }}>
          <option>Automatic</option>
          {MOODS.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>
      <button type="button" className="field-inline-button" aria-pressed={paused}
        onClick={()=>{solar.paused=!solar.paused;setPaused(solar.paused);if(!solar.paused)setSelectedMood('Automatic');}}>
        {paused?'Resume lighting':'Pause lighting'}
      </button>
      <div className="field-setting">
        <label htmlFor="field-cycle">Full day cycle <output>{duration}s</output></label>
        <input id="field-cycle" type="range" min="10" max="180" step="5" value={duration}
          onChange={e=>{const n=Number(e.target.value);solar.cycleSeconds=n;setDuration(n);}}/>
      </div>
      <div className="field-setting">
        <label htmlFor="field-wind">Wind <output>{Math.round(wind*100)}%</output></label>
        <input id="field-wind" type="range" min="0" max="1.8" step="0.1" value={wind}
          onChange={e=>{const n=Number(e.target.value);solar.windMultiplier=n;setWind(n);}}/>
      </div>
      <div className="field-sound">
        <SerenitySound/>
        <label htmlFor="field-volume">Volume <output>{Math.round(volume*100)}%</output></label>
        <input id="field-volume" type="range" min="0" max="1" step="0.05" value={volume}
          onChange={e=>{const n=Number(e.target.value);solar.soundVolume=n;setVolume(n);}}/>
      </div>
      <button type="button" className="field-inline-button" onClick={onReset}>Reset camera</button>
    </div>
  </aside>;
}

export function PortfolioShell({sceneAvailable,onResetCamera,onRouteChange}:{sceneAvailable:boolean;onResetCamera:()=>void;onRouteChange:(route:PortfolioRoute)=>void}){
  const [route,setRoute]=useState<PortfolioRoute>(()=>routeFromHash(window.location.hash));
  const [filter,setFilter]=useState<CategoryFilter>('ALL');
  const returnRoute=useRef<PortfolioRoute>('work');
  const touchStart=useRef<number|null>(null);
  const wheelTotal=useRef(0);
  const landingSection=useRef<HTMLElement>(null);
  const workSection=useRef<HTMLElement>(null);
  const fieldSection=useRef<HTMLElement>(null);
  const navigate=useCallback((next:PortfolioRoute)=>{
    const hash=hashForRoute(next);
    if(window.location.hash!==hash)window.location.hash=hash;
    setRoute(next);
  },[]);
  useEffect(()=>onRouteChange(route),[route,onRouteChange]);
  useEffect(()=>{
    const section=route==='landing'?landingSection.current:route==='work'?workSection.current:fieldSection.current;
    section?.focus({preventScroll:true});
  },[route]);
  useEffect(()=>{if(!sceneAvailable && route==='field')navigate('work');},[sceneAvailable,route,navigate]);
  const enter=useCallback(()=>navigate('work'),[navigate]);
  const leaveField=useCallback(()=>navigate(returnRoute.current),[navigate]);
  useEffect(()=>{
    const change=()=>setRoute(routeFromHash(window.location.hash));
    window.addEventListener('hashchange',change);
    return ()=>window.removeEventListener('hashchange',change);
  },[]);
  useEffect(()=>{
    solar.interactionEnabled=route==='field';
    solar.cursorMotion=0;
  },[route]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&route==='field'){event.preventDefault();leaveField();return;}
      if(route==='landing'&&['ArrowDown','PageDown','Enter'].includes(event.key)
        &&!(event.target instanceof HTMLButtonElement)){
        event.preventDefault();enter();
      }
    };
    const wheel=(event:WheelEvent)=>{
      if(route!=='landing')return;
      if(event.deltaY<0){wheelTotal.current=0;return;}
      wheelTotal.current+=event.deltaY;
      if(wheelTotal.current>48){wheelTotal.current=0;enter();}
    };
    window.addEventListener('keydown',key);
    window.addEventListener('wheel',wheel,{passive:true});
    return ()=>{window.removeEventListener('keydown',key);window.removeEventListener('wheel',wheel);};
  },[route,enter,leaveField]);
  const openField=()=>{
    if(!sceneAvailable)return;
    returnRoute.current=route==='landing'?'landing':'work';
    navigate('field');
  };
  const projects=filterProjects(filter);
  return <div className={`portfolio-ui view-${route}`}>
    <section ref={landingSection} tabIndex={-1} className="portfolio-landing" aria-hidden={route!=='landing'}
      onTouchStart={e=>{touchStart.current=e.touches[0]?.clientY??null;}}
      onTouchEnd={e=>{if(touchStart.current!==null&&touchStart.current-e.changedTouches[0].clientY>55)enter();touchStart.current=null;}}>
      <button className="portfolio-entry" type="button" onClick={enter} tabIndex={route==='landing'?0:-1}
        aria-label="Enter interactive portfolio and view projects">
        <span className="portfolio-entry-title">interactive portfolio</span>
        <span className="portfolio-entry-subtitle">enter</span>
      </button>
      <button className="portfolio-down" type="button" onClick={enter} tabIndex={route==='landing'?0:-1}
        aria-label="Scroll down to projects">
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 15 L20 26 L31 15" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
      </button>
    </section>
    <section ref={workSection} tabIndex={-1} className="portfolio-work" aria-label="Project catalogue" aria-hidden={route!=='work'}>
      <div className="portfolio-work-scroll">
        <div className="work-topline">
          <button type="button" className="work-back" onClick={()=>navigate('landing')} tabIndex={route==='work'?0:-1}>← Field</button>
          <span className="work-topline-brand">INDEX OF WORK</span>
          <span className="work-topline-meta">PORTFOLIO / 001</span>
        </div>
        <nav className="work-filters" aria-label="Project categories">
          {CATEGORIES.map(category=><button type="button" key={category}
            className={filter===category?'is-active':''} aria-pressed={filter===category}
            tabIndex={route==='work'?0:-1} onClick={()=>setFilter(category)}>{category}</button>)}
        </nav>
        <div className="work-explanation" role="status">
          <span>Catalogue structure</span><span>Projects to be published</span>
        </div>
        <ol className="work-grid" aria-label={`${projects.length} reserved project slots`}>
          {projects.map(project=><ProjectTile project={project} key={project.id}/>)}
        </ol>
        <div className="work-endnote">Portfolio entries have not been published yet. No sample projects are represented as completed work.</div>
      </div>
      <button type="button" className="work-free-roam" disabled={!sceneAvailable} onClick={openField}
        title={!sceneAvailable?'3D landscape unavailable in this browser':undefined}
        tabIndex={route==='work'?0:-1}>{sceneAvailable?'Enter field ↗':'Field unavailable'}</button>
    </section>
    <section ref={fieldSection} tabIndex={-1} className="portfolio-field" aria-label="Interactive field" aria-hidden={route!=='field'}>
      <div className="field-tip">Drag to look around · Move across the grass</div>
    </section>
    <FieldControls onReturn={leaveField} onReset={onResetCamera} visible={route==='field'}/>
  </div>;
}
