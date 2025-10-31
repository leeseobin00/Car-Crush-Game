type Node = AudioNode & { stop?: (t?:number)=>void };

export class AudioSystem{
  ctx: AudioContext;
  master: GainNode;
  engineOsc?: OscillatorNode; engineGain: GainNode; revAmount=0;
  noiseBuf: AudioBuffer;
  constructor(){
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineGain.connect(this.master);

    // Create engine osc but start on first interaction
    this.noiseBuf = this.createNoise();
  }
  resume(){ if(this.ctx.state !== 'running') this.ctx.resume(); }

  startEngine(){
    if(this.engineOsc) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 80;
    const filter = this.ctx.createBiquadFilter();
    filter.type='lowpass'; filter.frequency.value = 800;
    osc.connect(filter); filter.connect(this.engineGain);
    osc.start();
    this.engineOsc = osc;
  }
  setRev(amount:number){
    this.revAmount = amount;
    this.startEngine();
    const freq = 60 + amount*260;
    const g = 0.02 + amount*0.25;
    this.engineGain.gain.linearRampToValueAtTime(g, this.ctx.currentTime + 0.05);
    if(this.engineOsc) this.engineOsc.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 0.05);
  }
  stopEngine(){
    if(!this.engineOsc) return;
    this.engineGain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.2);
  }
  playCrunch(){ this.playNoise(0.15, 0.6, 1200); }
  playSparks(){ this.playNoise(0.08, 0.4, 4000); }
  playCheer(){
    // quick triad chord
    const g = this.ctx.createGain(); g.gain.value=0.3; g.connect(this.master);
    const freqs = [440, 554.37, 659.25];
    freqs.forEach((f,i)=>{
      const o=this.ctx.createOscillator(); o.type='square'; o.frequency.value=f;
      const og=this.ctx.createGain(); og.gain.value=0.0001; o.connect(og); og.connect(g);
      o.start(); og.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime+0.03*(i+1));
      og.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime+0.8);
      o.stop(this.ctx.currentTime+0.85);
    });
  }
  private createNoise(){
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*1, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * (1 - i/data.length);
    return buf;
  }
  private playNoise(dur:number, vol:number, lp:number){
    const n = this.ctx.createBufferSource(); n.buffer=this.noiseBuf;
    const g = this.ctx.createGain(); g.gain.value=vol; const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp;
    n.connect(f); f.connect(g); g.connect(this.master);
    n.start(); n.stop(this.ctx.currentTime + dur);
  }
}
