# -*- coding: utf-8 -*-
"""
Silabador de português brasileiro + gerador de fichas de descoberta.

Determinístico: mesma entrada, mesma saída, sempre. É o núcleo do app —
o LLM nunca faz este trabalho, porque erraria em silêncio.

    >>> silabar("tijolo")
    ['ti', 'jo', 'lo']
    >>> familia("ti")
    ['ta', 'te', 'ti', 'to', 'tu']

Referência do método: documento de planejamento de Angicos (1963) e
L. O. Lima, "Tecnologia, educação e democracia" (1965), apêndice.
"""

from __future__ import unicode_literals
import unicodedata

# --------------------------------------------------------------- alfabeto

VOGAIS_BASE = "aeiou"
ACENTOS_AGUDOS = "áéíóúâêô"      # acento gráfico: em i/u força hiato (sa-ú-de)
NASAIS = "ãõ"
VOGAIS = VOGAIS_BASE + ACENTOS_AGUDOS + NASAIS + "àü"

# Dígrafos que representam UM som e nunca se separam.
DIGRAFOS_INSEPARAVEIS = ("ch", "lh", "nh")

# Dígrafos que se separam entre as duas letras: car-ro, pas-sa, nas-cer.
DIGRAFOS_SEPARAVEIS = ("rr", "ss", "sc", "sç", "xc", "xs")

# Encontros consonantais que iniciam sílaba juntos: o-bra, a-tle-ta.
GRUPOS_ONSET = (
    "bl", "br", "cl", "cr", "dl", "dr", "fl", "fr", "gl", "gr",
    "pl", "pr", "tl", "tr", "vl", "vr",
)

# Consoantes que podem gerar grupo com l/r — usado na regra de
# generalização da aula 12 de Angicos (ver expandir_grupo).
CONSOANTES_DE_GRUPO = "bcdfgptv"


def _base(ch):
    """'á' -> 'a', 'ã' -> 'a'. Preserva a letra se não for acentuada."""
    d = unicodedata.normalize("NFD", ch)
    return "".join(c for c in d if unicodedata.category(c) != "Mn")


def eh_vogal(ch):
    return ch in VOGAIS


def _tem_acento_agudo(ch):
    return ch in ACENTOS_AGUDOS


def _eh_nasal(ch):
    return ch in NASAIS


# --------------------------------------------------------------- tokenizar

def tokenizar(palavra):
    """
    Quebra a palavra em unidades fonográficas.

    Retorna lista de (tipo, texto) onde tipo é 'C' ou 'V'.
    Trata dígrafos inseparáveis e o u mudo de 'que/qui/gue/gui'.
    """
    p = palavra.lower()
    out = []
    i = 0
    n = len(p)

    while i < n:
        par = p[i:i + 2]

        # ch, lh, nh — uma consoante só
        if par in DIGRAFOS_INSEPARAVEIS:
            out.append(("C", par))
            i += 2
            continue

        # qu/gu + e|i  ->  u mudo, o conjunto é uma consoante (qui-lo, gue-ra)
        if par in ("qu", "gu") and i + 2 < n and _base(p[i + 2]) in "ei":
            out.append(("C", par))
            i += 2
            continue

        # qu/gu + a|o  ->  o u é semivogal (á-gua, quan-do): consoante + vogal
        if par in ("qu", "gu") and i + 2 < n and _base(p[i + 2]) in "ao":
            out.append(("C", p[i]))
            out.append(("V", p[i + 1]))
            i += 2
            continue

        ch = p[i]
        out.append(("V" if eh_vogal(ch) else "C", ch))
        i += 1

    return out


# --------------------------------------------------------------- núcleos

def _eh_ditongo(v1, v2, crescente_permitido):
    """Duas vogais adjacentes ficam na mesma sílaba?"""
    b1, b2 = _base(v1), _base(v2)

    # ão, ãe, õe, ãi — sempre ditongo
    if _eh_nasal(v1) and b2 in "aeiou":
        return True

    # i/u com acento gráfico é sempre núcleo próprio: sa-ú-de, pa-ís, ru-í-na
    if _tem_acento_agudo(v2) and b2 in "iu":
        return False
    if _tem_acento_agudo(v1) and b1 in "iu":
        return False

    # decrescente: vogal + i/u átono  ->  ai, ei, oi, ui, au, eu, ou, iu
    if b2 in "iu":
        return True

    # crescente: i/u átono + vogal  ->  depende da posição (ver agrupar_nucleos)
    if b1 in "iu":
        return crescente_permitido

    # a/e/o + a/e/o  ->  hiato: po-e-ta, ca-os, vo-o
    return False


def agrupar_nucleos(tokens):
    """
    Agrupa vogais adjacentes em núcleos silábicos.

    Retorna lista de dicts: {'ini': idx, 'fim': idx, 'texto': 'ei'}
    onde ini/fim são índices em `tokens` (fim exclusivo).
    """
    total_vogais = sum(1 for t, _ in tokens if t == "V")
    nucleos = []
    i = 0
    n = len(tokens)

    while i < n:
        if tokens[i][0] != "V":
            i += 1
            continue

        ini = i
        j = i + 1

        while j < n and tokens[j][0] == "V":
            # ditongo crescente (i/u + vogal) só vale no fim da palavra e
            # em palavras com 3+ vogais: fa-mí-lia, his-tó-ria, mas di-a, ru-a.
            resto_eh_final = all(t != "V" for t, _ in tokens[j + 1:])
            crescente_ok = resto_eh_final and total_vogais >= 3

            # depois de qu/gu o u já foi emitido como vogal: quan-do, á-gua
            depois_de_qu_gu = (
                ini > 0
                and tokens[ini - 1][0] == "C"
                and tokens[ini - 1][1] in ("q", "g")
                and _base(tokens[ini][1]) == "u"
            )
            if depois_de_qu_gu:
                crescente_ok = True

            if _eh_ditongo(tokens[j - 1][1], tokens[j][1], crescente_ok):
                j += 1
            else:
                break

        nucleos.append({
            "ini": ini,
            "fim": j,
            "texto": "".join(t[1] for t in tokens[ini:j]),
        })
        i = j

    return nucleos


# --------------------------------------------------------------- silabar

def _quebra_entre(consoantes):
    """
    Dadas as consoantes entre dois núcleos, devolve quantas ficam na CODA
    da sílaba anterior. O resto vira onset da próxima.
    """
    k = len(consoantes)

    if k == 0:
        return 0                      # hiato: po-e-ta

    if k == 1:
        return 0                      # ca-sa, ti-jo-lo

    # duas ou mais: as duas últimas formam grupo de onset?
    ultimas = consoantes[-2] + consoantes[-1]

    if ultimas in DIGRAFOS_SEPARAVEIS:
        return k - 1                  # car-ro, pas-sa, nas-cer

    if ultimas in GRUPOS_ONSET:
        return k - 2                  # o-bra, ex-pres-so, a-tle-ta

    return k - 1                      # al-mo, bil-ro, rit-mo


def silabar(palavra):
    """
    Separa uma palavra em sílabas.

        >>> silabar("tijolo")     -> ['ti', 'jo', 'lo']
        >>> silabar("chibanca")   -> ['chi', 'ban', 'ca']
        >>> silabar("expresso")   -> ['ex', 'pres', 'so']
    """
    if not palavra or not palavra.strip():
        return []

    tokens = tokenizar(palavra.strip())
    nucleos = agrupar_nucleos(tokens)

    if not nucleos:
        return ["".join(t[1] for t in tokens)]

    # onde cada sílaba começa, em índice de token
    cortes = [0]
    for a, b in zip(nucleos, nucleos[1:]):
        entre = [t[1] for t in tokens[a["fim"]:b["ini"]]]
        na_coda = _quebra_entre(entre)
        cortes.append(a["fim"] + na_coda)
    cortes.append(len(tokens))

    silabas = []
    for ini, fim in zip(cortes, cortes[1:]):
        s = "".join(t[1] for t in tokens[ini:fim])
        if s:
            silabas.append(s)

    return silabas


# --------------------------------------------------------------- análise

def analisar(silaba):
    """
    Quebra uma sílaba em ataque, núcleo e coda.

        >>> analisar("ti")   -> {'onset': 't',  'nucleo': 'i',  'coda': ''}
        >>> analisar("ban")  -> {'onset': 'b',  'nucleo': 'a',  'coda': 'n'}
        >>> analisar("pres") -> {'onset': 'pr', 'nucleo': 'e',  'coda': 's'}
    """
    tokens = tokenizar(silaba)
    idx_v = [i for i, (t, _) in enumerate(tokens) if t == "V"]

    if not idx_v:
        return {"onset": silaba, "nucleo": "", "coda": ""}

    ini, fim = idx_v[0], idx_v[-1] + 1
    return {
        "onset": "".join(t[1] for t in tokens[:ini]),
        "nucleo": "".join(t[1] for t in tokens[ini:fim]),
        "coda": "".join(t[1] for t in tokens[fim:]),
    }


# --------------------------------------------------------------- famílias

# Combinações que a ortografia do português não usa. Geradas mesmo assim
# (o método original apresentava a família inteira), mas sinalizadas.
RARAS = {"lhi", "lhu", "nhi", "nhu", "qua", "quo"}


# Consoantes cuja LETRA cobre dois sons: ca/co/cu são /k/ mas ce/ci são /s/;
# ga/go/gu são /g/ mas ge/gi são /ʒ/. O documento de Angicos previa uma aula
# extra só para isso ("os sons do c forte e fraco"), na 8ª palavra geradora.
SOM_VARIAVEL = ("c", "g")


def familia(silaba):
    """
    A família fonêmica de uma sílaba: mesmo ataque, as cinco vogais.

        >>> familia("ti")  -> ['ta', 'te', 'ti', 'to', 'tu']
        >>> familia("lho") -> ['lha', 'lhe', 'lhi', 'lho', 'lhu']
        >>> familia("ban") -> ['ban', 'ben', 'bin', 'bon', 'bun']

    Sílaba travada mantém a coda — é assim que Angicos ensinou 'an'
    (CHIBANCA) e 'il' (BILRO / ALMOFADA).

    Os dígrafos qu/gu são o único caso em que a família segue o SOM e não a
    letra, porque 'qu' simplesmente não existe antes de a/o/u com som de /k/:
    a família de 'que' é ca-que-qui-co-cu. Para as letras c e g, que também
    mudam de som, mantemos a família ortográfica (ca-ce-ci-co-cu) como o
    método original fazia — veja tem_som_variavel().
    """
    a = analisar(silaba)
    onset, coda = a["onset"], a["coda"]

    # som /k/: escreve-se C antes de a/o/u e QU antes de e/i
    if onset == "qu":
        return [("qu" if v in "ei" else "c") + v + coda for v in VOGAIS_BASE]

    # som /g/: escreve-se G antes de a/o/u e GU antes de e/i
    if onset == "gu":
        return [("gu" if v in "ei" else "g") + v + coda for v in VOGAIS_BASE]

    return [onset + v + coda for v in VOGAIS_BASE]


def tem_som_variavel(silaba):
    """
    A família desta sílaba mistura dois sons na mesma linha?

    Serve para o app disparar a aula extra que Angicos previa: apresentar
    CASA / CEBOLA / CIGARRO / COPO / CEGO / CUIA e mostrar que o C muda de
    som antes de E e I — e que AÇAFRÃO / AÇUDE / AÇO resolvem o outro lado.
    """
    return analisar(silaba)["onset"] in SOM_VARIAVEL


def eh_rara(silaba):
    return silaba in RARAS


def expandir_grupo(silaba):
    """
    A regra de generalização de Angicos, aula 12:

        "Ao dar sílabas complexas o professor introduzirá outras do mesmo
         tipo, variando apenas a consoante inicial. Ex: expresso — dará
         oportunidade não só para pra, pre, pri, pro, pru, mas para bra,
         dra, fra, tra, vra."

    Devolve as famílias irmãs de uma sílaba com encontro consonantal.
    Para sílaba sem grupo, devolve lista vazia.
    """
    a = analisar(silaba)
    onset = a["onset"]

    if len(onset) != 2 or onset not in GRUPOS_ONSET:
        return []

    liquida = onset[1]           # 'l' ou 'r'
    irmas = []

    for c in CONSOANTES_DE_GRUPO:
        grupo = c + liquida
        if grupo in GRUPOS_ONSET and grupo != onset:
            irmas.append(familia(grupo + a["nucleo"] + a["coda"]))

    return irmas


# --------------------------------------------------- ficha de descoberta

def ficha_descoberta(palavra, incluir_generalizacao=False):
    """
    Monta a ficha de descoberta completa de uma palavra geradora —
    o 7º quadro do protocolo de 1965, de onde parte toda a alfabetização.

    Devolve as sílabas, as famílias, e as famílias irmãs quando a palavra
    tiver encontro consonantal.
    """
    silabas = silabar(palavra)
    familias = []
    vistas = set()

    for s in silabas:
        chave = analisar(s)["onset"] + "|" + analisar(s)["coda"]
        if chave in vistas:
            continue                     # xi-que-xi-que: não repete família
        vistas.add(chave)
        familias.append({
            "silaba": s,
            "linha": familia(s),
            "raras": [x for x in familia(s) if eh_rara(x)],
        })

    ficha = {
        "palavra": palavra.lower(),
        "silabas": silabas,
        "familias": familias,
        "grade": [f["linha"] for f in familias],
    }

    if incluir_generalizacao:
        extras = []
        for s in silabas:
            extras.extend(expandir_grupo(s))
        ficha["familias_irmas"] = extras

    return ficha


def palavras_possiveis(ficha, lexico):
    """
    Todas as palavras de `lexico` que se formam com as sílabas da ficha.
    É a "potência gerativa" — a riqueza fonêmica de Freire, contável.

    `lexico` é um iterável de palavras (a wordlist pt-BR).
    """
    disponiveis = set()
    for linha in ficha["grade"]:
        disponiveis.update(linha)

    achadas = []
    for p in lexico:
        p = p.lower().strip()
        if not p:
            continue
        sil = silabar(p)
        if sil and all(s in disponiveis for s in sil):
            achadas.append(p)

    return sorted(set(achadas))
