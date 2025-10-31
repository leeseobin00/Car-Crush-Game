export const clamp = (v:number, min:number, max:number)=>Math.max(min, Math.min(max, v));
export const lerp = (a:number,b:number,t:number)=>a+(b-a)*t;
export const randomRange = (min:number, max:number)=>Math.random()*(max-min)+min;

export function AABB(ax:number, ay:number, aw:number, ah:number, bx:number, by:number, bw:number, bh:number){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function saveHighScore(key:string, score:number){
  try{ localStorage.setItem(key, String(score)); }catch{}
}
export function loadHighScore(key:string){
  try{ const v = localStorage.getItem(key); return v? Number(v): 0; }catch{ return 0; }
}

export function timeFormat(totalMs:number){
  const totalSec = Math.ceil(totalMs/1000);
  const m = Math.floor(totalSec/60).toString().padStart(2,'0');
  const s = (totalSec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
export {};
