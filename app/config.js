/**
 * Configuração do app.
 *
 * proxyUrl: endereço do Cloudflare Worker que conversa com o Claude
 * (pasta worker/). Vazio = o app funciona sem IA: escolhe a palavra geradora
 * só pelas regras do método e usa perguntas fixas.
 */
export const CONFIG = {
  proxyUrl: '',
  velocidadeFala: 0.9,        // 0.85 a 0.95 para quem está aprendendo (manual, seção 02)
  velocidadeModelo: 0.7,      // quando a voz repete devagar para corrigir
  tentativas: 2               // fluxo da sessão, seção 03
};
