(function(){
  'use strict';
  const iconPaths={
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M5 4v13M9 4v13M13 4v10M4 7h12M4 11h13M4 15h10"/>',
    quiz:'<path d="M7 8a5 5 0 0 1 9.7 1.7c0 3.3-4.7 3.1-4.7 6.3M12 21h.01"/>',
    memory:'<rect x="3" y="5" width="12" height="15" rx="2"/><rect x="9" y="3" width="12" height="15" rx="2"/><path d="M13 8h4M15 6v4"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
    check:'<path d="m4 12 5 5L20 6M4 4l16 16"/>',
    trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>',
    back:'<path d="m15 18-6-6 6-6"/>',speaker:'<path d="M11 5 6 9H2v6h4l5 4V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',mute:'<path d="M11 5 6 9H2v6h4l5 4V5ZM16 9l5 6M21 9l-5 6"/>',fullscreen:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>'
  };
  const svg=(name,label='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.quiz}</svg>${label?`<span class="sr-only">${label}</span>`:''}`;
  const shuffle=a=>{const b=[...a];for(let i=b.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
  const time=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z]/g,'').toUpperCase();
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
  window.UI={svg,shuffle,time,normalize,el,
    game(id){return GAME_DATA.games.find(g=>g.id===id)},theme(id){return GAME_DATA.themes.find(t=>t.id===id)},
    scorePop(points,target){const r=(target||document.body).getBoundingClientRect();const p=el('div','score-pop',`+${points}`);p.style.left=`${r.left+r.width/2}px`;p.style.top=`${r.top+10}px`;document.body.append(p);setTimeout(()=>p.remove(),850)},
    toast(message){const region=document.getElementById('toast-region');region.replaceChildren();const t=el('div','toast',message);region.append(t);setTimeout(()=>t.remove(),2400)},
    modal({title,message,confirm='Continuar',cancel=null,onConfirm,onCancel}){const root=document.getElementById('modal-root');const back=el('div','modal-backdrop');const box=el('div','modal');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');const h=el('h2','',title),p=el('p','',message),actions=el('div','modal-actions');box.append(h,p);if(cancel){const b=el('button','secondary-button',cancel);b.onclick=()=>{root.replaceChildren();onCancel&&onCancel()};actions.append(b)}const ok=el('button',cancel?'danger-button':'primary-button',confirm);ok.onclick=()=>{root.replaceChildren();onConfirm&&onConfirm()};actions.append(ok);box.append(actions);back.append(box);root.replaceChildren(back);ok.focus();return()=>root.replaceChildren()},
    confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const colors=['#f4b942','#e35d6a','#2b9c85','#3978c8'];for(let i=0;i<34;i++){const c=el('i','confetti');c.style.setProperty('--x',`${Math.random()*100}vw`);c.style.setProperty('--d',`${1.7+Math.random()*1.7}s`);c.style.setProperty('--c',colors[i%colors.length]);c.style.animationDelay=`${Math.random()*.45}s`;document.body.append(c);setTimeout(()=>c.remove(),3900)}},
    renderProgress(current,total){return `<div class="progress-track" aria-label="Progresso"><div class="progress-fill" style="width:${Math.round(current/total*100)}%"></div></div>`}
  };
}());
