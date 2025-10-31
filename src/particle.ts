export type ParticleType = 'dust'|'spark'|'trail';

export class Particle{
  x:number;y:number;vx:number;vy:number;life:number;maxLife:number;type:ParticleType;size:number;color:string;rot:number;vr:number;
  constructor(x:number,y:number,type:ParticleType){
    this.x=x; this.y=y; this.type=type; this.vx=(Math.random()-0.5)*4; this.vy= -Math.random()*2;
    this.maxLife = type==='trail'? 30 : 40;
    this.life=this.maxLife;
    this.size = type==='spark'? 2+Math.random()*2 : 4+Math.random()*6;
    this.color = type==='spark'? '#ffd36e' : 'rgba(200,170,120,0.9)';
    this.rot = Math.random()*Math.PI*2; this.vr=(Math.random()-0.5)*0.2;
  }
  update(){
    this.x += this.vx; this.y += this.vy; this.vy += (this.type==='spark'? 0.2: 0.4);
    this.life--;
  }
  draw(ctx:CanvasRenderingContext2D){
    const alpha = this.life/this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x,this.y); ctx.rotate(this.rot); this.rot+=this.vr;
    ctx.fillStyle=this.color;
    if(this.type==='spark'){
      ctx.fillRect(-this.size*0.5,-this.size*0.5,this.size,this.size*2);
    }else{
      ctx.beginPath(); ctx.arc(0,0,this.size,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

export class ParticleSystem{
  items: Particle[] = [];
  spawn(x:number,y:number,type:ParticleType,count:number){
    for(let i=0;i<count;i++) this.items.push(new Particle(x+(Math.random()-0.5)*8,y+(Math.random()-0.5)*8,type));
  }
  updateAndDraw(ctx:CanvasRenderingContext2D){
    for(let i=this.items.length-1;i>=0;i--){
      const p=this.items[i]; p.update(); p.draw(ctx); if(p.life<=0) this.items.splice(i,1);
    }
  }
}
