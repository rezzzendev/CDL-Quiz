'use strict';
global.window=global;
global.Games={};
global.UI={normalize:value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z]/g,'').toUpperCase()};
require('../js/data/content.js');
require('../js/games/wordsearch.js');

let passed=0;
function check(condition,message){if(!condition)throw new Error(message)}
function test(name,fn){fn();passed++;console.log(`✓ ${name}`)}

test('catálogo possui cinco jogos e dez temas',()=>{
  check(GAME_DATA.games.length===5,'catálogo de jogos incompleto');
  check(GAME_DATA.themes.length===10,'catálogo de temas incompleto');
});
test('cada tema atende aos mínimos de conteúdo',()=>{
  GAME_DATA.themes.forEach(t=>{
    check(t.words.length>=6,`${t.name}: poucas palavras`);
    check(t.pairs.length>=6,`${t.name}: poucos pares`);
    check(t.quiz.length>=5,`${t.name}: poucas perguntas`);
    check(t.statements.length>=8,`${t.name}: poucas afirmações`);
  });
});
test('todas as perguntas têm quatro opções e resposta válida',()=>{
  GAME_DATA.themes.flatMap(t=>t.quiz).forEach(item=>{
    check(item.options.length===4,`alternativas inválidas: ${item.text}`);
    check(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<4,`resposta inválida: ${item.text}`);
    check(item.options[item.answer].length>0,`resposta vazia: ${item.text}`);
    check(item.explanation.length>=20,`explicação curta: ${item.text}`);
  });
});
test('todas as afirmações têm resposta booleana e explicação',()=>{
  GAME_DATA.themes.flatMap(t=>t.statements).forEach(item=>{
    check(typeof item.answer==='boolean',`resposta inválida: ${item.text}`);
    check(item.explanation.length>=20,`explicação curta: ${item.text}`);
  });
});
test('gerador cria todos os caça-palavras sem perder letras',()=>{
  for(let round=0;round<20;round++)GAME_DATA.themes.forEach(theme=>{
    const board=Games.wordsearch._makeBoard(theme.words);
    check(board.placed.length===theme.words.length,`${theme.name}: palavra não posicionada`);
    board.placed.forEach(item=>{
      const actual=item.cells.map(([r,c])=>board.grid[r][c]).join('');
      check(actual===item.word,`${theme.name}: coordenadas incorretas para ${item.label}`);
    });
  });
});
test('identificadores e rótulos não estão duplicados',()=>{
  check(new Set(GAME_DATA.games.map(x=>x.id)).size===GAME_DATA.games.length,'jogo duplicado');
  check(new Set(GAME_DATA.themes.map(x=>x.id)).size===GAME_DATA.themes.length,'tema duplicado');
});
console.log(`\n${passed} grupos de teste passaram.`);
