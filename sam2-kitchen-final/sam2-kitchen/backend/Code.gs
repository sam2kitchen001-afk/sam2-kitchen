/** SAM² Kitchen: public read-only menu API (Phase 2). Admin writes arrive in Phase 3. */
var TZ = 'Asia/Karachi', CACHE_KEY = 'menu_v1', CACHE_TTL = 60;
var TABS = ['Products','Categories','DailyMenu','Deals','Settings'];

function doGet(e){
  var action = (e && e.parameter && e.parameter.action) || 'menu';
  if (action !== 'menu') return json_({error: 'Unknown action'});
  try { return json_(getMenu_()); }
  catch (err) { return json_({error: 'Menu unavailable'}); }
}

function json_(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function getMenu_(){
  var cache = CacheService.getScriptCache(), hit = cache.get(CACHE_KEY);
  if (hit) return JSON.parse(hit);
  var ss = SpreadsheetApp.getActiveSpreadsheet(), raw = {};
  TABS.forEach(function(n){ raw[n] = readTab_(ss.getSheetByName(n)); });
  var menu = buildMenu_(raw, new Date().toISOString());
  try { cache.put(CACHE_KEY, JSON.stringify(menu), CACHE_TTL); } catch (e) {}  // >100KB just skips cache
  return menu;
}

function readTab_(sh){
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v[0].map(function(x){ return String(x).trim(); }), out = [];
  for (var i = 1; i < v.length; i++){
    var row = {}, empty = true;
    for (var j = 0; j < h.length; j++){
      var c = v[i][j];
      if (c instanceof Date) c = Utilities.formatDate(c, TZ, 'yyyy-MM-dd');
      if (c !== '' && c !== false) empty = false;
      if (h[j]) row[h[j]] = c;
    }
    if (!empty) out.push(row);
  }
  return out;
}

function clearMenuCache(){ CacheService.getScriptCache().remove(CACHE_KEY); }

/* ---------- One-time setup: run setupSheets() once ---------- */
function setupSheets(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var S = {
    Categories: {h: ['CategoryID','Name','Order','Active'], bool: [4], rows: [
      ['desi','Desi Food',1,true],['frozen','Frozen Food',2,true],['fast','Fast Food',3,true],
      ['dessert','Desserts & Extras',4,true],['family','Family Deals',5,true],['offers','Special Offers',6,true]]},
    Products: {h: ['ProductID','Name','Category','Price','Description','ImageURL','Available','Featured','Published','Order'], bool: [7,8,9], rows: [
      ['P1','DEMO Chicken Pulao (1 Plate)','desi',250,'Fragrant homemade pulao with tender chicken.','',true,true,true,1],
      ['P2','DEMO Chicken Karahi (1 Plate)','desi',450,'Rich tomato-based karahi, cooked fresh.','',true,true,true,2],
      ['P3','DEMO Daal Chawal (1 Plate)','desi',180,'Comforting home-style daal with rice.','',true,false,true,3],
      ['P4','DEMO Frozen Samosa (12 pcs)','frozen',600,'Ready-to-fry crispy samosas.','',true,false,true,4],
      ['P5','DEMO Chicken Burger','fast',350,'Juicy crispy chicken with house sauce.','',true,false,true,5],
      ['P6','DEMO Lab-e-Shirin (Half Litre)','dessert',250,'Creamy traditional dessert.','',false,false,true,6]]},
    DailyMenu: {h: ['Date','Day','ProductID','Order'], bool: [], rows: dailyDemo_()},
    Deals: {h: ['DealID','Name','Type','Price','Description','ImageURL','Available','Published','Order'], bool: [7,8], rows: [
      ['D1','DEMO Family Deal (8-10 persons)','Family',3599,'Demo contents. Replace with your real deal.','',true,true,1],
      ['D2','DEMO Weekly Special','Special',999,'Demo offer. Replace with your real offer.','',true,true,2]]},
    Settings: {h: ['Key','Value'], bool: [], rows: [['demo',true],['whatsapp','923036481789']]}
  };
  Object.keys(S).forEach(function(name){
    var d = S[name], sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() > 0) return;                       // never overwrite existing data
    sh.getRange(1,1,1,d.h.length).setValues([d.h]).setFontWeight('bold').setBackground('#0b4f31').setFontColor('#ffffff');
    if (d.rows.length) sh.getRange(2,1,d.rows.length,d.h.length).setValues(d.rows);
    d.bool.forEach(function(c){ sh.getRange(2,c,499,1).insertCheckboxes(); });
    sh.setFrozenRows(1); sh.autoResizeColumns(1, d.h.length);
  });
  var cats = ss.getSheetByName('Categories');
  ss.getSheetByName('Products').getRange('C2:C500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(cats.getRange('A2:A50'), true).build());
  ss.getSheetByName('DailyMenu').getRange('B2:B500').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], true).build());
  var s1 = ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  SpreadsheetApp.getUi().alert('SAM² Kitchen sheets are ready. Next: Deploy as Web app.');
}

function dailyDemo_(){
  var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], ids = ['P1','P3','P4','P6'], out = [];
  days.forEach(function(d){ ids.forEach(function(p, i){ out.push(['', d, p, i + 1]); }); });
  return out;
}
