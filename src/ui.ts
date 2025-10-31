import { clamp } from './utils';

export class UI{
  speedoCanvas: HTMLCanvasElement; sctx: CanvasRenderingContext2D;
  scoreEl = document.getElementById('score') as HTMLSpanElement;
  timerEl = document.getElementById('timer') as HTMLSpanElement;
  airEl = document.getElementById('air') as HTMLSpanElement;
  constructor(){
    this.speedoCanvas = document.getElementById('speedo') as HTMLCanvasElement;
    this.sctx = this.speedoCanvas.getContext('2d')!;
  }
  drawSpeedometer(speed:number){
    const ctx = this.sctx; const w = ctx.canvas.width, h = ctx.canvas.height; ctx.clearRect(0,0,w,h);
    const cx=w/2, cy=h;
    ctx.lineWidth=16; ctx.strokeStyle='#444';
    ctx.beginPath(); ctx.arc(cx,cy,80,Math.PI,0); ctx.stroke();
    const t = clamp(speed/100,0,1);
    ctx.strokeStyle='#ffb84d'; ctx.beginPath(); ctx.arc(cx,cy,80,Math.PI,Math.PI + (Math.PI*t)); ctx.stroke();
    // needle
    const ang = Math.PI + Math.PI*t;
    ctx.strokeStyle='#ff6'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang)*70, cy + Math.sin(ang)*70);
    ctx.stroke();
    (document.getElementById('speedText') as HTMLSpanElement).textContent = String(Math.round(speed));
  }
  setScore(v:number){ this.scoreEl.textContent = String(v); this.flash(this.scoreEl); }
  setTimer(text:string){ this.timerEl.textContent=text; }
  setAir(ms:number){ this.airEl.textContent = `AIR ${ms|0}ms`; }
  flash(el:HTMLElement){ el.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:180}); }
}
