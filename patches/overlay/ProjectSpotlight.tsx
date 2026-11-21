import {useEffect,useRef} from 'react';
import type {ProjectRecord} from '@/projectCatalog';

type Props={
  project:ProjectRecord|null;
  onClose:()=>void;
  onHover:(project:ProjectRecord)=>void;
  onLeave:()=>void;
};

/** Compact editorial project presentation, not a separate portfolio route.
 * Photo foreground is a masked layer over the same original image. This is
 * bounded 2.5D parallax, not a reconstructed 3D environment.
 */
export function ProjectSpotlight({project,onClose,onHover,onLeave}:Props){
  const panel=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!project)return;
    const handle=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}};
    window.addEventListener('keydown',handle);
    return ()=>window.removeEventListener('keydown',handle);
  },[project,onClose]);
  if(!project||project.status!=='published')return null;
  const photo=new URL(project.thumbnail||'',document.baseURI).href;
  const explore=project.liveUrl;
  return <div className="project-spotlight-scrim" onClick={onClose}>
    <section className="project-spotlight" role="dialog" aria-modal="false"
      aria-label={`Preview ${project.id}`}
      ref={panel}
      onClick={event=>event.stopPropagation()}
      onPointerEnter={()=>onHover(project)}
      onPointerLeave={onLeave}
      onPointerMove={event=>{
        if(event.pointerType==='touch')return;
        const rect=event.currentTarget.getBoundingClientRect();
        const x=((event.clientX-rect.left)/rect.width-.5)*2;
        const y=((event.clientY-rect.top)/rect.height-.5)*2;
        event.currentTarget.style.setProperty('--depth-x',`${Math.max(-1,Math.min(1,x)).toFixed(3)}`);
        event.currentTarget.style.setProperty('--depth-y',`${Math.max(-1,Math.min(1,y)).toFixed(3)}`);
      }}>
      <div className="project-spotlight-image">
        <img className="project-spotlight-background" src={photo} alt="A real photograph of an open book in dappled sunlight" />
        <img className="project-spotlight-foreground" src={photo} alt="" aria-hidden="true"/>
        <span className="project-spotlight-image-note">PHOTOGRAPHIC STUDY / BOOK & LIGHT</span>
      </div>
      <div className="project-spotlight-content">
        <div className="project-spotlight-top">
          <span>SELECTED WORK / {project.id}</span>
          <button type="button" className="project-spotlight-close" aria-label="Close project preview" onClick={onClose}>×</button>
        </div>
        <div className="project-spotlight-copy">
          <span className="project-spotlight-overline">01 / LANGUAGE & READING</span>
          <h2>Reading across <em>languages.</em></h2>
          <p>An experimental reading environment for books and documents. Original passages stay in place while contextual language tools and paragraph-aligned translation bring meaning closer to the text.</p>
          <div className="project-spotlight-details">
            <span>EPUB / PDF / WEB TEXT</span>
            <span>BROWSER-LOCAL LIBRARY</span>
            <span>PUBLIC BETA</span>
          </div>
        </div>
        <div className="project-spotlight-bottom">
          <span>VIEW THE WORKING READER</span>
          {explore&&<a href={explore} target="_blank" rel="noopener noreferrer"
            className="project-spotlight-visit" aria-label="Open published multilingual reader in a new tab">
            VISIT PROJECT <span aria-hidden="true">↗</span>
          </a>}
        </div>
      </div>
    </section>
  </div>;
}
