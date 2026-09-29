// Google Apps Script para receber dados do formulário e salvar no Google Sheets
// Copie este código para o Google Apps Script do seu Google Sheets

function doPost(e) {
  try {
    // Obtém a planilha ativa
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse dos dados recebidos
    const data = JSON.parse(e.postData.contents);
    
    // Define os cabeçalhos se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Nome',
        'Telefone',
        'Investimento',
        'Projeto',
        'Urgência'
      ]);
    }
    
    // Adiciona os dados à planilha
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString('pt-BR'),
      data.nome || '',
      data.telefone || '',
      data.investimento || '',
      data.projeto || '',
      data.urgencia || ''
    ]);
    
    // Retorna resposta de sucesso
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log do erro para debugging
    console.error('Erro ao processar formulário:', error);
    
    // Retorna resposta de erro
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Função opcional para teste manual
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 'status': 'API está funcionando' }))
    .setMimeType(ContentService.MimeType.JSON);
}
