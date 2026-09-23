(function(){
  'use strict'; window.Games=window.Games||{};
  const directions=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
  function makeBoard(labels){
    const words=labels.map(label=>({label,word:UI.normalize(label)})),size=Math.max(12,...words.map(x=>x.word.length+1));
    for(let restart=0;restart<60;restart++){
      const grid=Array.from({length:size},()=>Array(size).fill('')),placed=[];
      let success=true;
      for(const item of [...words].sort((a,b)=>b.word.length-a.word.length)){
        let done=false;
        for(let tries=0;tries<450&&!done;tries++){
          const [dr,dc]=directions[Math.floor(Math.random()*directions.length)],r=Math.floor(Math.random()*size),c=Math.floor(Math.random()*size),er=r+dr*(item.word.length-1),ec=c+dc*(item.word.length-1);
          if(er<0||er>=size||ec<0||ec>=size)continue;let fits=true;
          for(let i=0;i<item.word.length;i++){const current=grid[r+dr*i][c+dc*i];if(current&&current!==item.word[i]){fits=false;break}}
          if(!fits)continue;const cells=[];for(let i=0;i<item.word.length;i++){grid[r+dr*i][c+dc*i]=item.word[i];cells.push([r+dr*i,c+dc*i])}placed.push({...item,cells});done=true;
        }
        if(!done){success=false;break}
      }
      if(success){const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ';grid.forEach(row=>row.forEach((v,i)=>{if(!v)row[i]=abc[Math.floor(Math.random()*abc.length)]}));return{grid,placed,size}}
    }throw new Error('Não foi possível gerar o tabuleiro');
  }
  Games.wordsearch={
    _makeBoard:makeBoard,
    init(stage,theme){this.stage=stage;this.found=new Set();this.board=makeBoard(theme.words);this.render()},destroy(){this.dragging=false;this.stage=null},
    render(){const layout=UI.el('div','wordsearch-layout'),grid=UI.el('div','word-grid');grid.style.gridTemplateColumns=`repeat(${this.board.size},1fr)`;this.board.grid.forEach((row,r)=>row.forEach((letter,c)=>{const cell=UI.el('div','letter',letter);cell.dataset.r=r;cell.dataset.c=c;grid.append(cell)}));const panel=UI.el('aside','word-panel');panel.append(UI.el('h2','','Encontre estas palavras'));const list=UI.el('div','word-list');this.board.placed.forEach((w,i)=>{const item=UI.el('div','word-item',w.label);item.dataset.index=i;list.append(item)});panel.append(list,UI.el('p','game-tip','Passe o dedo da primeira até a última letra. A seleção pode seguir na horizontal, vertical ou diagonal.'));layout.append(grid,panel);this.stage.replaceChildren(layout);grid.onpointerdown=e=>this.start(e);grid.onpointermove=e=>this.move(e);grid.onpointerup=e=>this.end(e);grid.onpointercancel=()=>this.clearSelection()},
    cellFromEvent(e){const hit=document.elementFromPoint(e.clientX,e.clientY);return hit&&hit.classList.contains('letter')?hit:null},
    start(e){const cell=this.cellFromEvent(e);if(!cell)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);this.dragging=true;this.startCell=cell;this.updatePath(cell)},move(e){if(!this.dragging)return;const cell=this.cellFromEvent(e);if(cell)this.updatePath(cell)},
    updatePath(end){this.currentPath=this.line(Number(this.startCell.dataset.r),Number(this.startCell.dataset.c),Number(end.dataset.r),Number(end.dataset.c));this.stage.querySelectorAll('.letter.selecting').forEach(c=>c.classList.remove('selecting'));this.currentPath.forEach(([r,c])=>this.cell(r,c).classList.add('selecting'))},
    line(r1,c1,r2,c2){const dr=r2-r1,dc=c2-c1;if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return[[r1,c1]];const len=Math.max(Math.abs(dr),Math.abs(dc)),sr=Math.sign(dr),sc=Math.sign(dc);return Array.from({length:len+1},(_,i)=>[r1+sr*i,c1+sc*i])},
    cell(r,c){return this.stage.querySelector(`.letter[data-r="${r}"][data-c="${c}"]`)},
    end(){if(!this.dragging)return;this.dragging=false;const text=(this.currentPath||[]).map(([r,c])=>this.board.grid[r][c]).join(''),reverse=[...text].reverse().join(''),index=this.board.placed.findIndex((w,i)=>!this.found.has(i)&&(w.word===text||w.word===reverse));if(index>=0){this.found.add(index);this.currentPath.forEach(([r,c])=>this.cell(r,c).classList.add('found'));this.stage.querySelector(`.word-item[data-index="${index}"]`).classList.add('found');App.addScore(100,this.stage.querySelector(`.word-item[data-index="${index}"]`));Sound.play('correct');if(this.found.size===this.board.placed.length)setTimeout(()=>App.finish({correct:this.found.size,total:this.board.placed.length}),450)}else{(this.currentPath||[]).forEach(([r,c])=>this.cell(r,c).classList.add('invalid'));Sound.play('wrong');setTimeout(()=>this.stage&&this.stage.querySelectorAll('.letter.invalid').forEach(c=>c.classList.remove('invalid')),260)}this.clearSelection()},
    clearSelection(){this.dragging=false;if(this.stage)this.stage.querySelectorAll('.letter.selecting').forEach(c=>c.classList.remove('selecting'));this.currentPath=[]}
  };
}());
