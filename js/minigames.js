/* ============ WORD ADVENTURE — minijuegos ============ */
'use strict';

function h(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function norm(s){ return (s||'').toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim(); }

const MG = {

  /* ---- 1. CHOOSE: I ___ happy. [AM|IS|ARE] ---- */
  choose(el, cfg, cb){
    let first=true;
    const card=h('div','prompt-card');
    card.appendChild(h('div','prompt-sentence', cfg.before+'<span class="blank">___</span>'+cfg.after));
    if(cfg.emoji) card.appendChild(h('div','big-emoji',cfg.emoji));
    const grid=h('div','opt-grid');
    const hintBox=h('div');
    card.appendChild(grid); card.appendChild(hintBox);
    el.appendChild(card);
    AudioSys.speak(cfg.speak);

    shuffle(cfg.options).forEach(op=>{
      const b=h('button','opt',op);
      b.onclick=()=>{
        AudioSys.sfx('click'); AudioSys.speak(op);
        if(op===cfg.correct){
          b.classList.add('correct');
          grid.querySelectorAll('.opt').forEach(x=>{ if(x!==b) x.classList.add('dim'); x.disabled=true; });
          AudioSys.sfx('correct');
          setTimeout(()=>cb(true,first),650);
        }else{
          first=false; b.classList.add('wrong'); b.disabled=true;
          AudioSys.sfx('wrong');
          if(cfg.hint && !hintBox.firstChild){ hintBox.appendChild(h('div','hint',cfg.hint)); AudioSys.sfx('hint'); }
          setTimeout(()=>b.classList.remove('wrong'),450);
        }
      };
      grid.appendChild(b);
    });
  },

  /* ---- 2. TIME MACHINE: ¿NOW / BEFORE / TOMORROW? ---- */
  time(el, cfg, cb){
    let first=true;
    const card=h('div','prompt-card');
    card.appendChild(h('div','big-emoji',cfg.emoji));
    card.appendChild(h('div','prompt-sentence',cfg.sentence));
    const grid=h('div','portals');
    const hintBox=h('div'); card.appendChild(grid); card.appendChild(hintBox); el.appendChild(card);
    AudioSys.speak(cfg.speak);
    [['now','🟢','NOW'],['before','🔵','BEFORE'],['tomorrow','🟣','TOMORROW']].forEach(([t,em,label])=>{
      const b=h('button','portal '+t,`<small>${em}</small>${label}`);
      b.onclick=()=>{
        AudioSys.sfx('click');
        if(t===cfg.correct){
          b.classList.add('correct');
          grid.querySelectorAll('.portal').forEach(x=>x.disabled=true);
          AudioSys.sfx('correct');
          setTimeout(()=>cb(true,first),700);
        }else{
          first=false; b.classList.add('wrong'); b.disabled=true; AudioSys.sfx('wrong');
          if(cfg.hint && !hintBox.firstChild){ hintBox.appendChild(h('div','hint',cfg.hint)); AudioSys.sfx('hint'); }
          setTimeout(()=>b.classList.remove('wrong'),450);
        }
      };
      grid.appendChild(b);
    });
  },

  /* ---- 3. BUILD: ordena las palabras ---- */
  build(el, cfg, cb){
    let first=true, placed=[];
    const card=h('div','prompt-card');
    if(cfg.emoji) card.appendChild(h('div','big-emoji',cfg.emoji));
    const slots=h('div','slots'), chips=h('div','chips'), hintBox=h('div');
    const del=h('button','mini-btn','⌫ Borrar');
    del.style.marginTop='10px';
    card.appendChild(slots); card.appendChild(chips); card.appendChild(del); card.appendChild(hintBox);
    el.appendChild(card);
    AudioSys.speak(cfg.speak);

    function renderSlots(){
      slots.innerHTML='';
      cfg.words.forEach((w,i)=>{
        const s=h('div','slot'+(placed[i]?' filled':''), placed[i]||'');
        slots.appendChild(s);
      });
    }
    function check(){
      if(placed.length<cfg.words.length) return;
      const ok=placed.every((w,i)=>w===cfg.words[i]);
      if(ok){
        slots.querySelectorAll('.slot').forEach(s=>{s.style.borderColor='var(--green)';s.style.background='#d9fbe2';});
        AudioSys.sfx('correct'); AudioSys.speak(cfg.speak);
        chips.querySelectorAll('.chip').forEach(c=>c.disabled=true);
        setTimeout(()=>cb(true,first),700);
      }else{
        first=false; AudioSys.sfx('wrong');
        if(cfg.hint && !hintBox.firstChild){ hintBox.appendChild(h('div','hint',cfg.hint)); AudioSys.sfx('hint'); }
        // resalta brevemente la primera palabra correcta como ayuda
        chips.querySelectorAll('.chip').forEach(c=>{
          if(c.textContent===cfg.words[0] && !c.classList.contains('used')){ c.style.borderColor='var(--gold)'; setTimeout(()=>c.style.borderColor='',900); }
        });
        placed=[]; renderSlots();
        chips.querySelectorAll('.chip').forEach(c=>c.classList.remove('used'));
      }
    }
    del.onclick=()=>{ AudioSys.sfx('click'); placed.pop(); renderSlots(); refreshChips(); };
    // rebuild chips state from placed counts (handles repeated words)
    function refreshChips(){
      const counts={};
      chips.querySelectorAll('.chip').forEach(c=>{
        const w=c.dataset.w; counts[w]=(counts[w]||0)+1;
        const usedN=placed.filter(x=>x===w).length;
        c.classList.toggle('used', counts[w]<=usedN);
      });
    }
    shuffle(cfg.words).forEach(w=>{
      const c=h('button','chip',w); c.dataset.w=w;
      c.onclick=()=>{
        if(c.classList.contains('used'))return;
        AudioSys.sfx('pop'); AudioSys.speak(w);
        placed.push(w); renderSlots(); refreshChips(); check();
      };
      chips.appendChild(c);
    });
    renderSlots();
  },

  /* ---- 4. MATCH: GO → WENT ---- */
  match(el, cfg, cb){
    let first=true, sel=null, done=0, mistakes=0;
    const card=h('div','prompt-card');
    card.appendChild(h('div','center','<b>Toca una pareja</b> 👆'));
    const grid=h('div','match-grid'); card.appendChild(grid); el.appendChild(card);
    const left=shuffle(cfg.pairs.map(p=>({t:p[0],k:p[0]})));
    const right=shuffle(cfg.pairs.map(p=>({t:p[1],k:p[0]})));
    const cards=[];
    function mk(side,item){
      const b=h('button','mcard',`<span class="em">${item.emoji||''}</span>${item.t}`);
      b.dataset.k=item.k; b.dataset.side=side;
      b.onclick=()=>{
        if(b.classList.contains('done')||b.classList.contains('sel'))return;
        AudioSys.sfx('click'); AudioSys.speak(item.t);
        if(!sel){ sel=b; b.classList.add('sel'); return; }
        if(sel.dataset.side===side){ sel.classList.remove('sel'); sel=b; b.classList.add('sel'); return; }
        if(sel.dataset.k===b.dataset.k){
          sel.classList.remove('sel'); sel.classList.add('done'); b.classList.add('done');
          AudioSys.sfx('correct'); done++; sel=null;
          if(done===cfg.pairs.length) setTimeout(()=>cb(true,mistakes===0),700);
        }else{
          mistakes++; first=false; AudioSys.sfx('wrong');
          const s=sel; sel=null;
          s.classList.add('wrong'); b.classList.add('wrong');
          setTimeout(()=>{s.classList.remove('sel','wrong'); b.classList.remove('wrong');},500);
        }
      };
      cards.push(b); return b;
    }
    // interleave: left column items then right column — use grid order: render left cards then right cards
    left.forEach(it=>grid.appendChild(mk('L',it)));
    right.forEach(it=>grid.appendChild(mk('R',it)));
  },

  /* ---- 5. LISTEN: escucha y elige ---- */
  listen(el, cfg, cb){
    let first=true;
    const card=h('div','prompt-card');
    const spk=h('button','speak-btn','🔊');
    spk.onclick=()=>{AudioSys.sfx('click'); AudioSys.speak(cfg.speak);};
    card.appendChild(spk);
    card.appendChild(h('div','center','<b>Toca 🔊 y elige lo que escuchas</b>'));
    const grid=h('div','opt-grid'), hintBox=h('div');
    card.appendChild(grid); card.appendChild(hintBox); el.appendChild(card);
    setTimeout(()=>AudioSys.speak(cfg.speak),400);
    shuffle(cfg.options).forEach(op=>{
      const b=h('button','opt',op);
      b.style.fontSize='24px';
      b.onclick=()=>{
        AudioSys.sfx('click');
        if(op===cfg.correct){
          b.classList.add('correct');
          grid.querySelectorAll('.opt').forEach(x=>{ if(x!==b)x.classList.add('dim'); x.disabled=true; });
          AudioSys.sfx('correct');
          setTimeout(()=>cb(true,first),650);
        }else{
          first=false; b.classList.add('wrong'); b.disabled=true; AudioSys.sfx('wrong');
          if(cfg.hint && !hintBox.firstChild){ hintBox.appendChild(h('div','hint',cfg.hint)); AudioSys.sfx('hint'); }
          setTimeout(()=>b.classList.remove('wrong'),450);
        }
      };
      grid.appendChild(b);
    });
  },

  /* ---- 6. SPEAK: repite la frase ---- */
  speak(el, cfg, cb){
    let fails=0, finished=false;
    const done=(ok,first)=>{ if(!finished){ finished=true; cb(ok,first); } };
    const card=h('div','prompt-card');
    card.appendChild(h('div','prompt-sentence',cfg.phrase));
    const spk=h('button','speak-btn','🔊');
    spk.onclick=()=>{AudioSys.sfx('click'); AudioSys.speak(cfg.phrase);};
    card.appendChild(spk);
    const status=h('div','center','<b>Di la frase en voz alta 🗣️</b>');
    card.appendChild(status);
    const skipBox=h('div','center'); card.appendChild(skipBox);
    el.appendChild(card);
    setTimeout(()=>AudioSys.speak(cfg.phrase),400);

    function showSkip(){
      if(skipBox.firstChild||finished) return;
      const sk=h('button','mini-btn','Omitir ➜');
      sk.style.marginTop='12px'; sk.style.background='linear-gradient(180deg,#b9b0a2,#9a917f)'; sk.style.boxShadow='0 4px 0 #6f675a';
      sk.onclick=()=>{ AudioSys.sfx('click'); done(true,false); };
      skipBox.appendChild(sk);
      skipBox.appendChild(h('div','center','<small>Puedes practicar la voz en otro momento 🎤</small>'));
    }

    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){
      const mic=h('button','mic-btn','🎤'); card.appendChild(mic);
      mic.onclick=()=>{
        if(finished) return;
        mic.classList.add('listening'); status.innerHTML='<b>Escuchando...</b> 👂'; AudioSys.sfx('click');
        listenOnce((transcript)=>{
          mic.classList.remove('listening');
          if(finished) return;
          if(!transcript){
            fails++;
            status.innerHTML='<b>No te escuché, intenta de nuevo</b> 🔁';
            if(fails>=1) showSkip();
            return;
          }
          const ok=matchPhrase(cfg.phrase, transcript);
          if(ok){
            status.innerHTML='🎉 <b>¡Perfecto!</b>';
            mic.disabled=true; AudioSys.sfx('correct');
            setTimeout(()=>done(true,true),700);
          }else{
            fails++;
            status.innerHTML=`<b>Escuché:</b> "${transcript}"<br>Toca 🔊 e intenta de nuevo 💪`;
            AudioSys.sfx('wrong');
            if(fails>=2) showSkip();
          }
        });
      };
    }else{
      const doneBtn=h('button','btn','✅ ¡Lo dije!');
      doneBtn.onclick=()=>{ AudioSys.sfx('correct'); setTimeout(()=>done(true,true),400); };
      card.appendChild(doneBtn);
      card.appendChild(h('div','center','<small>Di la frase en voz alta y pulsa el botón</small>'));
    }
  },
};

function listenOnce(cb){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new SR(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=3;
  let done=false;
  const fin=(t)=>{ if(!done){done=true; try{r.stop();}catch(e){} cb(t);} };
  r.onresult=e=>fin(e.results[0][0].transcript);
  r.onerror=()=>fin(null);
  try{ r.start(); }catch(e){ fin(null); return; }
  setTimeout(()=>fin(null),7000);
}
function matchPhrase(phrase, transcript){
  const pw=norm(phrase).split(' ').filter(w=>w.length>1);
  const tw=norm(transcript).split(' ');
  const hits=pw.filter(w=>tw.includes(w)).length;
  return hits>=Math.ceil(pw.length*0.6);
}
