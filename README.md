# App de alfabetização de adultos — método Paulo Freire

Material produzido em 04/08/2026.

## Arquivos

| Arquivo | O que é |
|---|---|
| `plano-alfabetizacao-freire.pdf` | **Comece por aqui.** 2 páginas: mind map da arquitetura em 5 camadas, pilha de ferramentas com custo de cada uma, conceitos fundamentais e ordem de construção. |
| `01-especificacao-do-metodo.html` | O método Freire destilado das fontes primárias e traduzido em arquitetura: protocolo de 9 quadros por palavra, grade fonética de Angicos, algoritmo de seleção da palavra geradora. Tem a ficha da descoberta interativa. |
| `02-manual-das-ferramentas.html` | Como cada uma das 7 ferramentas funciona por dentro: mecânica, código mínimo, e o que dá errado. Tem demos ao vivo de reconhecimento e síntese de fala. |
| `gerar-pdf.py` | Script que gera o PDF. Rode `python gerar-pdf.py` para regerar depois de editar. Precisa de `reportlab==3.6.13`. |

## Fontes primárias (`fontes/`)

Os arquivos não estão no repositório; as referências completas estão em [`fontes/README.md`](fontes/README.md).

| Arquivo | O que é |
|---|---|
| `angicos-palavras-geradoras-p1.jpg` | Documento **original** de planejamento de Angicos, 1963. Aulas 1 a 6: BELOTA, SAPATO, VOTO/POVO, SALINA, FEIRA, MILHO — com as famílias fonêmicas de cada uma. |
| `angicos-palavras-geradoras-p2.jpg` | Aulas 7 a 13: GOLEIRO até BILRO/ALMOFADA. Contém a nota sobre generalização de sílabas complexas e a aula do C forte/fraco. |
| `lima-1965-metodo-paulo-freire.txt` | Lauro de Oliveira Lima, *Tecnologia, educação e democracia* (1965), apêndice. Descrição operacional do método por quem observou os círculos de cultura funcionando. Contém o protocolo dos 9 quadros e as listas de palavras geradoras de Recife, Tiriri e Brasília. |

Essas duas fontes juntas respondem as perguntas que a literatura secundária não responde: **em que ordem** as palavras entram, e **o que exatamente** acontece em cada aula.

## Atenção ao abrir os HTMLs localmente

Abrindo por `file://`, a **demo de reconhecimento de fala não funciona** — a Web Speech API exige HTTPS ou localhost. A síntese de voz funciona normalmente.

Para testar o reconhecimento (o passo 1 do plano), use os links publicados:

- Especificação: https://claude.ai/code/artifact/9ae3b95b-b8c5-424e-8650-8f1257ee6b55
- Manual das ferramentas: https://claude.ai/code/artifact/b19ec59b-3441-4cd7-99e5-bac03abcb0f6

Ou rode um servidor local:

```
cd alfabetizacao-freire
python -m http.server 8000
```

e abra `http://localhost:8000/02-manual-das-ferramentas.html`.

## Próximo passo

Testar o reconhecimento de fala no celular de um aluno, no ambiente real dele. Cinco frases, meia hora. É a única incógnita que pode mudar o desenho do projeto.
