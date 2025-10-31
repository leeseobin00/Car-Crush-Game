import { clamp } from './utils';
import { ParticleSystem } from './particle';

export class Truck{
  x=100; y=0; w=120; h=60; vy=0; vx=0; angle=0; angularV=0; onGround=true; groundY=0; maxSpeed=8; accel=0.2; revBoost=0; lastY=0;
  airFrames=0; flipAccum=0; flips=0; 
  constructor(groundY:number, public particles:ParticleSystem){ this.groundY=groundY; this.y = groundY - this.h - 10; }
  bbox(){ return {x:this.x- this.w*0.4, y:this.y, w:this.w*0.8, h:this.h}; }
  update(dt:number, gravity:number){
    // horizontal
    this.vx = clamp(this.vx + (this.accel + this.revBoost)*dt, 0, this.maxSpeed);
    this.x += this.vx*dt*3; // world scroll is separate

    // vertical
    this.vy += gravity*dt; this.y += this.vy*dt; this.angle += this.angularV*dt; this.angularV*=0.99;

    // ground collision
    const floor = this.groundY - this.h - 10;
    if(this.y >= floor){
      const hard = this.vy>8; // landing impact
      this.y=floor; this.vy= -Math.min(0, this.vy*0.2); // little bounce
      if(!this.onGround){ if(hard) this.particles.spawn(this.x, this.y+this.h, 'dust', 24); this.onGround=true; this.airFrames=0; }
      this.angle *= 0.7;
    }else{ this.onGround=false; this.airFrames++; }

    // trail
    if(!this.onGround && Math.random()<0.4) this.particles.spawn(this.x-40, this.y+this.h*0.8, 'trail', 1);

    // flip tracking
    this.flipAccum += this.angularV*dt;
    if(Math.abs(this.flipAccum) >= Math.PI*2){ this.flipAccum=0; this.flips++; }

    // decay rev
    this.revBoost = Math.max(0, this.revBoost - 0.04*dt);
  }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save();
    ctx.translate(this.x, this.y + this.h/2);
    ctx.rotate(this.angle);
    // body
    ctx.fillStyle='#c33';
    ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h*0.6);
    // cabin
    ctx.fillStyle='#a22'; ctx.fillRect(-this.w*0.2, -this.h*0.8, this.w*0.45, this.h*0.5);
    // flame decal
    ctx.fillStyle='#ff6'; ctx.beginPath(); ctx.moveTo(0,-this.h*0.2); ctx.bezierCurveTo(20,-this.h*0.35,45,-this.h*0.15,60,-this.h*0.28); ctx.lineTo(55,-this.h*0.05); ctx.closePath(); ctx.fill();
    // wheels
    const wheel = (ox:number, oy:number)=>{ ctx.save(); ctx.translate(ox, oy); ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#666'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.stroke(); ctx.restore(); };
    wheel(-this.w*0.25, this.h*0.3); wheel(this.w*0.25, this.h*0.3);
    ctx.restore();
  }
  jump(){ if(this.onGround){ this.vy = -18; this.onGround=false; this.angularV += 0.03; }}
  rev(){ this.revBoost = Math.min(this.revBoost + 0.4, 4); }
  crushCar(){ this.angularV += 0.02; }
}
