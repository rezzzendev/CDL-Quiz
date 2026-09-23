(function(){
  'use strict';
  const keys={ranking:'desafioEmpreendedor.ranking.v1',sound:'desafioEmpreendedor.sound.v1'};
  const safeParse=(value,fallback)=>{try{return JSON.parse(value)}catch(_){return fallback}};
  window.Store={
    sound(){return localStorage.getItem(keys.sound)!=='false'},
    setSound(value){try{localStorage.setItem(keys.sound,String(Boolean(value)))}catch(_){}},
    ranking(){
      try{
        const data=safeParse(localStorage.getItem(keys.ranking),'invalid');
        if(!Array.isArray(data)) throw new Error('invalid');
        return data.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.score)&&typeof x.game==='string').slice(0,100);
      }catch(_){try{localStorage.removeItem(keys.ranking)}catch(__){} return []}
    },
    addScore(entry){
      const clean={name:String(entry.name||'JOGADOR').replace(/[^A-Za-zÀ-ÿ0-9 ]/g,'').trim().slice(0,12).toUpperCase()||'JOGADOR',score:Math.max(0,Math.round(Number(entry.score)||0)),game:String(entry.game||''),theme:String(entry.theme||''),date:new Date().toISOString()};
      const ranking=this.ranking().concat(clean).sort((a,b)=>b.score-a.score).slice(0,100);
      try{localStorage.setItem(keys.ranking,JSON.stringify(ranking))}catch(_){}
      return clean;
    },
    clearRanking(){try{localStorage.removeItem(keys.ranking)}catch(_){}}
  };
}());
