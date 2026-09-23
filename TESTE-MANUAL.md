# Roteiro de aceite no totem

Execute com o Edge em 1366×768, 1280×720, 1920×1080 e, se aplicável, orientação vertical. Em cada resolução, confirme que o cabeçalho, a área de jogo e os botões permanecem visíveis.

1. Na tela inicial, abra cada um dos cinco cards e confirme que os dez temas aparecem.
2. Caça-palavras: arraste sobre uma palavra nos dois sentidos, faça uma seleção errada e conclua a lista.
3. Quiz: responda uma questão certa e uma errada, leia a explicação e conclua as cinco.
4. Memória: teste um par certo, um errado e conclua os seis pares.
5. Associação: toque primeiro à direita, forme um par errado e conclua todos os pares certos.
6. Verdadeiro ou falso: teste os dois botões, avance e conclua as oito afirmações.
7. Durante uma partida, toque em voltar, cancele a saída e depois confirme a saída.
8. No resultado, use somente o teclado virtual, salve um nome e confirme o ranking.
9. Jogue novamente, escolha outro desafio e volte ao menu principal.
10. Alterne o som, recarregue a página e confirme que a preferência foi preservada.
11. Ative tela cheia e saia com `Esc`.
12. Deixe a tela inicial parada por 20 segundos e confirme o destaque de atração.
13. Fora de uma partida, aguarde 60 segundos; durante uma partida, aguarde 120 segundos e valide o aviso.
14. Abra as Ferramentas do Desenvolvedor (`F12`) e confirme ausência de erros no Console.
15. Emular `prefers-reduced-motion: reduce` e confirmar que transições ficam praticamente instantâneas.

Teste automatizado local:

```powershell
node tests\run-tests.js
```
