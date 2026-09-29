# Instruções para Conectar Formulário ao Google Sheets

## Passo 1: Criar Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha
3. Nomeie a planilha como "Leads Nexy Technology"
4. Deixe a planilha vazia (os cabeçalhos serão criados automaticamente pelo script)

## Passo 2: Adicionar Google Apps Script

1. Na sua planilha do Google Sheets, clique em **Extensões** > **Apps Script**
2. Apague todo o código existente
3. Copie o código do arquivo `google-apps-script.js` e cole no editor
4. Clique em **Salvar** (ícone de disquete)
5. Dê um nome ao projeto, por exemplo: "Formulário Nexy"

## Passo 3: Implantar o Script como API

1. Clique em **Implantar** > **Nova implantação**
2. Selecione o tipo: **Aplicativo Web**
3. Configure:
   - **Descrição**: "API Formulário Nexy"
   - **Executar como**: "Eu"
   - **Quem tem acesso**: "Qualquer pessoa"
4. Clique em **Implantar**
5. Copie a **URL do aplicativo web** (será algo como `https://script.google.com/macros/s/AKfycbx.../exec`)

## Passo 4: Atualizar script.js

1. Abra o arquivo `script.js` no seu projeto
2. Localize a linha 56:
   ```javascript
   const scriptUrl = 'https://script.google.com/macros/s/AKfycbx.../exec';
   ```
3. Substitua a URL pela URL que você copiou no passo 3
4. Salve o arquivo

## Passo 5: Testar

1. Abra sua landing page no navegador
2. Preencha o formulário com dados de teste
3. Clique em "Falar com nosso time"
4. Verifique se os dados aparecem na sua planilha do Google Sheets

## Campos que serão salvos

O script salvará os seguintes campos na planilha:
- **Timestamp**: Data e hora do envio
- **Nome**: Nome do contato
- **Telefone**: Telefone do contato
- **Investimento**: Faixa de investimento inicial
- **Projeto**: Tipo de projeto (Web App, SaaS, App Mobile, Dashboard)
- **Urgência**: Urgência do projeto

## Troubleshooting

### Erro de CORS
Se aparecer erro no console do navegador sobre CORS, verifique se:
- A opção "Quem tem acesso" está configurada como "Qualquer pessoa"
- Você implantou o script como "Aplicativo Web"

### Dados não aparecem na planilha
Verifique:
- Se a URL no script.js está correta
- Se o script foi implantado corretamente
- Se há erros no console do navegador (F12)

### Script não salva dados
1. Abra o editor do Apps Script
2. Clique em **Executar** > **doPost**
3. Se aparecer erro de permissão, clique em **Revisar permissões**
4. Autorize o script com sua conta Google

## Segurança

- O script está configurado para aceitar requisições de qualquer pessoa
- Em produção, considere adicionar validação adicional no Google Apps Script
- Os dados são salvos na sua conta Google, mantenha sua conta segura

## Suporte

Se tiver problemas, verifique o console do navegador (F12) para ver erros de JavaScript.
