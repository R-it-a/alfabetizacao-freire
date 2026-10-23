# -*- coding: utf-8 -*-
"""Plano do app freireano — PDF de 2 páginas com mind map."""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit

W, H = A4  # 595.28 x 841.89

INK      = HexColor("#1B3A6B")
INK_L    = HexColor("#5B82C4")
INK_SOFT = HexColor("#E7EDF7")
LUZ      = HexColor("#9A6A16")
LUZ_L    = HexColor("#C9973A")
LUZ_SOFT = HexColor("#F7EEDC")
TXT      = HexColor("#161B24")
TXT2     = HexColor("#4A5464")
TXT3     = HexColor("#798393")
RULE     = HexColor("#C9D1DE")
GRND3    = HexColor("#EDF0F5")
WHITE    = HexColor("#FFFFFF")

DISP = "Helvetica-Bold"
DISP_R = "Helvetica"
BODY = "Times-Roman"
BODY_B = "Times-Bold"
BODY_I = "Times-Italic"
MONO = "Courier-Bold"
MONO_R = "Courier"

M = 42.0

c = canvas.Canvas("plano-alfabetizacao-freire.pdf", pagesize=A4)
c.setTitle("Plano — App de alfabetizacao freireano")
c.setAuthor("")
c.setSubject("Ferramentas, custos e conceitos")


# ---------------------------------------------------------------- helpers

def para(x, y, text, font=BODY, size=8.6, leading=11.2, color=TXT2, width=200,
         align="left"):
    """Draw wrapped text, return the y after the last line."""
    c.setFont(font, size)
    c.setFillColor(color)
    lines = simpleSplit(text, font, size, width)
    for ln in lines:
        if align == "center":
            c.drawCentredString(x + width / 2.0, y, ln)
        else:
            c.drawString(x, y, ln)
        y -= leading
    return y + leading


def label(x, y, text, color=LUZ, size=6.6, tracking=1.3, font=MONO):
    """Letter-spaced uppercase mono label."""
    c.setFont(font, size)
    c.setFillColor(color)
    cx = x
    for ch in text.upper():
        c.drawString(cx, y, ch)
        cx += c.stringWidth(ch, font, size) + tracking
    return cx


def rule(x1, y, x2, color=RULE, w=0.6):
    c.setStrokeColor(color)
    c.setLineWidth(w)
    c.line(x1, y, x2, y)


def box(x, y, w, h, fill=None, stroke=RULE, lw=0.7, r=2.5):
    if fill is not None:
        c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(lw)
    c.roundRect(x, y, w, h, r, stroke=1 if stroke else 0, fill=1 if fill else 0)


def branch_curve(x1, y1, x2, y2, color, lw=1.6):
    """Organic S-bezier from centre to a branch anchor."""
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.setLineCap(1)
    dx = x2 - x1
    p = c.beginPath()
    p.moveTo(x1, y1)
    p.curveTo(x1 + dx * 0.45, y1, x2 - dx * 0.45, y2, x2, y2)
    c.drawPath(p, stroke=1, fill=0)


# ================================================================ PAGE 1

# ---- masthead
c.setFillColor(LUZ)
c.rect(M, H - 62, 40, 3, stroke=0, fill=1)

label(M, H - 82, "Projeto pessoal — plano de construção")

c.setFont(DISP, 26)
c.setFillColor(TXT)
c.drawString(M, H - 114, "Alfabetizar adultos pelo")
c.drawString(M, H - 142, "método Paulo Freire, com IA")
c.drawString(M, H - 170, "no lugar do coordenador")

para(M, H - 196, "Arquitetura em cinco camadas. O método rege tudo; a IA cuida do que exige "
                 "sentido; o código cuida do que exige regra.",
     font=BODY, size=9.6, leading=12.4, color=TXT2, width=420)

rule(M, H - 226, W - M)

# ---- mind map
CX, CY = W / 2.0, 392.0

LEFT = [
    ("Voz", LUZ, "Entra e sai por áudio", [
        "Web Speech API — ouve a fala",
        "speechSynthesis — lê em voz alta",
        "Nativos do Android, custo zero",
        "Confirmação sonora obrigatória",
    ]),
    ("Núcleo", INK, "Determinístico — código puro", [
        "Silabador pt-BR (~100 linhas)",
        "Gerador de famílias silábicas",
        "Wordlist Hunspell pt-BR (VERO)",
        "Scoring vs. grade de Angicos",
    ]),
    ("Casca", INK, "O que o aluno instala", [
        "PWA — HTML + JS, sem app store",
        "Service worker → funciona offline",
        "localStorage guarda o progresso",
        "Cloudflare Pages — grátis",
    ]),
]

RIGHT = [
    ("Cérebro", LUZ, "Claude, via proxy", [
        "Corrige o ASR pelo contexto",
        "Escolhe a palavra geradora",
        "Conduz a conversa entre sessões",
        "Gera as perguntas de debate",
    ]),
    ("Método", INK, "Rege todas as camadas", [
        "5 fases (universo vocabular → fichas)",
        "9 quadros por palavra geradora",
        "Ficha da descoberta = o coração",
        "3 critérios: fonêmico, fonético, social",
    ]),
]

BW = 200.0
BH_L = 112.0
BH_R = 122.0
LX = M
RX = W - M - BW

left_ys = [498.0, 336.5, 175.0]
right_ys = [423.5, 239.5]


def draw_branch(x, y, w, h, title, color, sub, items, anchor_side):
    box(x, y, w, h, fill=WHITE, stroke=RULE, lw=0.7)
    # colour spine
    c.setFillColor(color)
    if anchor_side == "right":
        c.rect(x + w - 2.4, y, 2.4, h, stroke=0, fill=1)
    else:
        c.rect(x, y, 2.4, h, stroke=0, fill=1)

    pad = 12
    ty = y + h - 19
    c.setFont(DISP, 12.2)
    c.setFillColor(color)
    c.drawString(x + pad, ty, title)

    c.setFont(BODY_I, 8.0)
    c.setFillColor(TXT3)
    c.drawString(x + pad, ty - 11.5, sub)

    iy = ty - 29
    for it in items:
        c.setFillColor(color)
        c.circle(x + pad + 2.0, iy + 2.6, 1.5, stroke=0, fill=1)
        c.setFont(BODY, 8.3)
        c.setFillColor(TXT2)
        ln = simpleSplit(it, BODY, 8.3, w - pad * 2 - 10)
        c.drawString(x + pad + 9, iy, ln[0])
        iy -= 13.0


# curves first (behind boxes)
for i, (title, color, sub, items) in enumerate(LEFT):
    yb = left_ys[i]
    branch_curve(CX - 33, CY, LX + BW + 3, yb + BH_L / 2.0, color, lw=1.5)

for i, (title, color, sub, items) in enumerate(RIGHT):
    yb = right_ys[i]
    branch_curve(CX + 33, CY, RX - 3, yb + BH_R / 2.0, color, lw=1.5)

for i, (title, color, sub, items) in enumerate(LEFT):
    draw_branch(LX, left_ys[i], BW, BH_L, title, color, sub, items, "right")

for i, (title, color, sub, items) in enumerate(RIGHT):
    draw_branch(RX, right_ys[i], BW, BH_R, title, color, sub, items, "left")

# ---- centre node
c.setFillColor(INK)
c.setStrokeColor(WHITE)
c.setLineWidth(2.5)
c.circle(CX, CY, 33, stroke=1, fill=1)
c.setFont(DISP, 10)
c.setFillColor(WHITE)
c.drawCentredString(CX, CY + 5, "O APP")
c.setFont(MONO_R, 6.2)
c.drawCentredString(CX, CY - 8, "PWA")

# ---- footer strip page 1 : cost badge + the dividing rule
fy = 62
rule(M, 148, W - M)

bw = 176.0
bh = 68.0
bx = W - M - bw
box(bx, fy, bw, bh, fill=LUZ_SOFT, stroke=LUZ_L, lw=0.9)
label(bx + 13, fy + bh - 17, "Custo mensal", color=LUZ, size=6.2, tracking=1.2)
c.setFont(DISP, 22)
c.setFillColor(LUZ)
c.drawString(bx + 13, fy + bh - 42, "US$ 3")
c.setFont(BODY, 8.1)
c.setFillColor(TXT2)
c.drawString(bx + 13, fy + 15, "20 alunos · ~R$ 16 por mês.")
c.drawString(bx + 13, fy + 5.5, "Só o LLM custa; o resto é grátis.")

label(M, 130, "A regra de divisão", color=INK)
para(M, 114, "LLM onde há sentido e ambiguidade. Código onde há estrutura e regra. "
             "O modelo nunca silabifica, nunca decide progressão e nunca valida palavra — "
             "essas três erram em silêncio, e erro silencioso num app de alfabetização "
             "ensina a coisa errada sem que ninguém perceba.",
     font=BODY, size=8.8, leading=11.4, color=TXT2, width=W - 2 * M - bw - 24)

c.setFont(MONO_R, 6.4)
c.setFillColor(TXT3)
c.drawRightString(W - M, 34, "1 / 2")

c.showPage()

# ================================================================ PAGE 2

c.setFillColor(LUZ)
c.rect(M, H - 62, 40, 3, stroke=0, fill=1)
label(M, H - 82, "Ferramentas, custos e conceitos")

c.setFont(DISP, 17)
c.setFillColor(TXT)
c.drawString(M, H - 106, "O que você precisa saber e pagar")

rule(M, H - 122, W - M)

# ---------------- tools table
ty = H - 146
label(M, ty, "Pilha de ferramentas", color=INK)
ty -= 16

COLS = [M, M + 98, M + 258]
RIGHT_EDGE = W - M - 6

c.setFillColor(GRND3)
c.rect(M, ty - 4, W - 2 * M, 15, stroke=0, fill=1)
c.setFont(MONO, 6.4)
c.setFillColor(TXT3)
for i, h in enumerate(["Camada", "Ferramenta", "Por quê"]):
    c.drawString(COLS[i] + 5, ty + 1, h.upper())
c.drawRightString(RIGHT_EDGE, ty + 1, "CUSTO")
ty -= 8

ROWS = [
    ("Frontend", "HTML + JS puro", "Sem framework no MVP; leve no 3G", "grátis"),
    ("Instalação", "PWA (manifest + SW)", "Instala pela tela inicial, sem loja", "grátis"),
    ("Hospedagem", "Cloudflare Pages", "HTTPS e deploy por git, link fixo", "grátis"),
    ("Ouvir", "Web Speech API", "ASR nativo do Android, pt-BR", "grátis"),
    ("Falar", "speechSynthesis", "TTS nativo do Android, pt-BR", "grátis"),
    ("Cérebro", "Claude Sonnet 5", "Corrige ASR, escolhe palavra, dialoga", "~US$ 3/mês"),
    ("Proxy", "Cloudflare Worker", "Esconde a chave da API (~30 linhas)", "grátis"),
    ("Dicionário", "Hunspell pt-BR", "Valida as palavras descobertas", "grátis"),
    ("Progresso", "localStorage", "Sem banco, sem login, sem servidor", "grátis"),
]

for i, row in enumerate(ROWS):
    if i % 2 == 1:
        c.setFillColor(HexColor("#F6F8FB"))
        c.rect(M, ty - 4.5, W - 2 * M, 14, stroke=0, fill=1)
    c.setFont(BODY_B, 8.4)
    c.setFillColor(TXT)
    c.drawString(COLS[0] + 5, ty, row[0])
    c.setFont(MONO_R, 7.2)
    c.setFillColor(INK)
    c.drawString(COLS[1] + 5, ty, row[1])
    c.setFont(BODY, 8.2)
    c.setFillColor(TXT2)
    c.drawString(COLS[2] + 5, ty, row[2])
    paid = "US$" in row[3]
    c.setFont(MONO if paid else MONO_R, 7.2)
    c.setFillColor(LUZ if paid else TXT3)
    c.drawRightString(RIGHT_EDGE, ty, row[3])
    ty -= 14

rule(M, ty + 4, W - M)

# ---------------- cost detail
ty -= 22
label(M, ty, "Como o custo se comporta", color=INK)
ty -= 15

cbw = (W - 2 * M - 20) / 3.0
cards = [
    ("Uma sessão", "US$ 0,008", "~5 min de conversa: 1 chamada ao\nLLM com prompt já cacheado."),
    ("20 alunos", "US$ 3 / mês", "20 sessões por aluno no mês.\nCabe no free tier de tudo."),
    ("200 alunos", "US$ 30 / mês", "Escala linear. Só o LLM cresce;\nhospedagem segue grátis."),
]
for i, (t, big, sub) in enumerate(cards):
    x = M + i * (cbw + 10)
    box(x, ty - 62, cbw, 62, fill=WHITE, stroke=RULE, lw=0.7)
    label(x + 10, ty - 17, t, color=TXT3, size=6.2, tracking=1.0)
    c.setFont(DISP, 13.5)
    c.setFillColor(LUZ)
    c.drawString(x + 10, ty - 35, big)
    yy = ty - 47
    for ln in sub.split("\n"):
        c.setFont(BODY, 7.6)
        c.setFillColor(TXT2)
        c.drawString(x + 10, yy, ln)
        yy -= 9.4

ty -= 78

c.setFont(BODY_I, 8)
c.setFillColor(TXT3)
c.drawString(M, ty, "Fórmula: alunos × sessões/mês × US$ 0,008.  Prompt caching é o que segura isso — "
                    "o prompt pedagógico é grande e fixo, e cacheado custa ~10%.")
ty -= 17

rule(M, ty, W - M)
ty -= 18

# ---------------- concepts
label(M, ty, "Conceitos que vale entender antes", color=INK)
ty -= 16

CONCEPTS = [
    ("PWA", "Um site que o celular instala como app pela tela inicial. Sem loja, sem download, "
            "atualiza sozinho. Some a maior barreira do público."),
    ("Service worker", "Script que guarda o app dentro do celular. É o que faz funcionar sem "
                       "internet — só a hora de falar precisa de rede."),
    ("ASR e TTS", "Reconhecimento e síntese de fala. O Android já traz os dois em pt-BR e de graça; "
                  "é o que derruba o custo do projeto a quase nada."),
    ("Proxy de API", "A chave do Claude não pode ficar no HTML — qualquer um lê o código-fonte. "
                     "Uma função no meio guarda a chave."),
    ("Structured outputs", "O modelo devolve um JSON validado contra um schema, não texto solto. "
                           "Você recebe objeto pronto em vez de parsear resposta."),
    ("Silabação determinística", "Separar sílabas é regra, não julgamento. O LLM erra de vez em "
                                 "quando e você não descobre qual vez — por isso vira código."),
]

col_w = (W - 2 * M - 18) / 2.0
for i, (t, d) in enumerate(CONCEPTS):
    col = i % 2
    rowi = i // 2
    x = M + col * (col_w + 18)
    yy = ty - rowi * 45
    c.setFont(MONO, 7.4)
    c.setFillColor(LUZ)
    c.drawString(x, yy, t.upper())
    para(x, yy - 12, d, font=BODY, size=8.1, leading=10.2, color=TXT2, width=col_w - 4)

ty -= 136

rule(M, ty, W - M)
ty -= 17

# ---------------- build order
label(M, ty, "Ordem de construção", color=INK)
ty -= 15

STEPS = [
    ("Testar o ASR no celular de um aluno", "30 min — decide o projeto inteiro"),
    ("Silabador pt-BR + gerador de famílias", "fim de semana"),
    ("Ficha da descoberta jogável", "o coração; se só isso rodar, já vale"),
    ("Loop de áudio com confirmação sonora", "ouvir, falar, confirmar"),
    ("Proxy + Claude escolhendo a palavra", "aqui entra a IA"),
    ("Escrita + service worker + manifest", "vira PWA instalável"),
]

for i, (s, note) in enumerate(STEPS):
    c.setFillColor(INK_SOFT)
    c.circle(M + 6, ty + 2.6, 7, stroke=0, fill=1)
    c.setFont(MONO, 6.6)
    c.setFillColor(INK)
    c.drawCentredString(M + 6, ty + 0.6, str(i + 1))
    c.setFont(BODY_B, 8.6)
    c.setFillColor(TXT)
    c.drawString(M + 20, ty, s)
    c.setFont(BODY_I, 8)
    c.setFillColor(TXT3)
    c.drawString(M + 20 + c.stringWidth(s, BODY_B, 8.6) + 8, ty, "— " + note)
    ty -= 13.6

# ---------------- closing callout
cy = 60
ch_ = 68
box(M, cy, W - 2 * M, ch_, fill=LUZ_SOFT, stroke=LUZ_L, lw=0.9)
c.setFillColor(LUZ)
c.rect(M, cy, 2.6, ch_, stroke=0, fill=1)

label(M + 14, cy + ch_ - 16, "O passo 1 decide o resto", color=LUZ, size=6.4, tracking=1.2)
para(M + 14, cy + ch_ - 31,
     "Antes de escrever qualquer linha: grave cinco frases no celular de um aluno, no ambiente real "
     "dele, e veja quanto o reconhecimento acerta dos substantivos — que são justamente as palavras "
     "geradoras. Se acertar razoavelmente, o resto do plano destrava. Se errar muito, o desenho muda: "
     "confirmação sonora mais agressiva, ou modelo de áudio no lugar do ASR do navegador.",
     font=BODY, size=8.4, leading=10.8, color=TXT2, width=W - 2 * M - 28)

# footer
c.setFont(MONO_R, 6.4)
c.setFillColor(TXT3)
c.drawString(M, 34, "Grade fonética: Memorial Paulo Freire / UFERSA · Protocolo: L. O. Lima, 1965")
c.drawRightString(W - M, 34, "2 / 2")

c.showPage()
c.save()
print("OK")
