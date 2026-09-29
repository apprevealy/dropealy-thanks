# Dropealy — obrigado e preenchimento de login

Revisão de 29/09/2026. Repositório: apprevealy/dropealy-thanks. Hospedagem existente: projeto Vercel lp-revealy-obrigado, domínio thanks.dropealy.com. Não trocar DNS, criar outro projeto ou mover o domínio para publicar estes arquivos.

## Dados do checkout

A página reconhece `e` (e-mail do comprador) e `payerName` (nome do comprador), além dos aliases anteriores válidos. Usa apenas o primeiro nome real, remove acentos e caracteres não alfabéticos, converte para inicial maiúscula e restante minúsculo e acrescenta `12345`.

Exemplos: João Silva → Joao12345; JOSÉ → Jose12345; Gian Reis → Gian12345. Não existe fallback Usuario12345 nem nome deduzido do endereço de e-mail. Campos ausentes/ambíguos são informados, não inventados. Não se recuperam dados de compradores anteriores do localStorage ou sessionStorage.

IMPORTANTE: parâmetros de URL são dados de exibição, não prova de compra, provisionamento ou identidade. A página não libera acesso e não consulta credenciais publicamente. O webhook autenticado da Dropealy continua responsável por criar a conta e liberar o plano após aprovação. A exibição é de **senha inicial para novos cadastros**; contas existentes continuam com a senha atual. Não redefinir contas existentes ao comprar novamente. Nome + 12345 é previsível: orientar troca após o primeiro acesso.

## Preenchimento entre abas

Todos os botões `.platform-link` conservam o destino normal https://app.dropealy.com/login, sem e-mail ou senha na URL. Um clique normal, com dados completos, abre /login?from=thanks. O login e a página de obrigado fazem handshake em memória:

1. Login gera nonce aleatório de 32 hex e envia `{type:'DROPEALY_PREFILL_READY',nonce}` à janela que o abriu, com origem exata https://thanks.dropealy.com.
2. Obrigado confere origem https://app.dropealy.com, janela exata e formato do nonce; responde uma única vez `{type:'DROPEALY_PREFILL',nonce,email,password}`.
3. Login confere origem/janela/nonce e campos, preenche sem submeter e confirma `{type:'DROPEALY_PREFILL_ACK',nonce}`. Encerra listener e corta opener.

Prazo do handshake: 20 segundos. Dados na página expiram após 20 minutos ou ao sair. Popup bloqueado, link aberto pelo menu/modificador, sandbox ou COOP incompatível resultam em login manual, nunca senha na URL. O fluxo depende também da versão correspondente do login da Dropealy. Uma prévia em outro domínio não recebe credenciais, pois as origens são fixas.

Os parâmetros pessoais são removidos do endereço após a leitura. vercel.json acrescenta Referrer-Policy:no-referrer, noindex e no-store para HTML. Não bloqueia iframes da plataforma de pagamento.

## Testes

Node 22, sem dependências extras:

```sh
node --check obrigado.js
node --test tests/obrigado.test.mjs
```

29 testes passaram no ambiente local: parâmetros nativos/legados, acentos, entrada inválida, ausência de dados, isolamento do navegador, cópia, popup bloqueado, origem/janela/nonce, envio único/ACK, timeout e expiração. Esses são testes de JavaScript com DOM/janelas simulados, não uma compra real nem teste dos dois sites em produção.

## Publicação e validação ainda necessárias

O deploy de produção observado era originado por CLI. Salvar no GitHub não comprova deploy na Vercel. Publicar os arquivos revisados **no projeto existente lp-revealy-obrigado**, junto à versão compatível do login/backend. Conferir o JS servido em thanks.dropealy.com/obrigado.js depois da publicação. O conector de deploy da Vercel retornou indisponibilidade nesta execução; nenhuma alteração de DNS foi feita.

Na Perfect Pay: Produtos > Meus Produtos > produto > Configurações > Página de Obrigado Externa > Pagamento Aprovado deve apontar para https://thanks.dropealy.com/. Conferir também eventual fluxo de Upsell, que pode substituir essa configuração. Não presumir que receber o webhook configure o redirecionamento.

Antes de declarar pronto: verificar um redirecionamento real de compra aprovada (sem criar cobrança sem autorização), a chegada de e/payerName, o processamento do webhook para comprador novo, a senha sem acento e o login com formulário preenchido. Verificar também compra de conta existente, pagamento ainda pendente, carregamento em iframe e bloqueio de popup. Não registrar dados pessoais, senhas ou tokens nos relatórios.

## Referências

- Perfect Pay: https://help.perfectpay.com.br/article/128-como-configurar-minha-pagina-de-obrigado-na-perfect-pay
- Parâmetros publicados pelo autor dos scripts de integração, seção 19: https://github.com/lzanette/perfect-pay-scripts (não substitui conferir o retorno real do checkout do produto).
