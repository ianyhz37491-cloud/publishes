import {Canvas} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {Leva} from 'leva';
import {useEffect,useState} from 'react';
import {GenerateTerrain} from '@/components/Terrain';
import {GrassField} from '@/components/GrassField';
import {WindSystem} from '@/components/WindSystem';
import {SerenityAtmosphere} from '@/SerenityAtmosphere';
import {SerenitySound} from '@/SerenitySound';
import {solar} from '@/solar';
import type {SerenityMood} from '@/serenityCycle';
import '@/live.css';

function MoodIndicator(){
  const [mood,setMood]=useState<SerenityMood>(solar.mood);
  const [paused,setPaused]=useState(solar.paused);
  useEffect(()=>{
    const id=window.setInterval(()=>setMood(solar.mood),140);
    return ()=>window.clearInterval(id);
  },[]);
  const stageNames:SerenityMood[]=['Sunrise','Daylight','Sunset','Night'];
  return <div className="serenity-moods" aria-label="Four equal-length lighting moods">
    <div className="serenity-current">
      <strong>{mood}</strong>
      <button type="button" className="serenity-pause" aria-pressed={paused}
        onClick={()=>{solar.paused=!solar.paused;setPaused(solar.paused);}}>
        {paused?'Resume':'Pause'}
      </button>
    </div>
    <div className="serenity-quarters" role="group" aria-label="Sunrise, day, sunset, night">
      {stageNames.map((name,i)=><span className={name===mood?'active':''}
        title={name} key={i} aria-label={name===mood?name+' now':name}/>)}
    </div>
  </div>;
}

export default function LiveLandscape(){
  return <main className="landscape-root">
    <Leva hidden/>
    <Canvas camera={{position:[0.2,1.35,3.6],fov:62,near:0.06,far:2400}}
      dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}
      style={{width:'100%',height:'100%'}}
      fallback={<p role="alert">This experience needs WebGL.</p>}>
      <color attach="background" args={['#192d43']}/>
      <SerenityAtmosphere/>
      <GenerateTerrain/><GrassField/><WindSystem/>
      <OrbitControls target={[0,0.4,-1.5]} enablePan={false}
        minDistance={1} maxDistance={9}
        maxPolarAngle={Math.PI/2-0.035} enableDamping dampingFactor={0.045}/>
    </Canvas>
    <header className="serenity-heading">
      <h1>Serenity</h1>
      <p>An open field, four passing moods</p>
    </header>
    <footer className="serenity-footer">
      <MoodIndicator/><SerenitySound/>
    </footer>
    <p className="serenity-cue">Move slowly across the grass · Drag to look around</p>
  </main>;
}
