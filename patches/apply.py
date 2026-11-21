#!/usr/bin/env python3
"""Apply the website-specific, source-level modifications to a pinned Zephyr checkout.

This intentionally patches *upstream source* rather than building another forest engine.
Fail on upstream changes instead of silently replacing user code.
"""
from pathlib import Path
import sys

repo = Path(sys.argv[1] if len(sys.argv)>1 else "zephyr").resolve()

def edit(rel, old, new):
    p = repo / rel
    src = p.read_text()
    if src.count(old) != 1:
        raise RuntimeError(f"{rel}: expected one anchor for {old[:65]!r}, found {src.count(old)}")
    p.write_text(src.replace(old,new,1))

def section(rel, begin, end, replacement):
    p = repo / rel
    src = p.read_text()
    if src.count(begin)!=1 or src.count(end)!=1:
        raise RuntimeError(f"{rel}: changed shader anchors")
    start=src.index(begin)
    finish=src.index(end,start)+len(end)
    p.write_text(src[:start]+replacement+src[finish:])

edit("src/main.tsx","import App from '@/App.tsx';","import App from '@/LiveLandscape.tsx';")
edit("index.html","<title>zephyr</title>", """<title>Interactive portfolio — Serenity</title>
        <meta name="description" content="An interactive portfolio with a living grassland and project catalogue." />
        <meta name="theme-color" content="#192d43" />""")

# Preserve upstream geometry, terrain, and the entire gust noise field.
for old,new in [
    ("const float SWAY_FREQ = 2.0;","const float SWAY_FREQ = 0.68;"),
    ("const float SWAY_OSCIL_WEIGHT = 0.4;","const float SWAY_OSCIL_WEIGHT = 0.16;"),
    ("const float SWAY_LEAN_WEIGHT = 0.6;","const float SWAY_LEAN_WEIGHT = 0.84;")
]:
    edit("src/shaders/grass.vert",old,new)

edit("src/shaders/grass.vert","uniform vec2 uColorSeed;", """uniform vec2 uColorSeed;
uniform sampler2D uWakeTexture;""")
edit("src/shaders/grass.vert",
    "    bentPos.xz += turbulence;",
    """    bentPos.xz += turbulence;
    // Persistent wake overlays existing wind without moving blade roots.
    vec2 wakeUv=(worldPos.xz+vec2(5.0))*0.1;
    vec4 wake=texture2D(uWakeTexture,clamp(wakeUv,vec2(0.0),vec2(1.0)));
    float inField=step(0.0,wakeUv.x)*step(wakeUv.x,1.0)*step(0.0,wakeUv.y)*step(wakeUv.y,1.0);
    float rootMask=pow(vUv.y,1.85);
    vec2 wakeDirection=(wake.rg*2.0-1.0)*wake.b*inField;
    bentPos.xz += wakeDirection*0.72*rootMask;
    bentPos.y -= wake.b*0.065*rootMask*inField;""")

edit("src/shaders/grass.frag","uniform vec3 uSunDirection;", """uniform vec3 uSunDirection;
uniform float uDaylight;
uniform vec3 uSkyTint;""")
section("src/shaders/grass.frag",
    "    // Retrieve the simplex 2D noise based on the x, z coordinate of the worldpos",
    "    vec3 baseColorAccent = mix(baseColor, dry, vAccent * vUv.y);",
    """    // Restrained natural greens. Remove the original strong three-biome blotches.
    float perBlade = fract(sin(dot(floor(vWorldPos.xz*41.0),vec2(127.1,311.7)))*43758.5453);
    float variation = (1.0+clamp(vBiomeNoise,-1.0,1.0)*0.045)*mix(0.965,1.035,perBlade);
    vec3 baseRoot=vec3(0.09,0.24,0.065);
    vec3 baseTip=vec3(0.35,0.61,0.195);
    vec3 baseColorAccent=mix(baseRoot,baseTip,pow(vUv.y,0.83))*variation;
    baseColorAccent=mix(baseColorAccent,vec3(0.28,0.38,0.12),vAccent*vUv.y*0.24);""")
edit("src/shaders/grass.frag",
     "    gl_FragColor = vec4(finalColor, 1.0);",
     """    // Moonlight must reveal blade shape without turning midnight into daylight.
    float moon=1.0-smoothstep(0.45,0.82,uDaylight);
    vec3 moonBase=mix(baseColorAccent,vec3(0.18,0.30,0.41),0.55);
    vec3 moonlit=moonBase*(0.35+0.40*vUv.y);
    vec3 sunlit=finalColor*mix(0.60,1.0,uDaylight)*uSkyTint;
    finalColor=mix(sunlit,moonlit,moon);
    gl_FragColor = vec4(finalColor,1.0);""")

for a,b in [
    ("windStrength: { value: 0.5,","windStrength: { value: 0.23,"),
    ("bendAngle: { value: 0.8,","bendAngle: { value: 0.61,"),
    ("gustAmount: { value: 0.5,","gustAmount: { value: 0.14,"),
    ("gustFrequency: { value: 1,","gustFrequency: { value: 0.46,"),
    ("driftAmount: { value: 0.2,","driftAmount: { value: 0.10,"),
    ("waveStrength: { value: 0.4,","waveStrength: { value: 0.15,"),
    ("turbAmount: { value: 0.03,","turbAmount: { value: 0.008,"),
]:
    edit("src/components/WindSystem.tsx",a,b)

# Preserve the full 160k-blade desktop look, but prevent mobile from instancing
# the same dense field at expensive mobile GPU resolutions.
edit("src/components/GrassField.tsx",
    "const BLADES_PER_ROW = 400;",
    "const BLADES_PER_ROW = new URLSearchParams(window.location.search).get('quality')==='low' ? 56 : window.matchMedia('(pointer:coarse)').matches ? 280 : 400;")

edit("src/components/GrassField.tsx",
    "import { useFrame } from '@react-three/fiber';",
    "import { useFrame, useThree } from '@react-three/fiber';")
edit("src/components/GrassField.tsx",
    "import { useWindStore } from '@/stores/windStore';",
    "import { useWindStore } from '@/stores/windStore';\nimport { solar } from '@/solar';\nimport { WakeField } from '@/WakeField';")
edit("src/components/GrassField.tsx",
    "    const fieldRef = useRef<THREE.InstancedMesh>(null);",
    """    const fieldRef = useRef<THREE.InstancedMesh>(null);
    const {camera,gl} = useThree();
    const cursorNdc=useRef(new THREE.Vector2());
    const inside=useRef(false);
    const ray=useRef(new THREE.Raycaster());
    const hit=useRef(new THREE.Vector3());
    const pointer=useRef(new THREE.Vector2(1000,1000));
    const previousPointer=useRef(new THREE.Vector2(1000,1000));
    const pointerWasActive=useRef(false);
    const wake=useMemo(()=>new WakeField(128),[]);
    const wakeTexture=useMemo(()=>{
        const texture=new THREE.DataTexture(wake.pixels,wake.size,wake.size,THREE.RGBAFormat);
        texture.magFilter=THREE.LinearFilter;
        texture.minFilter=THREE.LinearFilter;
        texture.generateMipmaps=false;
        texture.needsUpdate=true;
        return texture;
    },[wake]);""")
edit("src/components/GrassField.tsx",
    """    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);""",
    """    useEffect(() => {
        const canvas=gl.domElement;
        const move=(e:PointerEvent)=>{
            if(!solar.interactionEnabled)return;
            const b=canvas.getBoundingClientRect();
            if(!b.width||!b.height)return;
            cursorNdc.current.set(2*(e.clientX-b.left)/b.width-1,1-2*(e.clientY-b.top)/b.height);
            inside.current=true;
        };
        const leave=()=>{inside.current=false;pointerWasActive.current=false;};
        canvas.addEventListener('pointermove',move,{passive:true});
        canvas.addEventListener('pointerleave',leave);
        canvas.addEventListener('pointerup',leave);
        canvas.addEventListener('pointercancel',leave);
        window.addEventListener('blur',leave);
        return ()=>{
            canvas.removeEventListener('pointermove',move);
            canvas.removeEventListener('pointerleave',leave);
            canvas.removeEventListener('pointerup',leave);
            canvas.removeEventListener('pointercancel',leave);
            window.removeEventListener('blur',leave);
        };
    },[gl]);
    useEffect(() => {
        return ()=>{geometry.dispose();wakeTexture.dispose();};
    }, [geometry,wakeTexture]);""")
edit("src/components/GrassField.tsx",
    "            shader.uniforms.uTurbAmount.value = wind.turbAmount;",
    """            shader.uniforms.uTurbAmount.value = wind.turbAmount;
            shader.uniforms.uDaylight.value=solar.daylight;
            (shader.uniforms.uSkyTint.value as THREE.Color).copy(solar.tint);

            let active=solar.interactionEnabled&&inside.current;
            if(active){
                ray.current.setFromCamera(cursorNdc.current,camera);
                const r=ray.current.ray;
                if(Math.abs(r.direction.y)>0.0001){
                    let distance=-r.origin.y/r.direction.y;
                    for(let i=0;distance>0&&i<3;i++){
                        r.at(distance,hit.current);
                        distance=(getHeight(hit.current.x,-hit.current.z)-r.origin.y)/r.direction.y;
                    }
                    if(distance>0){
                        r.at(distance,hit.current);
                        if(Math.abs(hit.current.x)<5&&Math.abs(hit.current.z)<5)
                            pointer.current.set(hit.current.x,hit.current.z);
                        else active=false;
                    }else active=false;
                }else active=false;
            }
            const dt=Math.min(_delta,0.05);
            let motion=0;
            if(active&&pointerWasActive.current){
                const distance=pointer.current.distanceTo(previousPointer.current);
                if(distance>0.014&&distance<6){
                    const force=Math.min(1,Math.max(0.4,distance/Math.max(dt,0.016)*0.20));
                    wake.paint(
                        {x:previousPointer.current.x,z:previousPointer.current.y},
                        {x:pointer.current.x,z:pointer.current.y},force
                    );
                    motion=Math.min(1,distance*4);
                }
            }
            if(wake.tick(dt))wakeTexture.needsUpdate=true;
            solar.cursorMotion+=(motion-solar.cursorMotion)*Math.min(1,dt*(motion>solar.cursorMotion?8:4));
            solar.cursorForce=motion;
            pointerWasActive.current=active;
            previousPointer.current.copy(pointer.current);""")
edit("src/components/GrassField.tsx",
    "                    uSunDirection: { value: new THREE.Vector3() },",
    """                    uSunDirection: { value: new THREE.Vector3() },
                    uDaylight: {value:1},
                    uSkyTint: {value:new THREE.Color('#ffffff')},
                    uWakeTexture: {value:wakeTexture},""")

edit("src/components/GrassField.tsx",
     "shader.uniforms.uWindStrength.value = wind.currentStrength;",
     "shader.uniforms.uWindStrength.value = wind.currentStrength*solar.windMultiplier;")

# Add pre-authored components after confirming the core patch applies.
files = {
    "src/LiveLandscape.tsx": "overlay/LiveLandscape.tsx",
    "src/solar.ts": "overlay/solar.ts",
    "src/live.css": "overlay/live.css",
    "src/SerenityAtmosphere.tsx": "overlay/SerenityAtmosphere.tsx",
    "src/SerenitySound.tsx": "overlay/SerenitySound.tsx",
    "src/serenityCycle.ts": "overlay/serenityCycle.ts",
    "src/PortfolioShell.tsx": "overlay/PortfolioShell.tsx",
    "src/projectCatalog.ts": "overlay/projectCatalog.ts",
    "src/WakeField.ts": "overlay/WakeField.ts",
    "src/portfolioRoutes.ts": "overlay/portfolioRoutes.ts",
}
here=Path(__file__).resolve().parent
for dest,source in files.items():
    (repo/dest).write_text((here/source).read_text())
print("Applied Serenity portfolio, field controls and directional grass wake.")
