/* ============ WORD ADVENTURE — datos ============ */
'use strict';

const PRONOUNS = [
  {p:'I',    emoji:'🧒'},
  {p:'YOU',  emoji:'🧑'},
  {p:'HE',   emoji:'👦'},
  {p:'SHE',  emoji:'👧'},
  {p:'IT',   emoji:'🐶'},
  {p:'WE',   emoji:'👨‍👩‍👧'},
  {p:'THEY', emoji:'👥'},
];
const PRON_IYWT = ['I','YOU','WE','THEY']; // sin -s en presente

const VERBS = [
  {base:'play', past:'played', part:'played', emoji:'⚽', es:'jugar',   regular:true,  starter:true},
  {base:'eat',  past:'ate',    part:'eaten',  emoji:'🍎', es:'comer',   regular:false, starter:true},
  {base:'go',   past:'went',   part:'gone',   emoji:'🚀', es:'ir',      regular:false, starter:true},
  {base:'see',  past:'saw',    part:'seen',   emoji:'👀', es:'ver',     regular:false, starter:true},
  {base:'like', past:'liked',  part:'liked',  emoji:'❤️', es:'gustar',  regular:true,  starter:true},
  {base:'drink',past:'drank',  part:'drunk',  emoji:'🥤', es:'beber',   regular:false, starter:false},
  {base:'run',  past:'ran',    part:'run',    emoji:'🏃', es:'correr',  regular:false, starter:false},
  {base:'sleep',past:'slept',  part:'slept',  emoji:'😴', es:'dormir',  regular:false, starter:false},
  {base:'work', past:'worked', part:'worked', emoji:'💼', es:'trabajar',regular:true,  starter:false},
  {base:'walk', past:'walked', part:'walked', emoji:'🚶', es:'caminar', regular:true,  starter:false},
  {base:'come', past:'came',   part:'come',   emoji:'👋', es:'venir',   regular:false, starter:false},
  {base:'make', past:'made',   part:'made',   emoji:'🛠️', es:'hacer',   regular:false, starter:false},
  {base:'get',  past:'got',    part:'got',    emoji:'🎁', es:'obtener', regular:false, starter:false},
  {base:'do',   past:'did',    part:'done',   emoji:'✅', es:'hacer',   regular:false, starter:false},
];

const TOBE = {
  present:{ I:'AM', YOU:'ARE', HE:'IS', SHE:'IS', IT:'IS', WE:'ARE', THEY:'ARE' },
  past:   { I:'WAS', YOU:'WERE', HE:'WAS', SHE:'WAS', IT:'WAS', WE:'WERE', THEY:'WERE' },
  future: 'WILL BE',
};
const TOBE_RULE = [
  {form:'AM',  who:['I'],            emoji:'🧒'},
  {form:'IS',  who:['HE','SHE','IT'], emoji:'👦👧🐶'},
  {form:'ARE', who:['YOU','WE','THEY'], emoji:'🧑👨‍👩‍👧👥'},
];

const PERFECT = {
  present:{ have:['I','YOU','WE','THEY'], has:['HE','SHE','IT'], aux_es:'have/has' },
  past:'HAD',    // todos
  future:'WILL HAVE', // todos
};

const WORLDS = [
  {id:1, name:'NOW',           sub:'Presente · I PLAY',      emoji:'🟢', cls:'now',      machine:'⏰'},
  {id:2, name:'BEFORE',        sub:'Pasado · I PLAYED',      emoji:'🔵', cls:'before',   machine:'🕰️'},
  {id:3, name:'TOMORROW',      sub:'Futuro · I WILL PLAY',   emoji:'🟣', cls:'tomorrow', machine:'🚀'},
  {id:4, name:'HOUSE OF TO BE',sub:'AM · IS · ARE',          emoji:'🏠', cls:'now',      machine:'🏠'},
  {id:5, name:'PERFECT TIME',  sub:'I HAVE BEEN',            emoji:'⭐', cls:'tomorrow', machine:'⭐'},
  {id:6, name:'HAD TIME',      sub:'I HAD BEEN',             emoji:'🌙', cls:'before',   machine:'🌙'},
  {id:7, name:'WILL HAVE TIME',sub:'I WILL HAVE BEEN',       emoji:'🔮', cls:'tomorrow', machine:'🔮'},
  {id:8, name:'MIX EVERYTHING',sub:'¡Todo junto!',           emoji:'🎡', cls:'now',      machine:'🎡'},
];
const LEVELS_PER_WORLD = 4;
const ROUNDS_PER_LEVEL = 8;

const SHOP = {
  hat:[
    {id:'none',  emoji:'',   name:'Sin gorro', price:0},
    {id:'cap',   emoji:'🧢', name:'Gorra',     price:50},
    {id:'party', emoji:'🥳', name:'Fiesta',    price:90},
    {id:'crown', emoji:'👑', name:'Corona',    price:220},
  ],
  glasses:[
    {id:'none', emoji:'',   name:'Sin lentes', price:0},
    {id:'star', emoji:'🤩', name:'Estrella',   price:70},
    {id:'cool', emoji:'😎', name:'Cool',       price:120},
  ],
  color:[
    {id:'blue',   name:'Azul',   price:0,   c1:'#4aa8ff', c2:'#2f7fe0'},
    {id:'green',  name:'Verde',  price:40,  c1:'#58cc72', c2:'#2fa14e'},
    {id:'pink',   name:'Rosa',   price:60,  c1:'#ff8fc7', c2:'#e05a9a'},
    {id:'orange', name:'Naranja',price:80,  c1:'#ffb35e', c2:'#e07f1f'},
    {id:'purple', name:'Morado', price:110, c1:'#bd7bff', c2:'#8b3fd9'},
  ],
};

const PRAISE = ['🎉 ¡GENIAL!','⭐ ¡INCREÍBLE!','🚀 ¡SUPER!','💪 ¡SIGUE ASÍ!','🌟 ¡BRILLANTE!'];
const TIPS = {
  future:'💡 FUTURE = WILL + VERB',
  pastReg:'💡 +ED = BEFORE (play → played)',
  pastIrr:'💡 Algunas cambian: go → went',
  tobe:'💡 AM=I · IS=he/she/it · ARE=you/we/they',
  have:'💡 HAVE → I/you/we/they · HAS → he/she/it',
  had:'💡 HAD = TODOS',
  willhave:'💡 WILL HAVE = TODOS',
};
