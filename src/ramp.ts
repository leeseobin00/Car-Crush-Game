export class Ramp{
  x:number; y:number; w:number=100; h:number=30; angle:number;
  vx:number=-3;
  constructor(groundY:number, startX:number){ this.x=startX; this.y=groundY - this.h; this.angle = (30 + Math.random()*15) * Math.PI/180; }
  get bbox(){ return {x:this.x, y:this.y, w:this.w, h:this.h}; }
  update(dt:number){ this.x += this.vx*dt; }
  offscreen(viewX:number){ return this.x + this.w < viewX - 100; }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save(); ctx.translate(this.x, this.y+this.h);
    ctx.fillStyle='#b77';
    ctx.beginPath();
    ctx.moveTo(0,0);
    const tipX = this.w*Math.cos(this.angle), tipY = -this.w*Math.sin(this.angle);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(0,-this.h);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
