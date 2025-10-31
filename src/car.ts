import { AABB } from './utils';

export class Car{
  x:number; y:number; w:number=80; h:number=28; vx:number=-3; crushed=false; crushT=0; rot=0; scale=1; scored=false;
  constructor(public groundY:number, startX:number){ this.x=startX; this.y=groundY - this.h; }
  get bbox(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
  update(dt:number){
    this.x += this.vx * dt;
    if(this.crushed){ this.crushT = Math.min(1, this.crushT + 0.06*dt); this.scale = 1 - 0.7*this.crushT; this.rot = 25*this.crushT*Math.PI/180; }
  }
  crush(){ if(!this.crushed){ this.crushed=true; }}
  offscreen(viewX:number, w:number){ return this.x + this.w < viewX - 100; }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save();
    ctx.translate(this.x + this.w/2, this.y + this.h/2);
    ctx.rotate(this.rot); ctx.scale(this.scale, this.scale);
    // body
    ctx.fillStyle = '#497';
    ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
    // windows
    ctx.fillStyle='#9ed8ff'; ctx.fillRect(-this.w/4, -this.h/3, this.w/5, this.h/3);
    // wheels
    ctx.fillStyle='#111';
    ctx.beginPath(); ctx.arc(-this.w/3, this.h/2, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.w/3, this.h/2, 10, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}
