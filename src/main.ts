import confetti from 'canvas-confetti';
import { UI } from './ui';
import { Game } from './game';
import { loadHighScore, saveHighScore } from './utils';
import { AudioSystem } from './audio';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const fit = ()=>{ 
  canvas.width = Math.max(320, window.innerWidth); 
  canvas.height = window.innerHeight; 
};
fit();

const ui = new UI();
const audio = new AudioSystem();
const game = new Game(canvas, ctx, ui, audio);
// ensure entities adapt to initial canvas size and future resizes
game.onResize(canvas.width, canvas.height);
window.addEventListener('resize', ()=>{ fit(); game.onResize(canvas.width, canvas.height); });

let state: 'MENU'|'PLAYING'|'GAME_OVER' = 'MENU';
let last=performance.now();
let high = loadHighScore('mtct_high');

const menu = document.getElementById('menu')!;
const over = document.getElementById('gameover')!;
const newRecordEl = document.getElementById('newRecord')!;

function setState(s:typeof state){ state=s; menu.classList.toggle('visible', s==='MENU'); over.classList.toggle('visible', s==='GAME_OVER'); }

function startPlay(){
  try{ audio.resume(); }catch(_e){ /* ignore audio resume errors */ }
  game.start();
  setState('PLAYING');
}
function bindMenuButtons(){
  const playBtn = document.getElementById('playBtn') as HTMLButtonElement | null;
  const replayBtn = document.getElementById('replayBtn') as HTMLButtonElement | null;
  if(playBtn){ playBtn.addEventListener('click', (e)=>{ e.preventDefault(); startPlay(); }); }
  if(replayBtn){ replayBtn.addEventListener('click', (e)=>{ e.preventDefault(); startPlay(); }); }
}
if(document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', bindMenuButtons);
} else {
  bindMenuButtons();
}

// Input
let revHeld=false;
function jump(){ game.truck.jump(); }
function rev(down:boolean){ revHeld=down; }
window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ jump(); }
  if(e.code==='ShiftLeft' || e.code==='ShiftRight'){ rev(true); }
});
window.addEventListener('keyup', (e)=>{
  if(e.code==='ShiftLeft' || e.code==='ShiftRight'){ rev(false); }
});

// Mobile: left half rev, right half jump
canvas.addEventListener('touchstart', (e)=>{ audio.resume();
  for(const t of Array.from(e.touches)){
    const right = t.clientX > window.innerWidth/2; if(right) jump(); else rev(true);
  }
});
canvas.addEventListener('touchend', ()=>rev(false));
canvas.addEventListener('mousedown', (e)=>{ audio.resume(); if(e.clientX > window.innerWidth/2) jump(); else rev(true); });
canvas.addEventListener('mouseup', ()=>rev(false));

function loop(now:number){
  const dt = now - last; last = now;
  if(state==='PLAYING'){
    if(revHeld){ game.truck.rev(); audio.setRev(Math.min(1, audio.revAmount + 0.04)); }
    else { audio.setRev(Math.max(0, audio.revAmount - 0.05)); }

    game.update(dt);
    game.draw();

    if(game.state==='GAME_OVER'){
      const final = game.score * (game.crushedCount>=10? 1.5:1);
      (document.getElementById('finalScore') as HTMLHeadingElement).textContent = `Score: ${final|0}`;
      setState('GAME_OVER');
      if(final>high){ high=final; saveHighScore('mtct_high', final); newRecordEl.classList.remove('hidden');
        audio.playCheer();
        audio.setRev(1); setTimeout(()=>audio.stopEngine(), 1200);
        confetti({particleCount:120, spread:70, origin:{y:0.8}});
      }else{ newRecordEl.classList.add('hidden'); }
    }
  }else{
    // attract screen draw
    game.draw();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
