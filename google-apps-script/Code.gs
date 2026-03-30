/**
 * micro:bit Games - Google Sheets 점수 기록
 *
 * 시트 구조 (자동 생성):
 * playerName | email | gameId | score | input | createdAt
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    sheet.appendRow([
      data.playerName || '',
      data.email || '',
      data.gameId || '',
      data.score || 0,
      data.input || '',
      data.createdAt || new Date().toISOString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('scores');

  if (!sheet) {
    sheet = ss.insertSheet('scores');
    sheet.appendRow(['playerName', 'email', 'gameId', 'score', 'input', 'createdAt']);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}
