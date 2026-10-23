# Silabador pt-BR + gerador de fichas de descoberta

O núcleo determinístico do app. É aqui que mora tudo que o LLM **não** deve fazer:
separar sílabas, gerar famílias fonêmicas, montar a ficha da descoberta e contar
a potência gerativa de uma palavra.

Duas implementações com **saída idêntica, verificada linha a linha**:

| Arquivo | Para quê |
|---|---|
| `silabador.js` | O app. Módulo ES, sem dependência nenhuma. |
| `silabador.py` | Trabalho offline: pré-computar a potência gerativa contra o dicionário inteiro. |
| `teste_silabador.py` | 80 casos. `python teste_silabador.py` |
| `teste-silabador.html` | Os mesmos 80 casos rodando no navegador. |

## Rodar os testes

```bash
# Python
cd codigo
python teste_silabador.py          # imprime 80/80 e grava resultado-testes.txt

# JavaScript (módulos ES não carregam por file://)
python -m http.server 8000
# abra http://localhost:8000/teste-silabador.html
```

## API

```js
import { silabar, familia, fichaDescoberta, palavrasPossiveis } from './silabador.js';

silabar('tijolo')            // ['ti', 'jo', 'lo']
silabar('chibanca')          // ['chi', 'ban', 'ca']
silabar('expresso')          // ['ex', 'pres', 'so']

familia('ti')                // ['ta','te','ti','to','tu']
familia('ban')               // ['ban','ben','bin','bon','bun']   travada mantém a coda
familia('que')               // ['ca','que','qui','co','cu']      segue o som, não a letra

analisar('pres')             // { onset: 'pr', nucleo: 'e', coda: 's' }

const f = fichaDescoberta('tijolo');
f.grade                      // [['ta',…], ['ja',…], ['la',…]]  ← o 7º quadro
palavrasPossiveis(f, lexico) // 20 palavras: tatu, loja, jato, lajota, tijolo…

expandirGrupo('pres')        // bras/cras/dras/fras/gras/tras/vras — a regra da aula 12
temSomVariavel('co')         // true → dispara a aula do C forte e fraco
```

## Decisões que valem saber

**Sílaba travada mantém a coda.** `familia('ban')` devolve `ban ben bin bon bun`,
não `ba be bi bo bu`. É como Angicos ensinou `an` (CHIBANCA) e `il` (BILRO / ALMOFADA):
o que se aprende ali é o padrão de travamento, não a consoante solta.

**qu/gu seguem o som; c/g seguem a letra.** A família de `que` é `ca que qui co cu`,
porque "qu" simplesmente não existe antes de a/o/u. Já `co` devolve `ca ce ci co cu`
— a família ortográfica, como o método original fazia — e `temSomVariavel()` marca
que ali cabe a aula extra que o documento de Angicos previa para o C forte e fraco
(CASA / CEBOLA / CIGARRO / COPO / CEGO / CUIA, e depois AÇAFRÃO / AÇUDE / AÇO).

**Ditongo crescente é decidido por heurística.** `família` e `história` terminam em
ditongo; `dia` e `rua` em hiato. A regra usada: ditongo crescente só no fim da palavra
e apenas quando ela tem 3+ vogais. Acerta os casos do cotidiano, mas é o ponto onde
uma palavra rara pode escapar — se aparecer erro em produção, é aqui que se olha.

**Sílabas raras são geradas, não escondidas.** `familia('lho')` devolve `lhi` e `lhu`,
que não existem em português. O método original apresentava a família inteira, então
mantivemos — mas cada linha vem com `raras: [...]` para o app decidir se esconde,
esmaece ou ignora.

## O que ainda não faz

- **Não marca a sílaba tônica.** Não é preciso para a ficha de descoberta, mas será
  se um dia você quiser trabalhar acentuação.
- **Não trata hífen nem palavras compostas** (`guarda-chuva` precisa ser separada antes).
- **Não sabe nomes próprios** com grafia fora do padrão.

## Próximo passo natural

Rodar `palavras_possiveis()` do Python contra a wordlist Hunspell pt-BR inteira,
para cada palavra candidata, e guardar o resultado numa tabela. Isso transforma a
"riqueza fonêmica" — o primeiro critério de Freire, definido em prosa — num número
que o algoritmo de seleção da palavra geradora consulta em tempo constante.
