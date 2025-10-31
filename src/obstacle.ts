export type ObstacleType = 'tire'|'wall';

export class Obstacle{
  x:number; y:number; w:number; h:number; type:ObstacleType; vx:number=-3; rot=0; vr=0;
  constructor(groundY:number, startX:number, type:ObstacleType){
    this.type=type; this.x=startX; this.h = type==='wall'? 80: 40; this.w = type==='wall'? 26: 32;
    this.y = groundY - this.h;
    if(type==='tire'){ this.vr = (Math.random()>0.5?1:-1) * (0.02 + Math.random()*0.06); }
  }
  get bbox(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
  update(dt:number){ this.x += this.vx*dt; if(this.type==='tire'){ this.rot += this.vr*dt; } }
  offscreen(viewX:number){ return this.x + this.w < viewX - 100; }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save(); ctx.translate(this.x + this.w/2, this.y + this.h/2); ctx.rotate(this.rot);
    if(this.type==='tire'){
      ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(0,0,this.w/2,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#555'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,this.w/3,0,Math.PI*2); ctx.stroke();
    }else{
      ctx.fillStyle='#555'; ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h);
      ctx.fillStyle='#aaa'; ctx.fillRect(-this.w/2+4,-this.h/2+4,this.w-8,this.h-8);
    }
    ctx.restore();
  }
}
