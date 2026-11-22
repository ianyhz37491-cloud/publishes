import {Canvas} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {Leva} from 'leva';
import {Component,useRef,useState,type ComponentRef,type ReactNode} from 'react';
import {MeadowWorld} from '@/MeadowWorld';
import {MeadowRain} from '@/MeadowRain';
import {GrassField} from '@/components/GrassField';
import {WindSystem} from '@/components/WindSystem';
import {SerenityAtmosphere} from '@/SerenityAtmosphere';
import {PortfolioShell} from '@/PortfolioShell';
import {routeFromHash,type PortfolioRoute} from '@/portfolioRoutes';
import '@/live.css';

function hasWebGL(){
  try{
    const canvas=document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  }catch{return false;}
}

class SceneBoundary extends Component<{children:ReactNode;onError:()=>void},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error:Error){console.error('Serenity scene unavailable:',error);this.props.onError();}
  render(){return this.state.failed?<div className="landscape-fallback" aria-hidden="true"/>:this.props.children;}
}

/** The canvas mounts exactly once. Changing routes only changes the DOM overlay. */
export default function LiveLandscape(){
  const [view,setView]=useState<PortfolioRoute>(()=>routeFromHash(window.location.hash));
  const [sceneAvailable,setSceneAvailable]=useState(hasWebGL);
  const controls=useRef<ComponentRef<typeof OrbitControls>>(null);
  const resetCamera=()=>{
    if(!controls.current)return;
    controls.current.object.position.set(0.2,1.35,3.6);
    controls.current.target.set(0,0.4,-1.5);
    controls.current.update();
  };
  return <main className={`landscape-root landscape-${view}`}>
    <div className="landscape-poster" aria-hidden="true"/>
    <Leva hidden/>
    <SceneBoundary onError={()=>setSceneAvailable(false)}>
      {sceneAvailable&&<Canvas
        camera={{position:[0.2,1.35,3.6],fov:62,near:0.06,far:2400}}
        dpr={[1,1.5]} gl={{antialias:true,powerPreference:'high-performance'}}
        className="landscape-canvas"
        style={{width:'100%',height:'100%',pointerEvents:view==='field'?'auto':'none'}}
        fallback={<div className="landscape-fallback" role="alert">3D view unavailable. Browse the project catalogue instead.</div>}>
        <color attach="background" args={['#192d43']}/>
        <SerenityAtmosphere/>
        <MeadowWorld/><GrassField/><WindSystem/><MeadowRain/>
        <OrbitControls ref={controls} target={[0,0.4,-1.5]} enablePan={false}
          minDistance={1.4} maxDistance={6.5}
          minPolarAngle={1.13} maxPolarAngle={Math.PI/2-0.045} enableDamping dampingFactor={0.045}/>
      </Canvas>}
    </SceneBoundary>
    <PortfolioShell sceneAvailable={sceneAvailable} onResetCamera={resetCamera}
      onRouteChange={setView}/>
  </main>;
}
