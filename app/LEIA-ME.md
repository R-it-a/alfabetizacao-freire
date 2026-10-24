# O app

Implementação do fluxo descrito em `03-fluxo-da-sessao.html`. HTML e JavaScript puros, sem framework e sem etapa de build: os arquivos são servidos como estão.

**Abrir no celular:** https://r-it-a.github.io/alfabetizacao-freire/app/
No Chrome do Android, o menu ⋮ → "Adicionar à tela inicial" instala como aplicativo.

## Falar com o app

- **Segurar para falar**, como o áudio do WhatsApp: a pessoa segura o microfone o tempo que precisar (até 1 minuto) e solta para enviar. Pode parar, pensar e continuar: o reconhecimento é religado enquanto o botão estiver apertado.
- **Lixeira:** com o botão apertado, arrastar para a esquerda e soltar apaga a gravação. Apagar não conta como tentativa.
- **Toque rápido** em vez de segurar: a voz explica como usar.

## A voz do app

O app usa as vozes do próprio celular e escolhe sozinho a melhor em português do Brasil (dá preferência às vozes "naturais" e às do Google, que soam menos robóticas). Na tela inicial, **🔊 Escolher voz** lista as vozes do aparelho para ouvir e trocar. A escolha fica salva.

A qualidade depende do aparelho. Para uma voz realmente humana, as opções são gravar as frases fixas com uma pessoa ou usar uma voz neural na nuvem, chamada pelo mesmo Worker do Claude.

## O que acontece numa sessão

1. **Motivação** (só na primeira vez): conversa curta sobre cultura.
2. **Abertura** (a partir da segunda): a pessoa lê as palavras da última sessão e as que ficaram para revisar.
3. **Pergunta**: "O que você comeu hoje?" (as perguntas mudam por estágio).
4. **Palavra geradora**: o app tira da fala as palavras do estágio da pessoa, pontua e confirma ("Ouvi BOLO. Vamos aprender essa palavra?").
5. **Conversa** sobre a palavra, antes de ela aparecer escrita.
6. **Palavra lida e repetida**: as sílabas acendem enquanto a voz lê; a pessoa repete e o app corrige (até 2 tentativas, modelando devagar).
7. **Famílias**: BA BE BI BO BU, uma por vez, lida e repetida.
8. **Ficha da descoberta, ler**: na horizontal e na vertical, depois as vogais.
9. **Ficha da descoberta, criar**: a pessoa toca nas sílabas e forma palavras. Todas valem; o botão 💡 dá uma ideia.
10. **Teclado de sílabas**: ditado de duas palavras.
11. **Caderno**: as palavras do dia em letra grande para copiar no papel.
12. **Fechamento**: tudo vai para a pastinha.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `app.js` | As telas e a ordem da sessão |
| `metodo.js` | Regras do método em código: estágios, famílias, escolha da palavra, conferência da fala e da escrita |
| `lexico.js` + `lexico.txt` | Dicionário: 21 mil palavras da lista VERO (LibreOffice) ordenadas por frequência |
| `voz.js` | Ouvir (Web Speech API) e falar (speechSynthesis) |
| `cerebro.js` | Perguntas e interpretação da fala; chama o Claude se `config.js` tiver o endereço do Worker |
| `estado.js` | Progresso salvo no celular |
| `config.js` | Endereço do Worker, velocidade da voz, número de tentativas |
| `sw.js`, `manifest.json`, `icones/` | Instalação e funcionamento sem internet |
| `testes/` | Testes da lógica e uma sessão simulada no navegador |

O núcleo de sílabas continua em `../codigo/silabador.js`.

## Testes

```bash
# lógica do método (Node 20+)
node --test app/testes/*.test.mjs

# duas sessões completas no navegador, com voz simulada (precisa do Playwright)
python -m http.server 8000
node app/testes/sessao-simulada.mjs http://localhost:8000/app/
```

## Decisões provisórias

Estão no código e merecem revisão com uso real:

- **Estágio sobe a cada 3 palavras geradoras** (`PALAVRAS_POR_ESTAGIO` em `metodo.js`).
- **Família repetida conta como certa com 3 de 5 sílabas reconhecidas**: o reconhecimento de voz é fraco com sílabas soltas.
- **A diferença entre palavras reais e inventadas** começa a ser comentada a partir da 4ª sessão.
- **A motivação é só falada.** A fase original usava cenas desenhadas; as imagens ainda precisam ser criadas.
- **Sem o Worker**, a palavra é escolhida só pela fonética e pela frequência, sem o critério de teor pragmático.

## Créditos do dicionário

`lexico.txt` combina a lista de palavras do [VERO / LibreOffice](https://github.com/pythonprobr/palavras) (MPL 2.0 / LGPL) com as frequências do corpus [fserb/pt-br](https://github.com/fserb/pt-br) (MIT).
