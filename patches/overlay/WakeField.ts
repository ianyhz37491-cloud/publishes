/** Sparse, irregular grass disturbance field. Roots and natural wind stay independent. */
export type GroundPoint={x:number;z:number};
const LIMIT=5;
const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};

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
    for(let i=0;i<n;i++){this.pixels[i*4]=128;this.pixels[i*4+1]=128;this.pixels[i*4+3]=255;}
  }

  /** Distance-based sampling prevents gaps on fast pointer sweeps.
   * Offset eddies and varied recovery remove the perfectly cut-out trench. */
  paint(from:GroundPoint,to:GroundPoint,force=.8):boolean{
    const vx=to.x-from.x,vz=to.z-from.z,len=Math.hypot(vx,vz);
    if(len<.014||len>8||force<=0)return false;
    const ux=vx/len,uz=vz/len,nx=-uz,nz=ux;
    const count=Math.ceil(len/.058);
    for(let i=0;i<=count;i++){
      const t=i/count,x=from.x+vx*t,z=from.z+vz*t;
      const jitter=(hash(Math.floor(x*26),Math.floor(z*26))-.5)*.11;
      const pressure=(.76+.22*Math.sin((x+z)*4.7)**2)*Math.min(1,force);
      this.stamp(x+nx*jitter,z+nz*jitter,ux,uz,nx,nz,pressure);
      if(i%4===0){
        const side=hash(Math.floor(x*17),Math.floor(z*17))>.5?1:-1;
        this.stamp(x+nx*side*.17,z+nz*side*.17,ux,uz,nx,nz,pressure*.22);
      }
    }
    this.living=true;
    return true;
  }

  private stamp(x:number,z:number,ux:number,uz:number,nx:number,nz:number,force:number){
    const size=this.size,toPixel=(p:number)=>(p+LIMIT)/(2*LIMIT)*size;
    const minX=Math.max(0,Math.floor(toPixel(x-.48)));
    const maxX=Math.min(size-1,Math.ceil(toPixel(x+.48)));
    const minZ=Math.max(0,Math.floor(toPixel(z-.48)));
    const maxZ=Math.min(size-1,Math.ceil(toPixel(z+.48)));
    for(let iz=minZ;iz<=maxZ;iz++)for(let ix=minX;ix<=maxX;ix++){
      const grain=hash(ix,iz),slant=hash(ix+103,iz+97);
      const px=((ix+.5)/size)*2*LIMIT-LIMIT-x;
      const pz=((iz+.5)/size)*2*LIMIT-LIMIT-z;
      const along=px*ux+pz*uz;
      const across=px*nx+pz*nz;
      const width=.15+grain*.085;
      const rho=(along/(.32+slant*.14))**2+(across/width)**2;
      if(rho>=1)continue;
      const brokenEdge=Math.pow(1-rho,1.5)*(.65+grain*.35);
      const weight=brokenEdge*force;
      const side=across/Math.sqrt(across*across+.0025);
      const directionJitter=(slant-.5)*.18;
      const i=iz*size+ix;
      this.dx[i]=Math.max(-1,Math.min(1,this.dx[i]+
        (nx*side*.21+ux*(.055+directionJitter))*weight));
      this.dz[i]=Math.max(-1,Math.min(1,this.dz[i]+
        (nz*side*.21+uz*(.055+directionJitter))*weight));
      this.intensity[i]=Math.min(1,this.intensity[i]+weight*.21);
    }
  }

  /** Variation in elastic recovery makes adjacent blades relax asynchronously. */
  tick(dt:number):boolean{
    if(!this.living)return false;
    const elapsed=Math.max(0,Math.min(dt,.1));
    let active=false;
    for(let i=0;i<this.intensity.length;i++){
      const x=i%this.size,z=Math.floor(i/this.size);
      const tau=1.05+hash(x+41,z+73)*.95;
      const decay=Math.exp(-elapsed/tau);
      this.dx[i]*=decay;this.dz[i]*=decay;this.intensity[i]*=decay;
      if(this.intensity[i]>.0015)active=true;
      else{this.intensity[i]=0;this.dx[i]=0;this.dz[i]=0;}
      const j=i*4;
      this.pixels[j]=Math.round(128+this.dx[i]*110);
      this.pixels[j+1]=Math.round(128+this.dz[i]*110);
      this.pixels[j+2]=Math.round(this.intensity[i]*255);
    }
    this.living=active;
    return true;
  }

  sample(x:number,z:number):number{
    const ix=Math.min(this.size-1,Math.max(0,Math.floor((x+LIMIT)/(2*LIMIT)*this.size)));
    const iz=Math.min(this.size-1,Math.max(0,Math.floor((z+LIMIT)/(2*LIMIT)*this.size)));
    return this.intensity[iz*this.size+ix];
  }
}
