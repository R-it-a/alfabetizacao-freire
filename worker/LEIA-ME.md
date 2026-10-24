# Worker: ligar o Claude ao app

O app funciona sem isto: escolhe a palavra geradora só pelas regras do método e usa perguntas fixas. O Worker acrescenta o que exige sentido: corrigir o reconhecimento de voz pelo contexto, escolher as palavras com mais carga existencial e fazer a pergunta de debate.

## Publicar (uma vez)

Precisa de uma conta gratuita na Cloudflare e de uma chave da API da Anthropic.

```bash
cd worker
npm i -g wrangler
wrangler login
wrangler secret put ANTHROPIC_API_KEY      # cola a chave quando pedir
wrangler deploy worker.js --name palavra-proxy --compatibility-date 2024-09-01
```

O comando mostra o endereço do Worker, algo como `https://palavra-proxy.SEU-USUARIO.workers.dev`. Coloque esse endereço em `app/config.js`:

```js
proxyUrl: 'https://palavra-proxy.SEU-USUARIO.workers.dev',
```

## Variáveis opcionais

| Variável | Para quê | Padrão |
|---|---|---|
| `APP_ORIGIN` | Único site que pode usar o Worker (CORS) | `https://r-it-a.github.io` |
| `MODELO` | Modelo do Claude | `claude-sonnet-5-5` |

## Se der erro

O app nunca trava por causa do Worker: se a chamada falhar, ele segue com as regras locais e escreve o motivo no console do navegador. Os erros mais comuns estão no manual (seção 06): CORS, chave ausente e a requisição `OPTIONS`.

O formato do pedido ao Claude segue o manual do projeto e ainda não foi testado com uma chave de verdade. Confira a resposta no primeiro uso.
