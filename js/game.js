/* ============ WORD ADVENTURE — motor del juego ============ */
'use strict';

/* ---------- ESTADO ---------- */
const SAVE_KEY='wordAdventureSaveV1';
function defState(){ return {
  v:1, xp:0, coins:0, streak:0, best:0,
  world:1, level:1, stars:{}, items:{}, verbsN:5,
  owned:{hat:['none'],glasses:['none'],color:['blue']},
  eq:{hat:'none',glasses:'none',color:'blue'},
  settings:{sfx:true,music:true,voice:true,motion:true},
  seenIntro:false,
};}
let S=defState();
function save(){ try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){} }
function load(){ try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)); if(s&&s.v===1) S=Object.assign(defState(),s);}catch(e){} }
function itemKey(k){ return S.items[k]||(S.items[k]={ok:0,bad:0}); }
function gameLevel(){ return Math.floor(S.xp/100)+1; }

/* ---------- HELPERS UI ---------- */
const $=s=>document.querySelector(s);
function toast(msg,ms){
  const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.add('hidden'),ms||2200);
}
function modal(html){
  const ov=$('#overlay'); ov.classList.remove('hidden');
  ov.innerHTML=`<div class="modal">${html}</div>`;
}
function closeModal(){ const ov=$('#overlay'); ov.classList.add('hidden'); ov.innerHTML=''; }
function confetti(n){
  if(!S.settings.motion) return;
  const colors=['#ff5a5a','#ffc93c','#35c759','#3b82f6','#a855f7'];
  for(let i=0;i<(n||40);i++){
    const c=document.createElement('div'); c.className='confetti';
    c.style.left=Math.random()*100+'vw'; c.style.top='-20px';
    c.style.background=colors[i%colors.length];
    c.style.animationDuration=(1.6+Math.random()*1.4)+'s';
    document.body.appendChild(c); setTimeout(()=>c.remove(),3200);
  }
}
function updateHUD(){
  $('#hud-level').textContent=gameLevel();
  const pct=(S.xp%100);
  $('#hud-xp').style.width=pct+'%';
  $('#hud-xp-text').textContent=S.xp+' XP · Nv '+gameLevel();
  $('#hud-coins').textContent='🪙 '+S.coins;
  $('#hud-streak').textContent='🔥 '+S.streak;
}

/* ---------- PERSONAJE SVG ---------- */
function charSVG(){
  const c=SHOP.color.find(x=>x.id===S.eq.color)||SHOP.color[0];
  const hat=(SHOP.hat.find(x=>x.id===S.eq.hat)||{}).emoji||'';
  const gl=(SHOP.glasses.find(x=>x.id===S.eq.glasses)||{}).emoji||'';
  return `<svg class="char-svg" viewBox="0 0 150 175" aria-label="Bolt">
    <line x1="75" y1="20" x2="75" y2="36" stroke="#8a7a6a" stroke-width="5" stroke-linecap="round"/>
    <circle cx="75" cy="15" r="7" fill="#ffc93c"/>
    <rect x="42" y="36" width="66" height="56" rx="20" fill="${c.c1}" stroke="${c.c2}" stroke-width="4"/>
    <circle cx="63" cy="60" r="10" fill="#fff"/><circle cx="63" cy="60" r="5" fill="#3a2f2a"/>
    <circle cx="87" cy="60" r="10" fill="#fff"/><circle cx="87" cy="60" r="5" fill="#3a2f2a"/>
    <path d="M62 76 Q75 84 88 76" stroke="#3a2f2a" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${hat?`<text x="78" y="34" font-size="38" text-anchor="middle">${hat}</text>`:''}
    ${gl?`<text x="75" y="70" font-size="36" text-anchor="middle">${gl}</text>`:''}
    <rect x="52" y="96" width="46" height="42" rx="14" fill="${c.c2}"/>
    <circle cx="75" cy="110" r="7" fill="#ffc93c"/>
    <rect x="28" y="100" width="16" height="30" rx="8" fill="${c.c1}" stroke="${c.c2}" stroke-width="3"/>
    <rect x="106" y="100" width="16" height="30" rx="8" fill="${c.c1}" stroke="${c.c2}" stroke-width="3"/>
    <rect x="58" y="138" width="14" height="26" rx="7" fill="${c.c1}" stroke="${c.c2}" stroke-width="3"/>
    <rect x="78" y="138" width="14" height="26" rx="7" fill="${c.c1}" stroke="${c.c2}" stroke-width="3"/>
  </svg>`;
}

/* ---------- ROUTER ---------- */
function go(name,arg){
  closeModal();
  const hudOn=!['title'].includes(name);
  $('#hud').classList.toggle('hidden',!hudOn);
  if(hudOn) updateHUD();
  $('#screen').scrollTop=0;
  Screen[name](arg);
  save();
}

/* ---------- PANTALLAS ---------- */
const Screen={};

Screen.title=()=>{
  $('#screen').innerHTML=`
  <div class="title-wrap">
    <div class="game-sub">LA MÁQUINA DEL TIEMPO</div>
    <h1 class="game-logo">WORD<br><span class="t2">ADVENTURE</span></h1>
    <div class="center">${charSVG()}</div>
    <button class="btn" id="b-play">▶ ¡JUGAR!</button>
    <div class="menu-grid">
      <button class="btn ghost" id="b-prac">🎯 Práctica</button>
      <button class="btn ghost" id="b-shop">🛍️ Tienda</button>
    </div>
  </div>`;
  $('#b-play').onclick=()=>{ AudioSys.ensure(); AudioSys.sfx('click'); AudioSys.startMusic();
    if(!S.seenIntro) startTutorial(); else go('map'); };
  $('#b-prac').onclick=()=>{AudioSys.sfx('click'); go('practice');};
  $('#b-shop').onclick=()=>{AudioSys.sfx('click'); go('shop');};
};

Screen.map=()=>{
  const repaired=WORLDS.filter(w=>S.stars[w.id+'.4']>0).length;
  let worlds='';
  WORLDS.forEach(w=>{
    const locked=w.id>S.world;
    const done=[1,2,3,4].filter(l=>S.stars[w.id+'.'+l]>0).length;
    worlds+=`<button class="world-row${locked?' locked':''}" data-w="${w.id}" ${locked?'disabled':''}>
      <span class="world-ico">${locked?'🔒':w.emoji}</span>
      <span><span class="world-name">${w.name}</span><br><span class="world-sub">${w.sub}</span></span>
      ${locked?'<span class="lock">🔒</span>':`<span class="world-stars">${done>0?'✅':''} ${done}/4</span>`}
    </button>`;
  });
  $('#screen').innerHTML=`
    <div class="machine-card">
      <div class="machine">${repaired>=8?'🚀✨':'⏰🔧'}</div>
      <h3>La Máquina del Tiempo</h3>
      <div style="font-weight:700;color:var(--ink-soft);font-size:15px">${repaired>=8?'¡REPARADA! Eres un maestro del tiempo 🎉':'Completa mundos para repararla'}</div>
      <div class="repair-dots">${WORLDS.map(w=>`<span class="${S.stars[w.id+'.4']>0?'on':''}"></span>`).join('')}</div>
    </div>
    <div class="world-list">${worlds}</div>`;
  document.querySelectorAll('.world-row:not(.locked)').forEach(b=>{
    b.onclick=()=>{AudioSys.sfx('click'); go('levels',+b.dataset.w);};
  });
};

Screen.levels=(w)=>{
  const W=WORLDS.find(x=>x.id===w);
  let btns='';
  for(let l=1;l<=LEVELS_PER_WORLD;l++){
    const unlocked=(w<S.world)||(w===S.world&&l<=S.level);
    const st=S.stars[w+'.'+l]||0;
    btns+=`<button class="lvl-btn${unlocked?'':' locked'}" data-l="${l}" ${unlocked?'':'disabled'}>
      ${unlocked?l:'🔒'}${st?`<span class="st">${'⭐'.repeat(st)}</span>`:''}</button>`;
  }
  $('#screen').innerHTML=`
    <div class="level-top"><button class="back-btn" id="b-back">←</button>
      <h2 style="font-size:26px">${W.emoji} ${W.name}</h2></div>
    <div class="center" style="color:var(--ink-soft);font-weight:700">${W.sub}</div>
    <div class="lvl-grid">${btns}</div>
    <button class="btn ghost small" id="b-map">🗺️ Mapa</button>`;
  $('#b-back').onclick=()=>{AudioSys.sfx('click'); go('map');};
  $('#b-map').onclick=()=>{AudioSys.sfx('click'); go('map');};
  document.querySelectorAll('.lvl-btn:not(.locked)').forEach(b=>{
    b.onclick=()=>{AudioSys.sfx('click'); startLevel(w,+b.dataset.l);};
  });
};

Screen.practice=()=>{
  const verbs=VERBS.slice(0,S.verbsN);
  $('#screen').innerHTML=`
    <div class="level-top"><button class="back-btn" id="b-back">←</button><h2 style="font-size:26px">🎯 Práctica</h2></div>
    <div class="card center"><div style="font-size:20px;font-weight:800">🏠 THE HOUSE OF TO BE</div>
      <div style="color:var(--ink-soft);font-weight:700">AM · IS · ARE · WAS · WERE</div>
      <button class="btn blue" id="p-tobe" style="margin-top:10px">Entrar 🏠</button></div>
    <h3 style="margin:8px 4px">Mis verbos (${verbs.length})</h3>
    <div id="vlist"></div>
    <button class="btn orange" id="p-quiz">⚡ ¡Quiz rápido!</button>`;
  $('#b-back').onclick=()=>{AudioSys.sfx('click'); go('title');};
  $('#p-tobe').onclick=()=>{AudioSys.sfx('click'); go('flash',{kind:'tobe'});};
  $('#p-quiz').onclick=()=>{AudioSys.sfx('click'); startQuiz();};
  const vl=$('#vlist');
  verbs.forEach(v=>{
    const b=document.createElement('button'); b.className='verb-chip';
    b.innerHTML=`<span class="em">${v.emoji}</span><span><span class="vn">${v.base.toUpperCase()}</span><br><span class="vs">${v.es} · ${v.past} · will ${v.base}</span></span>`;
    b.onclick=()=>{AudioSys.sfx('click'); go('flash',{kind:'verb',base:v.base});};
    vl.appendChild(b);
  });
};

Screen.flash=(arg)=>{
  const back=()=>go('practice');
  if(arg.kind==='verb'){
    const v=VERBS.find(x=>x.base===arg.base);
    const forms={now:`I ${v.base.toUpperCase()}`,before:`I ${v.past.toUpperCase()}`,tomorrow:`I WILL ${v.base.toUpperCase()}`};
    const spk={now:`I ${v.base}`,before:`I ${v.past}`,tomorrow:`I will ${v.base}`};
    let t='now';
    $('#screen').innerHTML=`
      <div class="level-top"><button class="back-btn" id="b-back">←</button><h2 style="font-size:24px">${v.emoji} ${v.base.toUpperCase()} <small style="font-size:15px;color:var(--ink-soft)">${v.es}</small></h2></div>
      <div class="time-tabs">
        <button class="time-tab on" data-t="now">🟢 NOW</button>
        <button class="time-tab" data-t="before">🔵 BEFORE</button>
        <button class="time-tab" data-t="tomorrow">🟣 TOMORROW</button>
      </div>
      <div class="prompt-card"><div class="flash" id="f-em">${v.emoji}</div>
        <div class="phrase" id="f-ph">${forms.now}</div>
        <button class="speak-btn" id="f-spk">🔊</button></div>`;
    $('#b-back').onclick=()=>{AudioSys.sfx('click'); back();};
    const upd=()=>{ $('#f-ph').textContent=forms[t];
      document.querySelectorAll('.time-tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
      AudioSys.speak(spk[t]); };
    document.querySelectorAll('.time-tab').forEach(b=>b.onclick=()=>{AudioSys.sfx('click'); t=b.dataset.t; upd();});
    $('#f-spk').onclick=()=>AudioSys.speak(spk[t]);
    setTimeout(()=>AudioSys.speak(spk.now),300);
  }else{
    // TO BE explorer
    let pron='I', t='present';
    const label={present:'🟢 PRESENTE',past:'🔵 PASADO',future:'🟣 FUTURO'};
    const form=()=> t==='future' ? 'WILL BE' : TOBE[t][pron];
    const pEm=pn=>(PRONOUNS.find(x=>x.p===pn)||{}).emoji||'';
    $('#screen').innerHTML=`
      <div class="level-top"><button class="back-btn" id="b-back">←</button><h2 style="font-size:24px">🏠 HOUSE OF TO BE</h2></div>
      <div class="time-tabs">
        <button class="time-tab on" data-t="present">🟢 NOW</button>
        <button class="time-tab" data-t="past">🔵 BEFORE</button>
        <button class="time-tab" data-t="future">🟣 TOMORROW</button>
      </div>
      <div class="prompt-card"><div class="flash" id="f-em">${pEm('I')}</div>
        <div class="tbadge now" id="f-tb">🟢 PRESENTE</div>
        <div class="phrase" id="f-ph">I AM</div>
        <button class="speak-btn" id="f-spk">🔊</button></div>
      <div class="chips" id="f-prons"></div>
      <div class="card center" style="font-size:17px;font-weight:700">🧠 AM=I · IS=he/she/it · ARE=you/we/they</div>`;
    $('#b-back').onclick=()=>{AudioSys.sfx('click'); back();};
    const box=$('#f-prons');
    PRONOUNS.forEach(pn=>{
      const c=h('button','chip',pn.emoji+' '+pn.p);
      c.style.fontSize='18px';
      c.onclick=()=>{AudioSys.sfx('click'); pron=pn.p; upd();};
      box.appendChild(c);
    });
    const upd=()=>{
      $('#f-em').textContent=pEm(pron); $('#f-ph').textContent=pron+' '+form();
      $('#f-tb').textContent=label[t]; $('#f-tb').className='tbadge '+(t==='present'?'now':t==='past'?'before':'tomorrow');
      document.querySelectorAll('.time-tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
      AudioSys.speak((pron+' '+form()).toLowerCase());
    };
    document.querySelectorAll('.time-tab').forEach(b=>b.onclick=()=>{AudioSys.sfx('click'); t=b.dataset.t; upd();});
    $('#f-spk').onclick=()=>AudioSys.speak((pron+' '+form()).toLowerCase());
    setTimeout(()=>AudioSys.speak('i am'),300);
  }
};

Screen.shop=()=>{
  $('#screen').innerHTML=`
    <div class="level-top"><button class="back-btn" id="b-back">←</button><h2 style="font-size:26px">🛍️ Tienda</h2>
      <span class="pill coins" style="margin-left:auto">🪙 ${S.coins}</span></div>
    <div class="char-preview">${charSVG()}<div style="font-weight:800">Bolt, tu compañero 🤖</div></div>
    <div id="shop-body"></div>`;
  $('#b-back').onclick=()=>{AudioSys.sfx('click'); go('title');};
  const body=$('#shop-body');
  const sections=[['hat','🎩 Gorros'],['glasses','👓 Lentes'],['color','🎨 Colores']];
  sections.forEach(([sec,title])=>{
    body.appendChild(h('h3',null,title)).style.margin='14px 4px 4px';
    const grid=h('div','shop-grid');
    SHOP[sec].forEach(it=>{
      const owned=S.owned[sec].includes(it.id);
      const eq=S.eq[sec]===it.id;
      const d=h('div','shop-item');
      const em=it.emoji||(sec==='color'?`<span style="display:inline-block;width:40px;height:40px;border-radius:50%;background:${it.c1}"></span>`:'🚫');
      d.innerHTML=`<div class="em">${em}</div><div class="nm">${it.name}</div><div class="pr">${it.price?('🪙 '+it.price):'Gratis'}</div>`;
      const b=h('button','mini-btn'+(eq?' equipped':owned?' owned':''), eq?'Puesto ✓':owned?'Poner':('Comprar'));
      b.onclick=()=>{
        if(eq) return;
        if(owned){ S.eq[sec]=it.id; AudioSys.sfx('click'); }
        else if(S.coins>=it.price){ S.coins-=it.price; S.owned[sec].push(it.id); S.eq[sec]=it.id; AudioSys.sfx('coin'); toast('¡Comprado! '+it.name); }
        else { AudioSys.sfx('wrong'); toast('Te faltan 🪙 ¡Sigue jugando!'); return; }
        save(); updateHUD(); go('shop');
      };
      d.appendChild(b); grid.appendChild(d);
    });
    body.appendChild(grid);
  });
};

function openSettings(){
  const s=S.settings;
  const row=(k,icon,label)=>`<div class="set-row"><span>${icon} ${label}</span><button class="toggle${s[k]?' on':''}" data-k="${k}" aria-label="${label}"></button></div>`;
  modal(`<h2>⚙️ Ajustes</h2>
    ${row('sfx','🔊','Sonidos')}
    ${row('music','🎵','Música')}
    ${row('voice','🗣️','Voz en inglés')}
    ${row('motion','✨','Animaciones')}
    <button class="btn ghost small" id="set-reset" style="color:#b32727">🗑️ Borrar progreso</button>
    <button class="btn" id="set-close">Listo</button>`);
  document.querySelectorAll('.toggle').forEach(t=>{
    t.onclick=()=>{
      const k=t.dataset.k; S.settings[k]=!S.settings[k]; t.classList.toggle('on',S.settings[k]);
      AudioSys.sfx('click');
      document.body.classList.toggle('reduce-motion',!S.settings.motion);
      if(k==='music'){ S.settings.music?AudioSys.startMusic():AudioSys.stopMusic(); }
      save();
    };
  });
  $('#set-close').onclick=()=>{AudioSys.sfx('click'); closeModal();};
  const rs=$('#set-reset');
  rs.onclick=()=>{
    if(rs.dataset.arm){ S=defState(); save(); location.reload(); }
    else{ rs.dataset.arm='1'; rs.textContent='⚠️ Toca otra vez para confirmar'; AudioSys.sfx('wrong'); }
  };
}

/* ---------- TUTORIAL ---------- */
function startTutorial(){
  const ov=$('#overlay'); ov.classList.remove('hidden');
  const steps=[
    {emoji:'⏰💥', text:'¡La <b>máquina del tiempo</b> se rompió!<br>¿Me ayudas a repararla?', btn:'¡Sí, vamos! 🚀'},
    {emoji:'🍎', text:'Mira 👀 Escucha 🔊 Toca 👆<br><span class="tbadge now">NOW</span>', word:'EAT'},
    {emoji:'🎉', text:'<b>¡CORRECTO!</b><br>Ya sabes una palabra.', btn:'Siguiente ➜'},
    {emoji:'🍎', text:'Ahora viaja al pasado...<br><span class="tbadge before">BEFORE</span>', word:'ATE'},
    {emoji:'🎉', text:'<b>¡CORRECTO!</b><br>EAT → ATE', btn:'Siguiente ➜'},
    {emoji:'🍎', text:'Y al futuro...<br><span class="tbadge tomorrow">TOMORROW</span>', word:'WILL EAT'},
    {emoji:'🎉', text:'<b>¡APRENDISTE 3 PALABRAS!</b><br>EAT → ATE → WILL EAT<br>La máquina se está reparando ⚙️✨', btn:'¡A JUGAR! 🎮'},
  ];
  let i=0;
  function render(){
    const st=steps[i];
    ov.innerHTML=`<div class="modal"><div class="tut-char">${st.emoji}</div><div class="tut-text">${st.text}</div><div id="tut-act"></div></div>`;
    const act=$('#tut-act');
    if(st.word){
      const b=h('button','opt',st.word); b.style.fontSize='44px'; b.style.padding='22px';
      AudioSys.speak(st.word.toLowerCase());
      const spk=h('button','speak-btn','🔊'); spk.style.width='64px'; spk.style.height='64px'; spk.style.fontSize='28px';
      spk.onclick=e=>{e.stopPropagation(); AudioSys.speak(st.word.toLowerCase());};
      act.appendChild(b); act.appendChild(spk);
      b.onclick=()=>{ AudioSys.sfx('correct'); confetti(24); setTimeout(next,450); };
    }else{
      const b=h('button','btn',st.btn); b.onclick=()=>{AudioSys.sfx('click'); next();}; act.appendChild(b);
    }
  }
  function next(){
    i++;
    if(i>=steps.length){ ov.classList.add('hidden'); ov.innerHTML=''; S.seenIntro=true; save(); go('map'); }
    else render();
  }
  render();
}

/* ---------- CONSTRUCTOR DE NIVELES ---------- */
function starters(){ return VERBS.filter(v=>v.starter); }
function uverbs(){ return VERBS.slice(0,S.verbsN); }

function buildRounds(w,l){
  let R=[]; const st=starters();
  const q=(g,c,key)=>R.push({g,c,key:key||('w'+w+Math.random().toString(36).slice(2,7))});
  const pro4=()=>shuffle(['I','YOU','WE','THEY'])[0];

  if(w===1){ // NOW
    if(l===1){
      shuffle(st).forEach(v=>q('choose',{before:'I ',after:'.',emoji:v.emoji,speak:'I '+v.base,
        options:shuffle([v.base.toUpperCase(),...shuffle(st.filter(x=>x!==v)).slice(0,2).map(x=>x.base.toUpperCase())]),
        correct:v.base.toUpperCase(),hint:'💡 Mira el dibujo '+v.emoji},`w1v:${v.base}`));
      R.push({g:'listen',c:{speak:'I play',options:['I PLAY','I PLAYED','I WILL PLAY'],correct:'I PLAY',hint:'💡 Escucha bien 🔊'},key:'w1:listen:play'});
      R.push({g:'speak',c:{phrase:'I am happy',hint:''},key:'w1:speak:1'});
    }else if(l===2){
      ['HE','SHE','IT'].forEach(pn=>{
        const v=shuffle(st)[0];
        q('choose',{before:pn+' ',after:'.',emoji:v.emoji,speak:pn.toLowerCase()+' '+v.base+'s',
          options:[v.base.toUpperCase()+'S',v.base.toUpperCase(),v.past.toUpperCase()],correct:v.base.toUpperCase()+'S',
          hint:'💡 HE / SHE / IT + S 👦👧🐶'},`w1s:${pn}:${v.base}`);
      });
      const v2=shuffle(st)[0];
      q('build',{words:['I',v2.base.toUpperCase()],emoji:v2.emoji,speak:'I '+v2.base,hint:'💡 Orden: I → verbo'},`w1b:${v2.base}`);
      const v3=shuffle(st)[0];
      q('time',{sentence:'I '+v3.base.toUpperCase()+' '+v3.emoji,emoji:v3.emoji,speak:'I '+v3.base,correct:'now',hint:'💡 Sin ED ni WILL = NOW 🟢'},`w1t:${v3.base}`);
      q('listen',{speak:'They play',options:['THEY PLAY','THEY PLAYED','THEY WILL PLAY'],correct:'THEY PLAY',hint:'💡 ¿Escuchas ED o WILL? ¡No! = NOW'},'w1:listen:they');
      q('speak',{phrase:'She plays',hint:''},'w1:speak:2');
    }else if(l===3){
      const vs=shuffle(st);
      q('match',{pairs:vs.slice(0,3).map(v=>[v.base.toUpperCase(),v.emoji])},'w1:m1');
      q('build',{words:['YOU',vs[3].base.toUpperCase()],emoji:vs[3].emoji,speak:'you '+vs[3].base,hint:'💡 YOU → verbo sin S'},'w1:b2');
      q('build',{words:['WE',vs[4].base.toUpperCase()],emoji:vs[4].emoji,speak:'we '+vs[4].base,hint:'💡 WE → verbo sin S'},'w1:b3');
      q('choose',{before:'THEY ',after:'.',emoji:vs[0].emoji,speak:'they '+vs[0].base,
        options:[vs[0].base.toUpperCase(),vs[0].base.toUpperCase()+'S',vs[0].past.toUpperCase()],correct:vs[0].base.toUpperCase(),hint:'💡 THEY → sin S'},'w1:c:they');
      q('time',{sentence:'SHE '+vs[1].base.toUpperCase()+'S '+vs[1].emoji,emoji:vs[1].emoji,speak:'she '+vs[1].base+'s',correct:'now',hint:'💡 NOW 🟢'},'w1:t2');
      q('listen',{speak:'I like apples',options:['I LIKE APPLES','I LIKED APPLES','I WILL LIKE APPLES'],correct:'I LIKE APPLES',hint:'💡 LIKE, sin ED'},'w1:listen:3');
      q('speak',{phrase:'We play',hint:''},'w1:speak:3');
      q('choose',{before:'IT ',after:'.',emoji:'🐶',speak:'it sees',options:['SEES','SEE','SAW'],correct:'SEES',hint:'💡 IT + S 🐶'},'w1:c:it');
    }else{
      for(let i=0;i<2;i++){const v=shuffle(st)[0],pn=pro4();
        q('choose',{before:pn+' ',after:'.',emoji:v.emoji,speak:pn.toLowerCase()+' '+v.base,
          options:shuffle([v.base.toUpperCase(),v.past.toUpperCase(),'WILL '+v.base.toUpperCase()]),correct:v.base.toUpperCase(),hint:'💡 NOW = forma simple 🟢'},`w1:mix:${v.base}:${i}`);}
      for(let i=0;i<2;i++){const v=shuffle(st)[0];
        q('time',{sentence:(pro4())+' '+v.base.toUpperCase()+' '+v.emoji,emoji:v.emoji,speak:v.base,correct:'now',hint:'💡 NOW 🟢'},`w1:mt:${v.base}:${i}`);}
      q('build',{words:['THEY','LIKE'],emoji:'❤️',speak:'they like',hint:'💡 Sujeto primero'},'w1:mb1');
      q('listen',{speak:'You eat',options:['YOU EAT','YOU ATE','YOU WILL EAT'],correct:'YOU EAT',hint:'💡 NOW'},'w1:ml1');
      const vs=shuffle(st); q('match',{pairs:vs.slice(0,3).map(v=>[v.base.toUpperCase(),v.emoji])},'w1:mm1');
    }
  }
  else if(w===2){ // BEFORE
    const pastOpts=v=>shuffle([v.past.toUpperCase(),v.base.toUpperCase(),'WILL '+v.base.toUpperCase()]);
    if(l===1){
      shuffle(st).forEach(v=>q('choose',{before:'Yesterday, I ',after:'.',emoji:v.emoji,speak:'yesterday I '+v.past,
        options:pastOpts(v),correct:v.past.toUpperCase(),hint:'💡 YESTERDAY = BEFORE 🔵'},`w2:${v.base}`));
      q('listen',{speak:'I ate',options:['I EAT','I ATE','I WILL EAT'],correct:'I ATE',hint:'💡 ¿Escuchas el pasado?'},'w2:listen:1');
      q('speak',{phrase:'I played',hint:''},'w2:speak:1');
      q('time',{sentence:'I WENT 🚀',emoji:'🚀',speak:'I went',correct:'before',hint:'💡 WENT = BEFORE 🔵'},'w2:t:1');
    }else if(l===2){
      const vs=shuffle(st);
      q('match',{pairs:vs.slice(0,4).map(v=>[v.base.toUpperCase(),v.past.toUpperCase()])},'w2:m1');
      q('match',{pairs:vs.slice(1,4).map(v=>[v.base.toUpperCase(),v.past.toUpperCase()])},'w2:m2');
      q('choose',{before:'She ',after:' an apple.',emoji:'🍎',speak:'she ate an apple',
        options:['ATE','EAT','WILL EAT'],correct:'ATE',hint:'💡 EAT → ATE (cambia)'},'w2:c:eat');
      q('build',{words:['I','ATE'],emoji:'🍎',speak:'I ate',hint:'💡 I → ATE'},'w2:b:1');
      q('time',{sentence:'THEY PLAYED ⚽',emoji:'⚽',speak:'they played',correct:'before',hint:'💡 +ED = BEFORE 🔵'},'w2:t:2');
      q('speak',{phrase:'We went',hint:''},'w2:speak:2');
    }else if(l===3){
      for(let i=0;i<3;i++){const v=shuffle(st)[0],pn=pro4();
        q('choose',{before:pn+' ',after:' yesterday.',emoji:v.emoji,speak:pn.toLowerCase()+' '+v.past+' yesterday',
          options:pastOpts(v),correct:v.past.toUpperCase(),hint:v.regular?'💡 +ED = BEFORE':'💡 Cambia: '+v.base+' → '+v.past},`w2:l3:${v.base}:${i}`);}
      q('build',{words:['SHE','SAW'],emoji:'👀',speak:'she saw',hint:'💡 SEE → SAW'},'w2:b2');
      q('build',{words:['WE','LIKED'],emoji:'❤️',speak:'we liked',hint:'💡 +ED'},'w2:b3');
      q('listen',{speak:'They went',options:['THEY GO','THEY WENT','THEY WILL GO'],correct:'THEY WENT',hint:'💡 GO → WENT'},'w2:listen:3');
      q('time',{sentence:'I LIKED ❤️',emoji:'❤️',speak:'I liked',correct:'before',hint:'💡 BEFORE 🔵'},'w2:t3');
    }else{
      for(let i=0;i<2;i++){const v=shuffle(st)[0];
        const t3=['now','before','tomorrow'][i%3];
        const sent=t3==='now'?'I '+v.base.toUpperCase():t3==='before'?'I '+v.past.toUpperCase():'I WILL '+v.base.toUpperCase();
        const said=t3==='now'?'I '+v.base:t3==='before'?'I '+v.past:'I will '+v.base;
        q('time',{sentence:sent+' '+v.emoji,emoji:v.emoji,speak:said,correct:t3,hint:'💡 🟢NOW 🔵BEFORE 🟣TOMORROW'},`w2:mix:t${i}`);}
      const vs=shuffle(st); q('match',{pairs:vs.slice(0,3).map(v=>[v.base.toUpperCase(),v.past.toUpperCase()])},'w2:mm');
      q('choose',{before:'We ',after:' to the park.',emoji:'🚀',speak:'we went to the park',options:['WENT','GO','WILL GO'],correct:'WENT',hint:'💡 GO → WENT'},'w2:mx1');
      q('build',{words:['YOU','SAW'],emoji:'👀',speak:'you saw',hint:''},'w2:mb1');
      q('listen',{speak:'She played',options:['SHE PLAYS','SHE PLAYED','SHE WILL PLAY'],correct:'SHE PLAYED',hint:'💡 +ED'},'w2:ml1');
      q('speak',{phrase:'I ate an apple',hint:''},'w2:ms1');
    }
  }
  else if(w===3){ // TOMORROW
    const mkV=()=>shuffle(st)[0];
    if(l<=2){
      for(let i=0;i<5;i++){const v=mkV(),pn=pro4();
        q('choose',{before:'Tomorrow, '+pn+' will ',after:'.',emoji:v.emoji,speak:'tomorrow '+pn.toLowerCase()+' will '+v.base,
          options:shuffle([v.base.toUpperCase(),v.past.toUpperCase(),v.base.toUpperCase()+'ED']),correct:v.base.toUpperCase(),
          hint:'💡 WILL + verbo simple 🟣'},`w3:${v.base}:${pn}:${i}`);}
      q('build',{words:['I','WILL','GO'],emoji:'🚀',speak:'I will go',hint:'💡 WILL + GO'},'w3:b1');
      q('time',{sentence:'I WILL EAT 🍎',emoji:'🍎',speak:'I will eat',correct:'tomorrow',hint:'💡 WILL = TOMORROW 🟣'},'w3:t1');
      q('speak',{phrase:'I will play',hint:''},'w3:s1');
    }else if(l===3){
      for(let i=0;i<3;i++){const v=mkV();
        q('time',{sentence:'WE WILL '+v.base.toUpperCase()+' '+v.emoji,emoji:v.emoji,speak:'we will '+v.base,correct:'tomorrow',hint:'💡 TOMORROW 🟣'},`w3:t:${i}`);}
      q('match',{pairs:shuffle(st).slice(0,3).map(v=>['WILL '+v.base.toUpperCase(),v.emoji])},'w3:m1');
      q('build',{words:['SHE','WILL','SEE'],emoji:'👀',speak:'she will see',hint:'💡 WILL + SEE'},'w3:b2');
      q('listen',{speak:'They will come',options:['THEY COME','THEY CAME','THEY WILL COME'],correct:'THEY WILL COME',hint:'💡 WILL'},'w3:l1');
      q('choose',{before:'You will ',after:' tomorrow.',emoji:'😴',speak:'you will sleep tomorrow',
        options:['SLEEP','SLEPT','SLEEPING'],correct:'SLEEP',hint:'💡 Después de WILL: verbo simple'},'w3:c1');
    }else{
      for(let i=0;i<3;i++){const v=mkV(),t=['now','before','tomorrow'][i%3];
        const sent=t==='now'?'I '+v.base.toUpperCase():t==='before'?'I '+v.past.toUpperCase():'I WILL '+v.base.toUpperCase();
        q('time',{sentence:sent+' '+v.emoji,emoji:v.emoji,speak:sent.toLowerCase().replace('i will','I will'),correct:t,hint:'💡 🟢NOW 🔵BEFORE 🟣TOMORROW'},`w3:mx:${i}`);}
      q('build',{words:['THEY','WILL','PLAY'],emoji:'⚽',speak:'they will play',hint:''},'w3:mb1');
      const vs=shuffle(st); q('match',{pairs:vs.slice(0,3).map(v=>[v.base.toUpperCase(),v.past.toUpperCase()])},'w3:mm1');
      q('listen',{speak:'I will eat',options:['I EAT','I ATE','I WILL EAT'],correct:'I WILL EAT',hint:'💡 WILL EAT'},'w3:ml1');
      q('speak',{phrase:'We will go',hint:''},'w3:ms1');
    }
  }
  else if(w===4){ // HOUSE OF TO BE
    const em=pn=>(PRONOUNS.find(p=>p.p===pn)||{}).emoji||'';
    const mk=(pn,tense)=>{
      const form=tense==='future'?'WILL BE':TOBE[tense][pn];
      return {pn,form,emoji:em(pn)};
    };
    if(l===1){
      ['I','YOU','HE','SHE','IT','WE','THEY'].forEach(pn=>{
        const m=mk(pn,'present');
        q('choose',{before:m.emoji+' '+pn+' ',after:' happy.',speak:pn.toLowerCase()+' '+m.form.toLowerCase()+' happy',
          options:['AM','IS','ARE'],correct:m.form,hint:'💡 AM=I · IS=he/she/it · ARE=you/we/they'},`w4:pr:${pn}`);
      });
      q('speak',{phrase:'She is happy',hint:''},'w4:s1');
    }else if(l===2){
      q('match',{pairs:[['HE','IS'],['SHE','IS'],['IT','IS'],['I','AM']]},'w4:m1');
      q('match',{pairs:[['YOU','ARE'],['WE','ARE'],['THEY','ARE'],['I','AM']]},'w4:m2');
      ['YOU','WE','THEY'].forEach(pn=>{const m=mk(pn,'present');
        q('choose',{before:m.emoji+' '+pn+' ',after:' friends.',speak:pn.toLowerCase()+' are friends',
          options:['AM','IS','ARE'],correct:'ARE',hint:'💡 YOU/WE/THEY → ARE'},`w4:pr2:${pn}`);});
      q('build',{words:['SHE','IS','HAPPY'],emoji:'👧',speak:'she is happy',hint:'💡 SHE → IS'},'w4:b1');
      q('listen',{speak:'They are friends',options:['THEY IS FRIENDS','THEY ARE FRIENDS','THEY AM FRIENDS'],correct:'THEY ARE FRIENDS',hint:'💡 THEY → ARE'},'w4:l1');
    }else if(l===3){
      ['I','HE','SHE','IT'].forEach(pn=>{const m=mk(pn,'past');
        q('choose',{before:m.emoji+' '+pn+' ',after:' tired.',speak:pn.toLowerCase()+' '+m.form.toLowerCase()+' tired',
          options:['WAS','WERE','WILL BE'],correct:'WAS',hint:'💡 I/he/she/it → WAS'},`w4:pa:${pn}`);});
      ['YOU','WE','THEY'].forEach(pn=>{const m=mk(pn,'past');
        q('choose',{before:m.emoji+' '+pn+' ',after:' late.',speak:pn.toLowerCase()+' were late',
          options:['WAS','WERE','WILL BE'],correct:'WERE',hint:'💡 you/we/they → WERE'},`w4:pa2:${pn}`);});
      q('time',{sentence:'SHE WAS HAPPY 👧',emoji:'👧',speak:'she was happy',correct:'before',hint:'💡 WAS = BEFORE 🔵'},'w4:t1');
      q('speak',{phrase:'We were late',hint:''},'w4:s2');
    }else{
      ['I','SHE','THEY'].forEach(pn=>{const m=mk(pn,'future');
        q('choose',{before:m.emoji+' '+pn+' ',after:' happy.',speak:pn.toLowerCase()+' will be happy',
          options:['WILL BE','WAS','IS'],correct:'WILL BE',hint:'💡 Futuro: WILL BE para todos 🟣'},`w4:fu:${pn}`);});
      q('build',{words:['THEY','WILL','BE','HAPPY'],emoji:'👥',speak:'they will be happy',hint:'💡 WILL + BE'},'w4:b2');
      q('match',{pairs:[['I','AM'],['HE','IS'],['THEY','ARE'],['SHE','WAS']]},'w4:m3');
      const t=[['I','AM','now'],['SHE','WAS','before'],['WE','WILL BE','tomorrow']];
      t.forEach(([pn,f,tm],ix)=>q('time',{sentence:pn+' '+f+' '+em(pn),emoji:em(pn),speak:pn.toLowerCase()+' '+f.toLowerCase(),correct:tm,hint:'💡'},`w4:mt:${ix}`));
      q('listen',{speak:'He will be happy',options:['HE IS HAPPY','HE WAS HAPPY','HE WILL BE HAPPY'],correct:'HE WILL BE HAPPY',hint:'💡 WILL BE'},'w4:l2');
    }
  }
  else if(w===5){ // PRESENT PERFECT
    const hh=pn=>['HE','SHE','IT'].includes(pn)?'HAS':'HAVE';
    if(l<=2){
      ['I','YOU','WE','THEY','HE','SHE','IT'].forEach((pn,ix)=>{
        if(ix>=6&&l===1) return;
        q('choose',{before:pn+' ',after:' BEEN happy.',emoji:'😊',speak:pn.toLowerCase()+' '+hh(pn).toLowerCase()+' been happy',
          options:['HAVE','HAS','HAD'],correct:hh(pn),hint:'💡 HAVE→I/you/we/they · HAS→he/she/it'},`w5:${pn}:${l}`);
      });
      q('build',{words:['SHE','HAS','BEEN','HAPPY'],emoji:'👧',speak:'she has been happy',hint:'💡 SHE → HAS'},'w5:b1');
      q('speak',{phrase:'I have been happy',hint:''},'w5:s1');
    }else if(l===3){
      q('match',{pairs:[['I','HAVE'],['SHE','HAS'],['THEY','HAVE'],['IT','HAS']]},'w5:m1');
      for(let i=0;i<3;i++){const pn=shuffle(['I','SHE','THEY','HE'])[0];
        q('choose',{before:pn+' ',after:' BEEN here.',emoji:'🏠',speak:pn.toLowerCase()+' '+hh(pn).toLowerCase()+' been here',
          options:['HAVE','HAS','HAD'],correct:hh(pn),hint:'💡 HAVE/HAS'},`w5:l3:${pn}:${i}`);}
      q('listen',{speak:'She has been happy',options:['SHE HAVE BEEN HAPPY','SHE HAS BEEN HAPPY','SHE HAD BEEN HAPPY'],correct:'SHE HAS BEEN HAPPY',hint:'💡 SHE → HAS'},'w5:l1');
      q('time',{sentence:'I HAVE BEEN ⭐',emoji:'⭐',speak:'I have been',correct:'now',hint:'💡 HAVE BEEN = presente perfecto'},'w5:t1');
    }else{
      for(let i=0;i<3;i++){const pn=shuffle(PRONOUNS)[i].p;
        q('build',{words:[pn,hh(pn),'BEEN','HAPPY'],emoji:'😊',speak:pn.toLowerCase()+' '+hh(pn).toLowerCase()+' been happy',hint:'💡'},`w5:mb:${i}`);}
      q('match',{pairs:[['YOU','HAVE'],['HE','HAS'],['WE','HAVE']]},'w5:m2');
      q('listen',{speak:'They have been friends',options:['THEY HAVE BEEN FRIENDS','THEY HAS BEEN FRIENDS','THEY HAD BEEN FRIENDS'],correct:'THEY HAVE BEEN FRIENDS',hint:'💡 THEY → HAVE'},'w5:l2');
      q('speak',{phrase:'We have been happy',hint:''},'w5:s2');
    }
  }
  else if(w===6){ // PAST PERFECT
    if(l<=2){
      ['I','SHE','THEY','HE','YOU','WE'].forEach((pn,ix)=>{
        if(ix>=5&&l===1) return;
        q('choose',{before:pn+' ',after:' BEEN happy.',emoji:'🌙',speak:pn.toLowerCase()+' had been happy',
          options:['HAVE','HAS','HAD'],correct:'HAD',hint:'💡 HAD = TODOS 🌙'},`w6:${pn}:${l}`);
      });
      q('build',{words:['I','HAD','BEEN','HAPPY'],emoji:'🌙',speak:'I had been happy',hint:'💡 HAD para todos'},'w6:b1');
      q('speak',{phrase:'She had been happy',hint:''},'w6:s1');
      q('time',{sentence:'THEY HAD BEEN 🌙',emoji:'🌙',speak:'they had been',correct:'before',hint:'💡 HAD BEEN = pasado perfecto'},'w6:t1');
    }else{
      for(let i=0;i<4;i++){const pn=shuffle(PRONOUNS)[i].p;
        q('choose',{before:pn+' ',after:' BEEN here.',emoji:'🌙',speak:pn.toLowerCase()+' had been here',
          options:['HAVE','HAS','HAD'],correct:'HAD',hint:'💡 HAD = TODOS'},`w6:l3:${pn}:${i}`);}
      q('match',{pairs:[['I','HAD'],['SHE','HAD'],['THEY','HAD']]},'w6:m1');
      q('build',{words:['WE','HAD','BEEN'],emoji:'🌙',speak:'we had been',hint:''},'w6:b2');
      q('listen',{speak:'He had been tired',options:['HE HAS BEEN TIRED','HE HAD BEEN TIRED','HE HAVE BEEN TIRED'],correct:'HE HAD BEEN TIRED',hint:'💡 HAD'},'w6:l1');
    }
  }
  else if(w===7){ // FUTURE PERFECT
    if(l<=2){
      ['I','SHE','THEY','HE','YOU'].forEach((pn,ix)=>{
        if(ix>=4&&l===1) return;
        q('choose',{before:pn+' will ',after:' BEEN happy.',emoji:'🔮',speak:pn.toLowerCase()+' will have been happy',
          options:['HAVE','HAS','HAD'],correct:'HAVE',hint:'💡 WILL + HAVE = todos 🔮'},`w7:${pn}:${l}`);
      });
      q('build',{words:['I','WILL','HAVE','BEEN'],emoji:'🔮',speak:'I will have been',hint:'💡 WILL HAVE'},'w7:b1');
      q('speak',{phrase:'She will have been happy',hint:''},'w7:s1');
      q('time',{sentence:'I WILL HAVE BEEN 🔮',emoji:'🔮',speak:'I will have been',correct:'tomorrow',hint:'💡 WILL HAVE = futuro perfecto'},'w7:t1');
      q('listen',{speak:'They will have been here',options:['THEY WILL HAVE BEEN HERE','THEY HAVE BEEN HERE','THEY HAD BEEN HERE'],correct:'THEY WILL HAVE BEEN HERE',hint:'💡 WILL HAVE'},'w7:l1');
    }else{
      for(let i=0;i<3;i++){const pn=shuffle(PRONOUNS)[i].p;
        q('build',{words:[pn,'WILL','HAVE','BEEN'],emoji:'🔮',speak:pn.toLowerCase()+' will have been',hint:''},`w7:mb:${i}`);}
      q('match',{pairs:[['I','WILL HAVE'],['SHE','WILL HAVE'],['THEY','WILL HAVE']]},'w7:m1');
      q('choose',{before:'We will ',after:' BEEN friends.',emoji:'🔮',speak:'we will have been friends',
        options:['HAVE','HAS','HAD'],correct:'HAVE',hint:'💡 WILL HAVE'},'w7:c1');
      q('speak',{phrase:'I will have been happy',hint:''},'w7:s2');
    }
  }
  else { // w8 MIX
    const all=[];
    uverbs().forEach(v=>{
      all.push({g:'time',c:{sentence:'I '+v.base.toUpperCase()+' '+v.emoji,emoji:v.emoji,speak:'I '+v.base,correct:'now',hint:'💡'},key:'w8:n:'+v.base});
      all.push({g:'time',c:{sentence:'I '+v.past.toUpperCase()+' '+v.emoji,emoji:v.emoji,speak:'I '+v.past,correct:'before',hint:'💡'},key:'w8:b:'+v.base});
      all.push({g:'time',c:{sentence:'I WILL '+v.base.toUpperCase()+' '+v.emoji,emoji:v.emoji,speak:'I will '+v.base,correct:'tomorrow',hint:'💡'},key:'w8:t:'+v.base});
    });
    ['I','SHE','THEY'].forEach(pn=>{
      all.push({g:'choose',c:{before:pn+' ',after:' happy.',emoji:'😊',speak:pn.toLowerCase()+' '+TOBE.present[pn].toLowerCase()+' happy',
        options:['AM','IS','ARE'],correct:TOBE.present[pn],hint:'💡'},key:'w8:tobe:'+pn});
    });
    const pool=shuffle(all);
    for(let i=0;i<7;i++) R.push(pool[i%pool.length]);
    R.push({g:'speak',c:{phrase:'I will have been happy',hint:''},key:'w8:speak'});
  }
  // Sin minijuego de voz: se filtran las rondas speak y se rellena hasta 8
  // clonando rondas existentes (más práctica, sin romper el balance).
  R=R.filter(r=>r.g!=='speak');
  let _n=0;
  while(R.length<ROUNDS_PER_LEVEL&&R.length>0){
    const src=R[Math.floor(Math.random()*R.length)];
    const clone=JSON.parse(JSON.stringify(src));
    clone.key=src.key+'#r'+(_n++);
    R.push(clone);
  }
  return R.slice(0,ROUNDS_PER_LEVEL+2);
}

/* ---------- MOTOR DE NIVEL ---------- */
let LV=null;
function startLevel(w,l){
  LV={w,l,rounds:buildRounds(w,l),i:0,n:0,firstOk:0,xp:0,coins:0,newWords:0};
  LV.n=LV.rounds.length;
  go('level');
}
function startQuiz(){
  const pool=[];
  uverbs().forEach(v=>{
    pool.push({g:'choose',c:{before:'I ',after:'.',emoji:v.emoji,speak:'I '+v.base,options:shuffle([v.base.toUpperCase(),v.past.toUpperCase()]),correct:v.base.toUpperCase(),hint:''},key:'q:'+v.base});
  });
  LV={w:0,l:0,rounds:shuffle(pool).slice(0,6),i:0,n:0,firstOk:0,xp:0,coins:0,newWords:0,quiz:true};
  LV.n=LV.rounds.length;
  go('level');
}

Screen.level=()=>{
  $('#screen').innerHTML=`
    <div class="level-top">
      <button class="back-btn" id="lv-back">✕</button>
      <div class="prog"><div id="lv-prog"></div></div>
      <div class="prog-text" id="lv-txt">1/${LV.n}</div>
    </div>
    <div id="round"></div>`;
  $('#lv-back').onclick=()=>{
    AudioSys.sfx('click');
    modal(`<h2>¿Salir del nivel?</h2><div class="tut-text">Perderás el progreso de este nivel.</div>
      <button class="btn" id="q-yes">Sí, salir</button>
      <button class="btn ghost" id="q-no">Seguir jugando</button>`);
    $('#q-yes').onclick=()=>{ AudioSys.sfx('click'); go(LV.quiz?'practice':'levels', LV.w); };
    $('#q-no').onclick=()=>{ AudioSys.sfx('click'); closeModal(); };
  };
  runRound();
};

function runRound(){
  const r=LV.rounds[LV.i];
  $('#lv-prog').style.width=Math.round(LV.i/LV.rounds.length*100)+'%';
  $('#lv-txt').textContent=(LV.i+1)+'/'+LV.rounds.length;
  const el=$('#round'); el.innerHTML='';
  if(r.tip && !r.tipShown){ r.tipShown=true; }
  MG[r.g](el,r.c,(ok,first)=>{
    const it=itemKey(r.key);
    if(ok){
      if(first){ LV.firstOk++; S.streak++; if(S.streak>S.best)S.best=S.streak;
        LV.xp+=10; S.xp+=10; LV.coins+=2; S.coins+=2; it.ok++; if(it.ok===1)LV.newWords++;
        if(S.streak>0&&S.streak%5===0){ toast('🔥 ¡Racha x'+S.streak+'!'); AudioSys.sfx('star'); }
      }else{ LV.xp+=5; S.xp+=5; LV.coins+=1; S.coins+=1; it.ok++; }
    }else{ it.bad++; S.streak=0; }
    updateHUD(); save();
    if(!ok && (r.replays||0)<2){
      r.replays=(r.replays||0)+1;
      const clone=JSON.parse(JSON.stringify(r)); clone.replays=r.replays;
      LV.rounds.splice(Math.min(LV.i+3,LV.rounds.length),0,clone);
    }
    LV.i++;
    if(LV.i>=LV.rounds.length) endLevel(); else runRound();
  });
}
function endLevel(){
  const acc=LV.firstOk/Math.max(1,LV.n);
  const stars=acc>=0.9?3:acc>=0.7?2:1;
  const bonus=stars*5; S.coins+=bonus; LV.coins+=bonus;
  if(!LV.quiz){
    const k=LV.w+'.'+LV.l;
    if(stars>(S.stars[k]||0)) S.stars[k]=stars;
    if(LV.l<LEVELS_PER_WORLD){ if(LV.w===S.world&&LV.l===S.level) S.level++; }
    else if(LV.w===S.world&&LV.w<8){ S.world++; S.level=1; toast('🔓 ¡Mundo desbloqueado!'); }
    if(LV.w===1&&LV.l===4&&S.verbsN===5){ S.verbsN=10; setTimeout(()=>toast('🔓 ¡5 verbos nuevos desbloqueados!'),1200); }
    if(LV.w===3&&LV.l===4&&S.verbsN===10){ S.verbsN=14; setTimeout(()=>toast('🔓 ¡Todos los verbos desbloqueados!'),1200); }
  }
  save(); updateHUD();
  AudioSys.sfx('levelup'); confetti(60);
  const praise=PRAISE[Math.floor(Math.random()*PRAISE.length)];
  $('#screen').innerHTML=`
    <div class="card center" style="margin-top:14px">
      <h2>${praise}</h2>
      <div class="stars-big">${[1,2,3].map(i=>`<span class="star${i<=stars?' earned':''}">⭐</span>`).join('')}</div>
      <div style="font-size:20px;font-weight:800">¡APRENDISTE ${LV.newWords} PALABRAS NUEVAS!</div>
      <div class="reward-row"><span>⚡ +${LV.xp} XP</span><span>🪙 +${LV.coins}</span><span>🔥 ${S.streak}</span></div>
      <button class="btn" id="e-map">${LV.quiz?'🎯 Práctica':'🗺️ Mapa'}</button>
      <button class="btn ghost" id="e-retry">🔁 Repetir nivel</button>
    </div>`;
  $('#e-map').onclick=()=>{AudioSys.sfx('click'); go(LV.quiz?'practice':'map');};
  $('#e-retry').onclick=()=>{AudioSys.sfx('click'); LV.quiz?startQuiz():startLevel(LV.w,LV.l);};
}

/* ---------- INIT ---------- */
window.addEventListener('load',()=>{
  load();
  document.body.classList.toggle('reduce-motion',!S.settings.motion);
  $('#hud-settings').onclick=()=>{AudioSys.sfx('click'); openSettings();};
  const unlock=()=>{ AudioSys.ensure(); AudioSys.startMusic(); document.removeEventListener('pointerdown',unlock); };
  document.addEventListener('pointerdown',unlock);
  try{ speechSynthesis.getVoices(); }catch(e){}
  go('title');
});
