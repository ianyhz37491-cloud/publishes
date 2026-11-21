import {useEffect,useRef,useState} from 'react';
import {solar} from '@/solar';
import {atmosphereWeight} from '@/serenityCycle';

/** Verified field recordings are opt-in and never restarted between portfolio views. */
type TrackId='field'|'meadow'|'forest'|'night'|'touch';
const SOURCES:Record<TrackId,string>={
  field:'audio/fields.ogg',meadow:'audio/meadow.m4a',
  forest:'audio/forest.m4a',night:'audio/night.m4a',touch:'audio/fields.ogg'
};
type Track={id:TrackId;element:HTMLAudioElement;current:number};
type SafariWindow=Window&{webkitAudioContext?:typeof AudioContext};

export function SerenitySound(){
  const [enabled,setEnabled]=useState(false);
  const [failed,setFailed]=useState(false);
  const tracks=useRef<Track[]>([]);
  const running=useRef(false);
  const audio=useRef<AudioContext|null>(null);
  const lowpass=useRef<BiquadFilterNode|null>(null);
  const smoothFocus=useRef(1);

  function stop(){
    running.current=false;
    for(const track of tracks.current){track.element.pause();track.element.volume=0;}
    setEnabled(false);
  }
  async function start(){
    try{
      if(tracks.current.length===0){
        const base=new URL('.',document.baseURI);
        tracks.current=(Object.keys(SOURCES) as TrackId[]).map(id=>{
          const element=new Audio(new URL(SOURCES[id],base).href);
          element.loop=true;element.preload='auto';element.volume=0;
          if(id==='touch')element.addEventListener('loadedmetadata',()=>{
            if(element.duration>8)element.currentTime=7;
          },{once:true});
          return {id,element,current:0};
        });
      }
      // Safari requires that graph construction and play() happen within the gesture.
      if(!audio.current){
        const AudioCtor=window.AudioContext||(window as SafariWindow).webkitAudioContext;
        if(AudioCtor){
          try{
            const ctx=new AudioCtor();
            const filter=ctx.createBiquadFilter();
            filter.type='lowpass';filter.frequency.value=18000;filter.Q.value=.45;
            filter.connect(ctx.destination);
            for(const track of tracks.current){
              const source=ctx.createMediaElementSource(track.element);
              source.connect(filter);
            }
            audio.current=ctx;lowpass.current=filter;
          }catch(error){
            console.warn('Audio filter unavailable; volume ducking remains active.',error);
          }
        }
      }
      const contextResume=audio.current?.resume();
      const results=await Promise.allSettled(tracks.current.map(t=>t.element.play()));
      if(contextResume)await contextResume;
      if(!results.some(result=>result.status==='fulfilled'))
        throw new Error('No countryside recordings could play.');
      running.current=true;setEnabled(true);setFailed(false);
    }catch(error){
      console.error('Serenity audio unavailable:',error);
      stop();setFailed(true);
    }
  }
  useEffect(()=>{
    const interval=window.setInterval(()=>{
      if(!running.current)return;
      const p=solar.phase;
      const weights=[0,1,2,3].map(i=>atmosphereWeight(p,i));
      const contact=Math.max(0,Math.min(1,solar.cursorMotion*1.2));
      const desired:Record<TrackId,number>={
        field:.24,
        forest:weights[0]*.18+weights[1]*.075+weights[2]*.15,
        meadow:weights[0]*.07+weights[1]*.26+weights[2]*.06,
        night:weights[2]*.08+weights[3]*.30,
        touch:.22*contact
      };
      const focusTarget=solar.route==='work'?solar.workSoundLevel:1;
      smoothFocus.current+=(focusTarget-smoothFocus.current)*.095;
      const targetHz=solar.route==='work'&&solar.workMuffle?1250:18000;
      const ctx=audio.current,filter=lowpass.current;
      if(ctx&&filter&&ctx.state==='running'){
        filter.frequency.setTargetAtTime(targetHz,ctx.currentTime,.28);
      }
      for(const track of tracks.current){
        const target=Math.min(1,desired[track.id]*solar.soundVolume*smoothFocus.current);
        track.current+=(target-track.current)*.14;
        if(!track.element.paused)track.element.volume=Math.max(0,Math.min(1,track.current));
      }
    },70);
    const suspend=()=>{if(document.hidden)solar.cursorMotion=0;};
    document.addEventListener('visibilitychange',suspend);
    return ()=>{
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange',suspend);
      running.current=false;
      for(const track of tracks.current){track.element.pause();track.element.removeAttribute('src');track.element.load();}
      tracks.current=[];
      if(audio.current){void audio.current.close();audio.current=null;lowpass.current=null;}
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
    {failed&&<span role="status" className="serenity-audio-error">Audio unavailable</span>}
  </div>;
}
