/** CPU-updated, world-aligned directional wake. No individual blade simulation. */
export type GroundPoint = {x:number; z:number};
const LIMIT=5;
const DECAY_SECONDS=1.65;

export class WakeField {
  readonly size:number;
  readonly pixels:Uint8Array;
  private dx:Float32Array;
  private dz:Float32Array;
  private intensity:Float32Array;
  private living=false;

  constructor(size=128){
    this.size=size;
    const n=size*size;
    this.dx=new Float32Array(n);
    this.dz=new Float32Array(n);
    this.intensity=new Float32Array(n);
    this.pixels=new Uint8Array(n*4);
    for(let i=0;i<n;i++){
      this.pixels[i*4]=128;
      this.pixels[i*4+1]=128;
      this.pixels[i*4+3]=255;
    }
  }

  /** Stamp overlapping, stretched brush marks across every part of a cursor sweep. */
  paint(from:GroundPoint,to:GroundPoint,force=0.8):boolean {
    const vx=to.x-from.x, vz=to.z-from.z;
    const length=Math.hypot(vx,vz);
    if(length<0.014 || length>8 || force<=0)return false;
    const ux=vx/length,uz=vz/length;
    const nx=-uz,nz=ux;
    const count=Math.ceil(length/0.065);
    for(let s=0;s<=count;s++){
      const t=s/count;
      this.stamp(from.x+vx*t,from.z+vz*t,ux,uz,nx,nz,Math.min(1,force));
    }
    this.living=true;
    return true;
  }

  private stamp(x:number,z:number,ux:number,uz:number,nx:number,nz:number,force:number){
    const size=this.size;
    const toPixel=(p:number)=>((p+LIMIT)/(2*LIMIT))*size;
    const minX=Math.max(0,Math.floor(toPixel(x-0.48)));
    const maxX=Math.min(size-1,Math.ceil(toPixel(x+0.48)));
    const minZ=Math.max(0,Math.floor(toPixel(z-0.48)));
    const maxZ=Math.min(size-1,Math.ceil(toPixel(z+0.48)));
    for(let iz=minZ;iz<=maxZ;iz++)for(let ix=minX;ix<=maxX;ix++){
      const px=((ix+0.5)/size)*2*LIMIT-LIMIT-x;
      const pz=((iz+0.5)/size)*2*LIMIT-LIMIT-z;
      const along=px*ux+pz*uz;
      const across=px*nx+pz*nz;
      const rho=(along/0.44)**2+(across/0.205)**2;
      if(rho>=1)continue;
      const grain=0.88+0.12*Math.sin(ix*2.13+iz*0.93)**2;
      const weight=(1-rho)**2*grain*force;
      // Either side of the swept line bends away, with a small forward lean.
      const side=across/Math.sqrt(across*across+0.0025);
      const i=iz*size+ix;
      this.dx[i]=Math.max(-1,Math.min(1,this.dx[i]+(nx*side*0.24+ux*0.08)*weight));
      this.dz[i]=Math.max(-1,Math.min(1,this.dz[i]+(nz*side*0.24+uz*0.08)*weight));
      this.intensity[i]=Math.min(1,this.intensity[i]+weight*0.27);
    }
  }

  /** Exponential recovery, then convert to an 8-bit RGBA texture for WebGL1/2. */
  tick(dt:number):boolean {
    if(!this.living)return false;
    const decay=Math.exp(-Math.max(0,Math.min(dt,0.1))/DECAY_SECONDS);
    let active=false;
    for(let i=0;i<this.intensity.length;i++){
      this.dx[i]*=decay;
      this.dz[i]*=decay;
      this.intensity[i]*=decay;
      if(this.intensity[i]>0.0015){active=true;}
      else{this.intensity[i]=0;this.dx[i]=0;this.dz[i]=0;}
      const j=i*4;
      this.pixels[j]=Math.round(128+this.dx[i]*110);
      this.pixels[j+1]=Math.round(128+this.dz[i]*110);
      this.pixels[j+2]=Math.round(this.intensity[i]*255);
    }
    this.living=active;
    return true;
  }

  /** Expose local intensity for deterministic tests and interaction diagnostics. */
  sample(x:number,z:number):number {
    const ix=Math.min(this.size-1,Math.max(0,Math.floor((x+LIMIT)/(2*LIMIT)*this.size)));
    const iz=Math.min(this.size-1,Math.max(0,Math.floor((z+LIMIT)/(2*LIMIT)*this.size)));
    return this.intensity[iz*this.size+ix];
  }
}
