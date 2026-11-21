import {useEffect,useRef,useState} from 'react';
import {solar} from '@/solar';
import {atmosphereWeight} from '@/serenityCycle';

/** All sound layers are licensed field recordings, not oscillator/noise synthesis.
 * Files are copied from source repositories with Git-blob integrity checks in CI.
 */
type TrackId='field'|'meadow'|'forest'|'night'|'touch';
const SOURCES:Record<TrackId,string>={
  field:'audio/fields.ogg', meadow:'audio/meadow.m4a',
  forest:'audio/forest.m4a', night:'audio/night.m4a',
  touch:'audio/fields.ogg'
};
type Track={id:TrackId;element:HTMLAudioElement;current:number};

export function SerenitySound(){
  const [enabled,setEnabled]=useState(false);
  const [failed,setFailed]=useState(false);
  const tracks=useRef<Track[]>([]);
  const running=useRef(false);
  const interval=useRef<number|undefined>(undefined);
  const volume=useRef(0.78);

  function stop(){
    running.current=false;
    for(const track of tracks.current){
      track.element.pause();
      track.element.volume=0;
    }
    setEnabled(false);
  }
  async function start(){
    try{
      if(tracks.current.length===0){
        const base=new URL(import.meta.env.BASE_URL,window.location.origin);
        tracks.current=(Object.keys(SOURCES) as TrackId[]).map(id=>{
          const url=new URL(SOURCES[id],base).href;
          const element=new Audio(url);
          element.loop=true;
          element.preload='auto';
          element.volume=0;
          if(id==='touch')element.addEventListener('loadedmetadata',()=>{
            if(element.duration>8)element.currentTime=7.0;
          },{once:true});
          return {id,element,current:0};
        });
      }
      // Start all players inside the user click; Safari blocks non-gesture starts.
      const results=await Promise.allSettled(tracks.current.map(t=>t.element.play()));
      const available=results.filter(r=>r.status==='fulfilled').length;
      if(available===0)throw new Error('No licensed sound recordings could play.');
      running.current=true;setEnabled(true);setFailed(false);
    }catch(e){
      console.error('Serenity audio unavailable:',e);
      stop();setFailed(true);
    }
  }
  useEffect(()=>{
    interval.current=window.setInterval(()=>{
      if(!running.current)return;
      const p=solar.phase;
      const weights=[0,1,2,3].map(i=>atmosphereWeight(p,i));
      // Natural ambience changes composition through a shared continuous clock.
      // No clips are restarted at a stage boundary.
      const contact=Math.max(0,Math.min(1,solar.cursorMotion*1.2));
      const desired:Record<TrackId,number>={
        field:0.24,
        forest:weights[0]*0.18+weights[1]*0.075+weights[2]*0.15,
        meadow:weights[0]*0.07+weights[1]*0.26+weights[2]*0.06,
        night:weights[2]*0.08+weights[3]*0.30,
        touch:0.22*contact
      };
      for(const track of tracks.current){
        const target=Math.min(1,desired[track.id]*volume.current);
        track.current+= (target-track.current)*0.14;
        if(!track.element.paused)track.element.volume=Math.max(0,Math.min(1,track.current));
      }
    },70);
    return ()=>{if(interval.current!==undefined)window.clearInterval(interval.current);
      running.current=false;
      for(const track of tracks.current){track.element.pause();track.element.removeAttribute('src');track.element.load();}
      tracks.current=[];
    };
  },[]);
  return <div className="serenity-sound">
    <button type="button" aria-pressed={enabled}
      aria-label={enabled?'Mute the landscape':'Hear the landscape'}
      title={enabled?'Mute the landscape':'Hear the landscape'}
      onClick={()=>{if(running.current)stop();else void start();}}>
      <span aria-hidden="true">{enabled?'♪':'♫'}</span>
      {enabled?'Sound on':'Sound off'}
    </button>
    {failed&&<span role="status" className="serenity-audio-error">Audio could not load</span>}
  </div>;
}
