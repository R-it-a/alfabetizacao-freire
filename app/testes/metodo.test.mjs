// node --test app/testes/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as m from '../metodo.js';
import { Lexico } from '../lexico.js';
import { VAZIO, carregar, salvar } from '../estado.js';
import { combinarTrechos } from '../voz.js';

const lexico = new Lexico(
  readFileSync(fileURLToPath(new URL('../lexico.txt', import.meta.url)), 'utf8').split('\n')
);
const novoEstado = () => JSON.parse(JSON.stringify(VAZIO));

test('normalizar tira acento, pontuação e maiúsculas', () => {
  assert.equal(m.normalizar('Cuscuz, com OVO!  Feijão'), 'cuscuz com ovo feijao');
  assert.equal(m.compactar('bo lo'), 'bolo');
});

test('estágios seguem a grade da especificação', () => {
  const casos = {
    bolo: 1, sapato: 1, panela: 1,            // CV com consoantes de som único
    milho: 2, galinha: 2, feira: 2, carro: 3, // dígrafo, ditongo; carro tem c
    passo: 2,                                 // ss separado conta como dígrafo
    casa: 3, gelo: 3, janela: 3,              // ortografia ambígua
    feijão: 4, carne: 4,                      // nasal, travada
    trabalho: 5, prato: 5                     // encontro consonantal
  };
  for (const [palavra, estagio] of Object.entries(casos)) {
    assert.equal(m.estagioDaPalavra(palavra), estagio, palavra);
  }
});

test('candidatas: só palavras do estágio, sem palavras gramaticais', () => {
  const estado = novoEstado();
  const fala = [{ texto: 'Hoje eu comi cuscuz com ovo e um pedaço de bolo' }];
  const palavras = m.candidatasDaFala(fala, estado, lexico).map((c) => c.palavra);
  assert.ok(palavras.includes('bolo'));
  assert.ok(!palavras.includes('cuscuz'), 'cuscuz é estágio 4');
  assert.ok(!palavras.includes('hoje') && !palavras.includes('com'));
});

test('candidatas usam também o segundo palpite do reconhecimento', () => {
  const estado = novoEstado();
  const fala = [{ texto: 'comi volo' }, { texto: 'comi bolo' }];
  assert.equal(m.candidatasDaFala(fala, estado, lexico)[0].palavra, 'bolo');
});

test('palavra já trabalhada não volta como candidata', () => {
  const estado = novoEstado();
  m.registrarPalavraGeradora(estado, 'bolo');
  const palavras = m.candidatasDaFala([{ texto: 'bolo de banana' }], estado, lexico).map((c) => c.palavra);
  assert.ok(!palavras.includes('bolo'));
  assert.ok(palavras.includes('banana'));
});

test('conferir fala aceita sotaque e aponta a sílaba diferente', () => {
  assert.deepEqual(m.conferirFala([{ texto: 'Bolo!' }], ['bo', 'lo']), { ok: true, erradas: [] });
  assert.deepEqual(m.conferirFala([{ texto: 'é um bolo' }], ['bo', 'lo']).ok, true);
  assert.deepEqual(m.conferirFala([{ texto: 'bola' }], ['bo', 'lo']), { ok: false, erradas: [1] });
  assert.equal(m.conferirFala([{ texto: 'bola' }, { texto: 'bolo' }], ['bo', 'lo']).ok, true);
  assert.equal(m.conferirFala([], ['bo', 'lo']).ok, false);
});

test('conferir família pede 3 de 5', () => {
  const linha = ['ba', 'be', 'bi', 'bo', 'bu'];
  assert.ok(m.conferirFamilia([{ texto: 'ba be bi' }], linha));
  assert.ok(!m.conferirFamilia([{ texto: 'banana' }], linha));
});

test('conferir escrita sílaba por sílaba', () => {
  assert.deepEqual(m.conferirEscrita(['bo', 'ta'], ['bo', 'ta']), { ok: true, erradas: [] });
  assert.deepEqual(m.conferirEscrita(['bo', 'to'], ['bo', 'ta']), { ok: false, erradas: [1] });
  assert.deepEqual(m.conferirEscrita(['bo'], ['bo', 'ta']), { ok: false, erradas: [1] });
});

test('teclado tem só as famílias aprendidas, sem sílabas raras', () => {
  const linhas = m.silabasDoTeclado(['bolo', 'milho']);
  assert.deepEqual(linhas[0], ['ba', 'be', 'bi', 'bo', 'bu']);
  assert.ok(linhas.some((l) => l.includes('lho')));
  assert.ok(!linhas.flat().includes('lhi'));
  assert.equal(new Set(linhas.map((l) => l[0])).size, linhas.length, 'sem família repetida');
});

test('progressão: estágio sobe depois de 3 palavras geradoras', () => {
  const estado = novoEstado();
  ['bolo', 'sapato', 'panela'].forEach((p) => m.registrarPalavraGeradora(estado, p));
  assert.equal(estado.estagio, 2);
  assert.ok(estado.familias['b|'] && estado.familias['p|']);
});

test('dicionário: palavras reais, formas sem acento e potência gerativa', () => {
  assert.equal(lexico.real('bota'), 'bota');
  assert.equal(lexico.real('benu'), null);
  assert.equal(lexico.real('cafe'), 'café');
  const possiveis = lexico.possiveis('tijolo');
  for (const p of ['tatu', 'lata', 'luta', 'jato']) assert.ok(possiveis.includes(p), p);
  assert.ok(lexico.potencia('tijolo') > 20);
});

test('estado sobrevive a JSON corrompido e ganha campos novos', () => {
  const memoria = { dados: {}, getItem(k) { return this.dados[k]; }, setItem(k, v) { this.dados[k] = v; } };
  memoria.setItem('palavra.aluno', '{quebrado');
  assert.deepEqual(carregar(memoria), novoEstado());
  memoria.setItem('palavra.aluno', JSON.stringify({ estagio: 2 }));
  const e = carregar(memoria);
  assert.equal(e.estagio, 2);
  assert.deepEqual(e.pastinha, []);
  salvar({ ...e, sessoes: 1 }, memoria);
  assert.equal(carregar(memoria).sessoes, 1);
});

test('fala longa em vários trechos vira frases alternativas', () => {
  const trechos = [['hoje eu comi', 'hoje eu comia'], ['bolo de fubá']];
  assert.deepEqual(combinarTrechos(trechos).map((a) => a.texto), [
    'hoje eu comi bolo de fubá',
    'hoje eu comia bolo de fubá'
  ]);
  assert.deepEqual(combinarTrechos([]), []);
});
