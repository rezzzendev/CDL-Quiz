# Minijogos da Feira do Empreendedor

Aplicação offline de minijogos educativos para totem touchscreen. São cinco jogos e dez temas de empreendedorismo, totalizando 50 desafios. Não há dependências, compilação, servidor, banco de dados ou acesso à internet.

## Como executar

Abra `index.html` no Microsoft Edge, Chrome ou Firefox. A aplicação também pode ser servida por qualquer servidor HTTP estático. Para desenvolvimento, se o Python estiver instalado:

```powershell
python -m http.server 8080
```

Depois, acesse `http://localhost:8080`.

## Modo kiosk no Windows

Use um caminho absoluto ou o endereço do servidor local:

```powershell
msedge.exe --kiosk "C:\JogoEmpreendedor\index.html" --edge-kiosk-type=fullscreen --no-first-run
```

ou:

```powershell
msedge.exe --kiosk "http://localhost:8080" --edge-kiosk-type=fullscreen --no-first-run
```

O botão de tela cheia no cabeçalho facilita testes sem modo kiosk.

## Estrutura

- `index.html`: ponto de entrada offline.
- `css/style.css`: design system, componentes, jogos e responsividade.
- `js/app.js`: navegação, estado, placar, temporizador, resultado e inatividade.
- `js/data/content.js`: todos os temas e conteúdos.
- `js/games/`: motores independentes dos cinco jogos.
- `js/storage.js`: ranking e preferências com validação.
- `js/sound.js`: sinais sonoros leves gerados pelo navegador.
- `js/utils.js`: componentes e utilitários compartilhados.
- `assets/images/cdl-anapolis-colorido-branco.png`: logotipo oficial colorido com letras brancas exibido no cabeçalho.
- `tests/smoke.html`: testes automatizados executáveis no navegador.

## Manutenção do conteúdo

Todo o conteúdo fica em `js/data/content.js`. Cada tema possui `words`, `pairs`, `quiz` e `statements`.

- Novo tema: adicione outro bloco `T(...)` a `themes`. Os cinco jogos passam a exibi-lo automaticamente.
- Nova pergunta: adicione `q(enunciado, alternativas, indiceCorreto, explicacao)` ao `quiz` do tema.
- Novo caça-palavras: adicione palavras em `words`. O tabuleiro é gerado automaticamente.
- Nova associação ou par de memória: adicione `[conceito, definição]` a `pairs`.
- Novo minijogo: registre seus metadados em `games`, crie um motor em `js/games` com `init(stage, theme)` e `destroy()`, inclua o script em `index.html` e registre-o em `window.Games`.

## Configurações

- Ranking: fica em `localStorage` na chave `desafioEmpreendedor.ranking.v1`. Para limpar no console: `Store.clearRanking()`.
- Som e música: o botão do cabeçalho alterna efeitos e uma trilha instrumental leve, salva a preferência e funciona sem arquivos de áudio. A música começa após a primeira interação por exigência do navegador.
- Inatividade: altere `120000` (durante partidas), `60000` (outras telas) e `20000` (modo de atração) em `js/app.js`.

## Operação no evento

Antes de abrir ao público, desative suspensão de tela e notificações do Windows, fixe a escala de exibição e teste o toque nos cantos da tela. O ranking é local ao perfil do navegador usado no totem.
