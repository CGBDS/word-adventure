/* ============ WORD ADVENTURE — audio (TTS + SFX + música) ============ */
'use strict';

const AudioSys = {
  ctx:null, musicTimer:null, musicStep:0,

  ensure(){
    if(!this.ctx){
      try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
    }
    if(this.ctx && this.ctx.state==='suspended') this.ctx.resume();
  },

  tone(freq, dur, type, vol, delay){
    if(!S.settings.sfx || !this.ctx) return;
    type=type||'sine'; vol=vol||0.18; delay=delay||0;
    const t=this.ctx.currentTime+delay;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t+dur+0.05);
  },

  sfx(name){
    this.ensure();
    if(!S.settings.sfx) return;
    switch(name){
      case 'click':   this.tone(620,.08,'triangle',.12); break;
      case 'correct': this.tone(523,.12,'sine',.2); this.tone(659,.12,'sine',.2,.1); this.tone(784,.22,'sine',.22,.2); break;
      case 'wrong':   this.tone(220,.18,'sine',.14); this.tone(175,.25,'sine',.12,.12); break;
      case 'coin':    this.tone(988,.09,'square',.08); this.tone(1319,.16,'square',.08,.08); break;
      case 'star':    [523,587,659,784,880].forEach((f,i)=>this.tone(f,.14,'triangle',.16,i*.09)); break;
      case 'levelup': [523,659,784,1047,784,1047].forEach((f,i)=>this.tone(f,.16,'triangle',.18,i*.11)); break;
      case 'pop':     this.tone(440,.07,'sine',.14); break;
      case 'hint':    this.tone(740,.12,'sine',.12); this.tone(880,.14,'sine',.12,.1); break;
    }
  },

  speak(text){
    if(!S.settings.voice) return;
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='en-US'; u.rate=0.85; u.pitch=1.1;
      const vs=speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.toLowerCase().startsWith('en'));
      const pref=vs.find(v=>/female|samantha|zira|google us english/i.test(v.name));
      if(pref) u.voice=pref; else if(vs[0]) u.voice=vs[0];
      speechSynthesis.speak(u);
    }catch(e){}
  },

  // musiquita alegre procedural (pentatónica), muy suave
  startMusic(){
    this.stopMusic();
    if(!S.settings.music) return;
    this.ensure();
    const mel=[523,587,659,784,880,784,659,587, 523,659,784,880,1047,880,784,659];
    this.musicStep=0;
    this.musicTimer=setInterval(()=>{
      if(!S.settings.music || !this.ctx) return;
      const f=mel[this.musicStep%mel.length];
      const t=this.ctx.currentTime;
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='triangle'; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.035,t+0.05);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.42);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t+0.5);
      this.musicStep++;
    },460);
  },
  stopMusic(){ if(this.musicTimer){clearInterval(this.musicTimer); this.musicTimer=null;} },
};
