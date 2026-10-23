# -*- coding: utf-8 -*-
"""Testes do silabador. Rode:  python teste_silabador.py"""

from __future__ import unicode_literals
import io, sys
from silabador import (
    silabar, analisar, familia, expandir_grupo,
    ficha_descoberta, palavras_possiveis, tem_som_variavel,
)

# ------------------------------------------------------------------ casos

# As 17 palavras geradoras de Angicos, 1963 — na ordem do documento original.
ANGICOS = [
    ("belota",     ["be", "lo", "ta"]),
    ("sapato",     ["sa", "pa", "to"]),
    ("voto",       ["vo", "to"]),
    ("povo",       ["po", "vo"]),
    ("salina",     ["sa", "li", "na"]),
    ("feira",      ["fei", "ra"]),
    ("milho",      ["mi", "lho"]),
    ("goleiro",    ["go", "lei", "ro"]),
    ("cozinha",    ["co", "zi", "nha"]),
    ("tijela",     ["ti", "je", "la"]),
    ("jarra",      ["jar", "ra"]),
    ("fogão",      ["fo", "gão"]),
    ("chibanca",   ["chi", "ban", "ca"]),
    ("xiquexique", ["xi", "que", "xi", "que"]),
    ("expresso",   ["ex", "pres", "so"]),
    ("bilro",      ["bil", "ro"]),
    ("almofada",   ["al", "mo", "fa", "da"]),
]

# Palavras do cotidiano — as que de fato vão sair da boca dos alunos.
COTIDIANO = [
    ("cuscuz",    ["cus", "cuz"]),
    ("tijolo",    ["ti", "jo", "lo"]),
    ("feijão",    ["fei", "jão"]),
    ("panela",    ["pa", "ne", "la"]),
    ("obra",      ["o", "bra"]),
    ("trabalho",  ["tra", "ba", "lho"]),
    ("dinheiro",  ["di", "nhei", "ro"]),
    ("chuva",     ["chu", "va"]),
    ("carro",     ["car", "ro"]),
    ("passa",     ["pas", "sa"]),
    ("escola",    ["es", "co", "la"]),
    ("arroz",     ["ar", "roz"]),
    ("casa",      ["ca", "sa"]),
    ("comida",    ["co", "mi", "da"]),
    ("galinha",   ["ga", "li", "nha"]),
    ("farinha",   ["fa", "ri", "nha"]),
    ("mandioca",  ["man", "di", "o", "ca"]),
    ("roupa",     ["rou", "pa"]),
    ("peixe",     ["pei", "xe"]),
    ("carne",     ["car", "ne"]),
    ("leite",     ["lei", "te"]),
    ("banana",    ["ba", "na", "na"]),
    ("enxada",    ["en", "xa", "da"]),
    ("terra",     ["ter", "ra"]),
    ("labuta",    ["la", "bu", "ta"]),
]

# Casos difíceis: hiato, ditongo, dígrafo, encontro, qu/gu.
DIFICEIS = [
    ("saúde",    ["sa", "ú", "de"]),      # acento força hiato
    ("país",     ["pa", "ís"]),
    ("ruína",    ["ru", "í", "na"]),
    ("poeta",    ["po", "e", "ta"]),      # a/e/o + a/e/o = hiato
    ("voo",      ["vo", "o"]),
    ("dia",      ["di", "a"]),            # 2 vogais: hiato
    ("rua",      ["ru", "a"]),
    ("família",  ["fa", "mí", "lia"]),    # 3+ vogais: ditongo no fim
    ("história", ["his", "tó", "ria"]),
    ("água",     ["á", "gua"]),           # gu + a: u é semivogal
    ("quando",   ["quan", "do"]),
    ("quilo",    ["qui", "lo"]),          # qu + i: u mudo
    ("guerra",   ["guer", "ra"]),
    ("nascer",   ["nas", "cer"]),         # sc separa
    ("atleta",   ["a", "tle", "ta"]),     # tl é grupo de onset
    ("ritmo",    ["rit", "mo"]),          # tm não é grupo
    ("planta",   ["plan", "ta"]),
    ("cravo",    ["cra", "vo"]),
    ("sal",      ["sal"]),
    ("mar",      ["mar"]),
    ("pá",       ["pá"]),
]

FAMILIAS = [
    ("ti",  ["ta", "te", "ti", "to", "tu"]),
    ("jo",  ["ja", "je", "ji", "jo", "ju"]),
    ("lo",  ["la", "le", "li", "lo", "lu"]),
    ("lho", ["lha", "lhe", "lhi", "lho", "lhu"]),
    ("nha", ["nha", "nhe", "nhi", "nho", "nhu"]),
    ("ban", ["ban", "ben", "bin", "bon", "bun"]),   # travada mantém coda
    ("al",  ["al", "el", "il", "ol", "ul"]),
    ("que", ["ca", "que", "qui", "co", "cu"]),      # som /k/, não a letra
    ("gue", ["ga", "gue", "gui", "go", "gu"]),      # som /g/
    ("co",  ["ca", "ce", "ci", "co", "cu"]),        # letra C: som varia
    ("pres", ["pras", "pres", "pris", "pros", "prus"]),
]


# ------------------------------------------------------------------ runner

out = io.open("resultado-testes.txt", "w", encoding="utf-8")
falhas = []
total = 0


def checa(rotulo, obtido, esperado):
    global total
    total += 1
    ok = obtido == esperado
    if not ok:
        falhas.append((rotulo, obtido, esperado))
    return ok


def bloco(titulo, casos, fn):
    out.write("\n%s\n%s\n" % (titulo, "-" * len(titulo)))
    for entrada, esperado in casos:
        obtido = fn(entrada)
        ok = checa(entrada, obtido, esperado)
        out.write("  %s  %-12s -> %s%s\n" % (
            "ok  " if ok else "FALHA",
            entrada,
            "-".join(obtido),
            "" if ok else "   (esperado: %s)" % "-".join(esperado),
        ))


bloco("As 17 palavras geradoras de Angicos", ANGICOS, silabar)
bloco("Palavras do cotidiano", COTIDIANO, silabar)
bloco("Casos difíceis", DIFICEIS, silabar)
bloco("Famílias fonêmicas", FAMILIAS, familia)

# ------------------------------------------------------- ficha de TIJOLO

out.write("\nFicha de descoberta — TIJOLO\n")
out.write("-" * 28 + "\n")
f = ficha_descoberta("tijolo")
out.write("  sílabas: %s\n" % "-".join(f["silabas"]))
for linha in f["grade"]:
    out.write("  %s\n" % "  ".join(s.upper() for s in linha))

LEXICO = """
tatu tijolo loja jato lata luta lote tela teto tato tolo lula juta tijela
late talo tule jota lajota jati casa livro pedra mesa
""".split()

achadas = palavras_possiveis(f, LEXICO)
out.write("  formáveis no léxico de teste (%d): %s\n" % (len(achadas), ", ".join(achadas)))
checa("potencia_gerativa(tijolo) >= 15", len(achadas) >= 15, True)

# ------------------------------------------- generalização (Angicos, aula 12)

out.write("\nRegra de generalização — EXPRESSO\n")
out.write("-" * 33 + "\n")
irmas = expandir_grupo("pres")
out.write("  a partir de 'pres', o professor também apresenta:\n")
for linha in irmas:
    out.write("    %s\n" % "  ".join(s.upper() for s in linha))
checa("expandir_grupo('pres') gera irmãs", len(irmas) >= 5, True)
checa("expandir_grupo('ti') não gera nada", expandir_grupo("ti"), [])

# ------------------------------------------------- sons que mudam de letra

out.write("\nSílabas que exigem a aula do C forte e fraco\n")
out.write("-" * 44 + "\n")
for s in ["co", "ga", "ti", "ban", "que"]:
    out.write("  %-6s som variável: %s\n" % (s, "sim" if tem_som_variavel(s) else "não"))
checa("tem_som_variavel('co')", tem_som_variavel("co"), True)
checa("tem_som_variavel('ga')", tem_som_variavel("ga"), True)
checa("tem_som_variavel('ti')", tem_som_variavel("ti"), False)

# ------------------------------------------------------------------ análise

out.write("\nAnálise de sílaba\n")
out.write("-" * 17 + "\n")
for s in ["ti", "ban", "pres", "al", "cha"]:
    a = analisar(s)
    out.write("  %-6s onset=%-4s núcleo=%-3s coda=%s\n"
              % (s, a["onset"] or "-", a["nucleo"], a["coda"] or "-"))

# ------------------------------------------------------------------ resumo

out.write("\n" + "=" * 46 + "\n")
out.write("%d de %d verificações passaram\n" % (total - len(falhas), total))
if falhas:
    out.write("\nFalhas:\n")
    for rotulo, obtido, esperado in falhas:
        out.write("  %-12s obtido=%s  esperado=%s\n" % (rotulo, obtido, esperado))
out.close()

print("%d/%d passaram" % (total - len(falhas), total))
if falhas:
    print("FALHAS: %d" % len(falhas))
    for rotulo, obtido, esperado in falhas[:12]:
        try:
            print("  %s -> %s (esperado %s)" % (rotulo, obtido, esperado))
        except UnicodeEncodeError:
            print("  %s -> ver resultado-testes.txt" % rotulo.encode("ascii", "replace").decode())
