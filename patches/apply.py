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

# Preserve upstream geometry, terrain, and the entire gust noise field.
for old,new in [
    ("const float SWAY_FREQ = 2.0;","const float SWAY_FREQ = 0.68;"),
    ("const float SWAY_OSCIL_WEIGHT = 0.4;","const float SWAY_OSCIL_WEIGHT = 0.16;"),
    ("const float SWAY_LEAN_WEIGHT = 0.6;","const float SWAY_LEAN_WEIGHT = 0.84;")
]:
    edit("src/shaders/grass.vert",old,new)

edit("src/shaders/grass.vert","uniform vec2 uColorSeed;", """uniform vec2 uColorSeed;
uniform vec2 uCursorPos;
uniform float uCursorRadius;
uniform float uCursorForce;""")
edit("src/shaders/grass.vert",
    "    bentPos.xz += turbulence;",
    """    bentPos.xz += turbulence;
    // Localised GPU deformation. Roots stay anchored and wind continues unchanged.
    vec2 away = worldPos.xz-uCursorPos;
    float proximity = 1.0-smoothstep(0.05,uCursorRadius,length(away));
    float push = proximity*proximity*uCursorForce*pow(vUv.y,1.9);
    bentPos.xz += away/max(length(away),0.03)*push*0.31;
    bentPos.y -= push*0.10;""")

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
     """    finalColor *= mix(0.34,1.0,uDaylight)*uSkyTint;
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
    "const BLADES_PER_ROW = window.matchMedia('(pointer:coarse)').matches ? 280 : 400;")

edit("src/components/GrassField.tsx",
    "import { useFrame } from '@react-three/fiber';",
    "import { useFrame, useThree } from '@react-three/fiber';")
edit("src/components/GrassField.tsx",
    "import { useWindStore } from '@/stores/windStore';",
    "import { useWindStore } from '@/stores/windStore';\nimport { solar } from '@/solar';")
edit("src/components/GrassField.tsx",
    "    const fieldRef = useRef<THREE.InstancedMesh>(null);",
    """    const fieldRef = useRef<THREE.InstancedMesh>(null);
    const {camera,gl} = useThree();
    const cursorNdc=useRef(new THREE.Vector2());
    const inside=useRef(false);
    const ray=useRef(new THREE.Raycaster());
    const hit=useRef(new THREE.Vector3());
    const pointer=useRef(new THREE.Vector2(1000,1000));
    const strength=useRef(0);
    const previousPointer=useRef(new THREE.Vector2(1000,1000));
    const pointerWasActive=useRef(false);
    const cursorParams=useControls('Cursor grass',{
        enabled:true,
        radius:{value:0.65,min:0.2,max:1.7},
        force:{value:0.85,min:0,max:1.6},
        recovery:{value:4,min:0.5,max:10},
    });""")
edit("src/components/GrassField.tsx",
    """    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);""",
    """    useEffect(() => {
        const canvas=gl.domElement;
        const move=(e:PointerEvent)=>{
            const b=canvas.getBoundingClientRect();
            if(!b.width||!b.height)return;
            cursorNdc.current.set(2*(e.clientX-b.left)/b.width-1,1-2*(e.clientY-b.top)/b.height);
            inside.current=true;
        };
        const leave=()=>{inside.current=false;};
        canvas.addEventListener('pointermove',move,{passive:true});
        canvas.addEventListener('pointerleave',leave);
        window.addEventListener('blur',leave);
        return ()=>{
            canvas.removeEventListener('pointermove',move);
            canvas.removeEventListener('pointerleave',leave);
            window.removeEventListener('blur',leave);
        };
    },[gl]);
    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);""")
edit("src/components/GrassField.tsx",
    "            shader.uniforms.uTurbAmount.value = wind.turbAmount;",
    """            shader.uniforms.uTurbAmount.value = wind.turbAmount;
            shader.uniforms.uDaylight.value=solar.daylight;
            (shader.uniforms.uSkyTint.value as THREE.Color).copy(solar.tint);

            let active=false;
            if(cursorParams.enabled && inside.current) {
                ray.current.setFromCamera(cursorNdc.current,camera);
                const r=ray.current.ray;
                if(Math.abs(r.direction.y)>0.0001){
                    let distance=-r.origin.y/r.direction.y;
                    for(let i=0;distance>0 && i<3;i++){
                        r.at(distance,hit.current);
                        distance=(getHeight(hit.current.x,-hit.current.z)-r.origin.y)/r.direction.y;
                    }
                    if(distance>0){
                        r.at(distance,hit.current);
                        if(Math.abs(hit.current.x)<5&&Math.abs(hit.current.z)<5){
                            pointer.current.set(hit.current.x,hit.current.z);
                            active=true;
                        }
                    }
                }
            }
            const dt=Math.min(_delta,0.05);
            const goal=active ? cursorParams.force : 0;
            strength.current += (goal-strength.current)*(1-Math.exp(-dt*(active?11:cursorParams.recovery)));
            shader.uniforms.uCursorPos.value.copy(pointer.current);
            shader.uniforms.uCursorRadius.value=cursorParams.radius;
            shader.uniforms.uCursorForce.value=strength.current;
            const pointerDistance=(active&&pointerWasActive.current) ? pointer.current.distanceTo(previousPointer.current) : 0;
            pointerWasActive.current=active;
            // Audio follows actual ground-plane contact, never sky-only cursor motion.
            solar.cursorMotion=active
                ? Math.max(solar.cursorMotion*0.78,Math.min(1,pointerDistance*6))
                : solar.cursorMotion*0.76;
            solar.cursorForce=strength.current;
            previousPointer.current.copy(pointer.current);""")
edit("src/components/GrassField.tsx",
    "                    uSunDirection: { value: new THREE.Vector3() },",
    """                    uSunDirection: { value: new THREE.Vector3() },
                    uDaylight: {value:1},
                    uSkyTint: {value:new THREE.Color('#ffffff')},
                    uCursorPos: {value:new THREE.Vector2(1000,1000)},
                    uCursorRadius: {value:0.65},
                    uCursorForce: {value:0},""")

# Add pre-authored components after confirming the core patch applies.
files = {
    "src/LiveLandscape.tsx": "overlay/LiveLandscape.tsx",
    "src/solar.ts": "overlay/solar.ts",
    "src/live.css": "overlay/live.css",
    "src/SerenityAtmosphere.tsx": "overlay/SerenityAtmosphere.tsx",
    "src/SerenitySound.tsx": "overlay/SerenitySound.tsx",
    "src/serenityCycle.ts": "overlay/serenityCycle.ts",
}
here=Path(__file__).resolve().parent
for dest,source in files.items():
    (repo/dest).write_text((here/source).read_text())
print("Applied Zephyr grass, cursor, lighting and landscape overlay.")
