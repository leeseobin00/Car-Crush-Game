import { Truck } from './truck';
import { Car } from './car';
import { Ramp } from './ramp';
import { Obstacle } from './obstacle';
import { ParticleSystem } from './particle';
import { AABB, clamp, randomRange, timeFormat } from './utils';
import { UI } from './ui';
import { AudioSystem } from './audio';

export type GameState = 'MENU'|'PLAYING'|'GAME_OVER';

export class Game{
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
  w:number; h:number; groundY:number; cameraX=0; bgOffset=0;
  gravity=0.8; 
  truck: Truck; cars: Car[]=[]; ramps: Ramp[]=[]; obstacles: Obstacle[]=[]; particles = new ParticleSystem();
  state: GameState = 'MENU';
  ui: UI; audio: AudioSystem;
  score=0; timeLeftMs=60000; highKey='mtct_high';
  airMs=0; lastTimestamp=0; slowMoFrames=0; shakeT=0; crushedCount=0;
  nextCarT=0; nextRampT=0; nextObsT=0;
  startGraceMs=0;
  bgGradient: CanvasGradient | null = null;

  constructor(canvas:HTMLCanvasElement, ctx:CanvasRenderingContext2D, ui:UI, audio:AudioSystem){
    this.canvas=canvas; this.ctx=ctx; this.w=canvas.width; this.h=canvas.height; this.groundY = this.h*0.78;
    this.ui=ui; this.audio=audio;
    this.truck = new Truck(this.groundY, this.particles);
  }

  onResize(newW:number, newH:number){
    const newGroundY = newH*0.78;
    const dy = newGroundY - this.groundY;
    this.w = newW; this.h = newH; this.groundY = newGroundY;
    // refresh cached background gradient for new size
    this.bgGradient = this.ctx.createLinearGradient(0,0,0,this.h);
    this.bgGradient.addColorStop(0,'#ff9966');
    this.bgGradient.addColorStop(1,'#2b1e1e');
    // adjust entities to keep relative position to ground
    this.truck.groundY = newGroundY; this.truck.y += dy;
    this.cars.forEach(c=>{ c.y += dy; });
    this.ramps.forEach(r=>{ r.y += dy; });
    this.obstacles.forEach(o=>{ o.y += dy; });
  }

  reset(){
    this.score=0; this.timeLeftMs=60000; this.airMs=0; this.cameraX=0; this.bgOffset=0; this.slowMoFrames=0; this.shakeT=0; this.crushedCount=0;
    this.cars=[]; this.ramps=[]; this.obstacles=[]; this.truck = new Truck(this.groundY, this.particles);
    this.nextCarT = randomRange(2000, 4000); this.nextRampT = randomRange(5000, 8000); this.nextObsT = randomRange(3000, 6000);
    this.startGraceMs = 1200; // ignore collisions briefly after start
  }

  start(){ this.reset(); this.state='PLAYING'; }

  spawnCar(){ this.cars.push(new Car(this.groundY, this.cameraX + this.w + randomRange(0,200))); }
  spawnRamp(){ this.ramps.push(new Ramp(this.groundY, this.cameraX + this.w + randomRange(0,200))); }

  update(dtMs:number){
    const dt = Math.max(0.5, Math.min(3, dtMs/16.666));
    const slow = this.slowMoFrames>0 ? 0.3 : 1;
    if(this.slowMoFrames>0) this.slowMoFrames--;

    if(this.state !== 'PLAYING') return;
    this.timeLeftMs -= dtMs; if(this.timeLeftMs<=0){ this.timeLeftMs=0; this.state='GAME_OVER'; }
    if(this.startGraceMs>0){ this.startGraceMs = Math.max(0, this.startGraceMs - dtMs); }

    // Update spawning timers
    this.nextCarT -= dtMs; if(this.nextCarT<=0){ this.spawnCar(); this.nextCarT = randomRange(2000, 4000); }
    this.nextRampT -= dtMs; if(this.nextRampT<=0){ this.spawnRamp(); this.nextRampT = randomRange(5000, 8000); }
    this.nextObsT -= dtMs; if(this.nextObsT<=0){
      const type = Math.random()<0.55? 'tire' : 'wall';
      this.obstacles.push(new Obstacle(this.groundY, this.cameraX + this.w + randomRange(0,200), type as any));
      this.nextObsT = randomRange(3000, 6000);
    }

    // Update entities
    this.truck.update(dt*slow, this.gravity);
    this.cars.forEach(c=>c.update(dt*slow));
    this.ramps.forEach(r=>r.update(dt*slow));
    this.obstacles.forEach(o=>o.update(dt*slow));

    // World scroll
    this.cameraX = this.truck.x - 150;
    this.bgOffset += 0.5*dt*slow;

    // Collisions (skip during initial grace period)
    const inGrace = this.startGraceMs>0;
    const tb = this.truck.bbox();
    for(const c of this.cars){
      if(!inGrace && !c.crushed && AABB(tb.x, tb.y, tb.w, tb.h, c.x, c.y, c.w, c.h)){
        if(this.truck.y + this.truck.h*0.6 < c.y){ // above
          c.crush(); this.truck.crushCar(); this.audio.playCrunch();
          this.score += 20; this.crushedCount++;
        }else{
          // side hit: sparks
          this.audio.playSparks();
        }
      }
    }
    for(const r of this.ramps){
      if(!inGrace && AABB(tb.x, tb.y, tb.w, tb.h, r.x, r.y, r.w, r.h)){
        // launch boost
        this.truck.vy = -18 * Math.sin(r.angle) * 1.2; this.truck.angularV += 0.035; this.truck.onGround=false;
      }
    }
    for(const o of this.obstacles){
      if(!inGrace && AABB(tb.x, tb.y, tb.w, tb.h, o.x, o.y, o.w, o.h)){
        if(o.type==='tire'){
          // bounce
          this.truck.vy = -Math.max(10, Math.abs(this.truck.vy)*0.6 + 6);
          this.truck.angularV += 0.06; this.audio.playSparks();
        }else{
          // wall crash -> -50 pts
          this.score = Math.max(0, this.score - 50);
          this.shake(14, 320); this.audio.playSparks();
          // slight knockback
          this.truck.vx = Math.max(0, this.truck.vx * 0.5);
        }
      }
    }

    // Air time scoring
    if(!this.truck.onGround){ this.airMs += dtMs*slow; if(this.airMs>1500){ /* flash handled in UI change in main */ } }
    else if(this.airMs>0){
      const big = this.airMs>1500;
      const bonus = Math.floor(this.airMs/100)*5; this.score += bonus; this.airMs=0; this.shake(8, 200);
      if(big) this.audio.playCheer();
    }

    // Flip scoring
    if(this.truck.flips>0){
      const f = this.truck.flips; this.truck.flips=0;
      const backflip = this.truck.angularV>0; this.score += backflip? 200:150; this.slowMoFrames = 30; this.shake(10, 300);
    }

    // Cleanup offscreen
    this.cars = this.cars.filter(c=>!c.offscreen(this.cameraX, this.w));
    this.ramps = this.ramps.filter(r=>!r.offscreen(this.cameraX));
    this.obstacles = this.obstacles.filter(o=>!o.offscreen(this.cameraX));

    // Particles
    // handled in draw pass for performance

    // UI updates
    this.ui.setScore(this.score);
    this.ui.setTimer(timeFormat(this.timeLeftMs));
    this.ui.setAir(this.airMs);
  }

  draw(){
    const ctx=this.ctx; const w=this.canvas.width, h=this.canvas.height;
    ctx.clearRect(0,0,w,h);
    // Background sky (cached gradient)
    if(!this.bgGradient){
      this.bgGradient = ctx.createLinearGradient(0,0,0,h);
      this.bgGradient.addColorStop(0,'#ff9966');
      this.bgGradient.addColorStop(1,'#2b1e1e');
    }
    ctx.fillStyle=this.bgGradient; ctx.fillRect(0,0,w,h);
    // Crowd
    ctx.fillStyle='#1a1414'; ctx.fillRect(0,h*0.55,w,h*0.1);
    ctx.fillStyle='#222'; for(let i=0;i<w;i+=10){ const y=h*0.55 + Math.sin((i+this.bgOffset)*0.05)*2; ctx.fillRect(i,y,6,4); }
    // Ground
    ctx.fillStyle='#5b3a1a'; ctx.fillRect(0,this.groundY,w,h-this.groundY);
    ctx.fillStyle='#7a5130'; for(let i=0;i<w;i+=40){ ctx.fillRect(i,this.groundY-6,28,6); }

    // Screen shake
    if(this.shakeT>0){ ctx.save(); const mag=this.shakeT*0.5; ctx.translate((Math.random()-0.5)*mag, (Math.random()-0.5)*mag); this.shakeT-=1; }

    // Entities relative to camera
    ctx.save(); ctx.translate(-this.cameraX + 150, 0);
    this.ramps.forEach(r=>r.draw(ctx));
    this.obstacles.forEach(o=>o.draw(ctx));
    this.cars.forEach(c=>c.draw(ctx));
    this.truck.draw(ctx);
    this.particles.updateAndDraw(ctx);
    ctx.restore();

    if(this.shakeT>0) ctx.restore();

    // Speedometer
    this.ui.drawSpeedometer(clamp(this.truck.vx/this.truck.maxSpeed*100,0,100));

    // Air time text
    if(this.airMs>1500){ ctx.save(); ctx.fillStyle='#ff6'; ctx.font='32px Bangers'; ctx.textAlign='center'; ctx.fillText('AIR TIME!', w/2, 80); ctx.restore(); }
  }

  shake(mag:number, ms:number){ this.shakeT = Math.max(this.shakeT, Math.floor(ms/16)); }
}
