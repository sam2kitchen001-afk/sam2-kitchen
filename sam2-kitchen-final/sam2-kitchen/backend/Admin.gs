/** SAM² Kitchen admin API (Phase 3). Every write needs a login token. Password lives in Script Properties, never in code. */
var ADMIN_SCHEMA_ = {
  Products:   {key:'ProductID',  f:{ProductID:'id',Name:'s80',Category:'id',Price:'num',Description:'s300',ImageURL:'url',Available:'b',Featured:'b',Published:'b',Order:'num'}},
  Categories: {key:'CategoryID', f:{CategoryID:'id',Name:'s80',Order:'num',Active:'b'}},
  Deals:      {key:'DealID',     f:{DealID:'id',Name:'s80',Type:'type',Price:'num',Description:'s300',ImageURL:'url',Available:'b',Published:'b',Order:'num'}}
};
var TOKEN_TTL_ = 21600, MAX_FAILS_ = 5;

function doPost(e){
  var res;
  try { res = handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { res = {error: 'Request failed. Please try again.'}; }
  return json_(res);
}

function handle_(r){
  if (r.action === 'login') return login_(r.password);
  if (!checkToken_(r.token)) return {error: 'Please log in again.', code: 'auth'};
  if (r.action === 'logout') { CacheService.getScriptCache().remove('tok_' + r.token); return {ok: true}; }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var out;
    switch (r.action) {
      case 'list': return listAll_();
      case 'upsert': out = upsert_(r.tab, r.record || {}); break;
      case 'remove': out = remove_(r.tab, r.id); break;
      case 'reorder': out = reorder_(r.tab, r.ids); break;
      case 'setDaily': out = setDaily_(r); break;
      case 'setSetting': out = setSetting_(r.key, r.value); break;
      case 'signUpload': return signUpload_();
      default: out = {error: 'Unknown action'};
    }
    if (out && out.ok) clearMenuCache();
    return out;
  } finally { lock.releaseLock(); }
}

/* ---------- auth ---------- */
function safeEq_(a, b){
  var n = Math.max(a.length, b.length), d = a.length ^ b.length;
  for (var i = 0; i < n; i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
function login_(pw){
  var c = CacheService.getScriptCache();
  if (Number(c.get('fails') || 0) >= MAX_FAILS_) return {error: 'Too many wrong attempts. Try again in 15 minutes.'};
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!real || real.length < 8) return {error: 'Admin password is not set up yet (see SETUP-ADMIN.md).'};
  if (!safeEq_(String(pw || ''), real)) { c.put('fails', String(Number(c.get('fails') || 0) + 1), 900); return {error: 'Wrong password.'}; }
  c.remove('fails');
  var t = Utilities.getUuid() + Utilities.getUuid();
  c.put('tok_' + t, '1', TOKEN_TTL_);
  return {ok: true, token: t};
}
function checkToken_(t){ return typeof t === 'string' && t.length > 40 && CacheService.getScriptCache().get('tok_' + t) === '1'; }

/* ---------- validation ---------- */
function clean_(t, v){
  if (t === 'b') return {v: toBool_(v)};
  if (t === 'num') { var n = Number(v); if (v === '' || v === null || isNaN(n) || n < 0 || n > 10000000) return {err: 'must be a valid number'}; return {v: n}; }
  var s = str_(v);
  if (t === 'id') return /^[A-Za-z0-9_-]{1,30}$/.test(s) ? {v: s} : {err: 'use letters, numbers, - or _ only'};
  if (t === 'type') return ['Family','Daily','Special'].indexOf(s) >= 0 ? {v: s} : {err: 'invalid type'};
  if (t === 'url') return (s === '' || /^https:\/\/[^\s]{1,1000}$/.test(s)) ? {v: s} : {err: 'link must start with https://'};
  s = s.replace(/^[=+\-@\s]+/, '');                       // blocks spreadsheet formula injection
  return s.length <= (t === 's80' ? 80 : 300) ? {v: s} : {err: 'too long'};
}

/* ---------- sheet helpers ---------- */
function sheetData_(name){
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('Missing tab ' + name);
  var v = sh.getDataRange().getValues();
  return {sh: sh, v: v, h: v[0].map(function(x){ return String(x).trim(); })};
}
function col_(h, n){ var i = h.indexOf(n); if (i < 0) throw new Error('Missing column ' + n); return i; }
function normCell_(c){ return c instanceof Date ? Utilities.formatDate(c, TZ, 'yyyy-MM-dd') : str_(c); }
function findRow_(d, kc, id){ for (var i = 1; i < d.v.length; i++) if (str_(d.v[i][kc]) === id) return i + 1; return 0; }
function emptySlots_(d, kc, count){
  var out = [];
  for (var i = 1; i < d.v.length && out.length < count; i++) if (str_(d.v[i][kc]) === '') out.push(i + 1);
  var next = d.v.length + 1; while (out.length < count) out.push(next++);
  return out;
}
function writeRow_(d, row, obj){ d.sh.getRange(row, 1, 1, d.h.length).setValues([d.h.map(function(n){ return obj.hasOwnProperty(n) ? obj[n] : ''; })]); }
function idExists_(tab, id){ var sc = ADMIN_SCHEMA_[tab], d = sheetData_(tab); return findRow_(d, col_(d.h, sc.key), id) > 0; }

/* ---------- actions ---------- */
function listAll_(){
  var ss = SpreadsheetApp.getActiveSpreadsheet(), o = {};
  TABS.forEach(function(n){ o[n] = readTab_(ss.getSheetByName(n)); });
  return o;
}

function upsert_(tab, rec){
  var sc = ADMIN_SCHEMA_[tab]; if (!sc) return {error: 'Unknown section'};
  var c = {}, k;
  for (k in sc.f) if (rec.hasOwnProperty(k)) { var r = clean_(sc.f[k], rec[k]); if (r.err) return {error: k + ': ' + r.err}; c[k] = r.v; }
  var id = c[sc.key]; if (!id) return {error: 'ID is required'};
  if (tab === 'Products' && c.Category !== undefined && !idExists_('Categories', c.Category)) return {error: 'Category does not exist'};
  var d = sheetData_(tab), kc = col_(d.h, sc.key), oc = col_(d.h, 'Order'), row = findRow_(d, kc, id), obj = {};
  if (row) { d.h.forEach(function(n, j){ obj[n] = d.v[row - 1][j]; }); }
  else {
    if (!c.Name) return {error: 'Name is required'};
    if (sc.f.Price && c.Price === undefined) return {error: 'Price is required'};
    var max = 0; for (var i = 1; i < d.v.length; i++) if (str_(d.v[i][kc]) !== '') max = Math.max(max, Number(d.v[i][oc]) || 0);
    obj = {Order: max + 1, Available: true, Published: true, Featured: false, Active: true, ImageURL: '', Description: ''};
    row = emptySlots_(d, kc, 1)[0];
  }
  for (k in c) obj[k] = c[k];
  writeRow_(d, row, obj);
  return {ok: true, id: id};
}

function remove_(tab, id){
  var sc = ADMIN_SCHEMA_[tab]; if (!sc) return {error: 'Unknown section'};
  id = str_(id);
  if (tab === 'Categories') {
    var p = sheetData_('Products'), pc = col_(p.h, 'Category');
    for (var i = 1; i < p.v.length; i++) if (str_(p.v[i][pc]) === id) return {error: 'This category still has products. Move or delete them first.'};
  }
  var d = sheetData_(tab), row = findRow_(d, col_(d.h, sc.key), id);
  if (!row) return {error: 'Item not found'};
  d.sh.getRange(row, 1, 1, d.h.length).clearContent();
  if (tab !== 'Categories') clearDaily_(function(r){ return r.pid === id; });
  return {ok: true};
}

function clearDaily_(match){
  var d = sheetData_('DailyMenu'), dc = col_(d.h, 'Date'), yc = col_(d.h, 'Day'), pc = col_(d.h, 'ProductID');
  for (var i = 1; i < d.v.length; i++) {
    var rr = {date: normCell_(d.v[i][dc]), day: str_(d.v[i][yc]), pid: str_(d.v[i][pc])};
    if (rr.pid && match(rr)) d.sh.getRange(i + 1, 1, 1, d.h.length).clearContent();
  }
}

function reorder_(tab, ids){
  var sc = ADMIN_SCHEMA_[tab]; if (!sc || !Array.isArray(ids)) return {error: 'Bad request'};
  var d = sheetData_(tab), kc = col_(d.h, sc.key), oc = col_(d.h, 'Order');
  ids.forEach(function(id, n){ var row = findRow_(d, kc, str_(id)); if (row) d.sh.getRange(row, oc + 1).setValue(n + 1); });
  return {ok: true};
}

function setDaily_(r){
  var date = str_(r.date), day = dayName_(r.day), ids = r.ids;
  if (!Array.isArray(ids) || ids.length > 40 || (!/^\d{4}-\d{2}-\d{2}$/.test(date) && !day)) return {error: 'Choose a day or date'};
  for (var i = 0; i < ids.length; i++) {
    var id = str_(ids[i]);
    if (!idExists_('Products', id) && !idExists_('Deals', id)) return {error: 'Unknown item: ' + id};
  }
  var isDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  clearDaily_(function(x){ return isDate ? x.date === date : (x.date === '' && x.day === day); });
  var d = sheetData_('DailyMenu'), pc = col_(d.h, 'ProductID'), slots = emptySlots_(d, pc, ids.length);
  ids.forEach(function(id, n){ writeRow_(d, slots[n], {Date: isDate ? date : '', Day: isDate ? '' : day, ProductID: str_(id), Order: n + 1}); });
  return {ok: true};
}

function setSetting_(key, value){
  if (key !== 'demo') return {error: 'This setting cannot be changed here'};
  var d = sheetData_('Settings'), kc = col_(d.h, 'Key'), vc = col_(d.h, 'Value'), row = findRow_(d, kc, 'demo');
  if (!row) row = emptySlots_(d, kc, 1)[0];
  writeRow_(d, row, {Key: 'demo', Value: toBool_(value)});
  return {ok: true};
}

/* ---------- Cloudinary signed upload (Phase 4). The API secret never leaves Google. ---------- */
function sha1hex_(s){
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, s, Utilities.Charset.UTF_8)
    .map(function(b){ return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2); }).join('');
}
function signUpload_(){
  var p = PropertiesService.getScriptProperties(), cloud = p.getProperty('CLOUDINARY_CLOUD_NAME'),
      key = p.getProperty('CLOUDINARY_API_KEY'), secret = p.getProperty('CLOUDINARY_API_SECRET');
  if (!cloud || !key || !secret) return {error: 'Photo upload is not set up yet (see SETUP-CLOUDINARY.md).'};
  var c = CacheService.getScriptCache(), ck = 'signs_' + Math.floor(Date.now() / 3600000), n = Number(c.get(ck) || 0);
  if (n >= 60) return {error: 'Upload limit reached for this hour. Please try later.'};
  c.put(ck, String(n + 1), 3600);
  var ts = Math.floor(Date.now() / 1000), folder = 'sam2kitchen', fmts = 'jpg,jpeg,png,webp';
  return {cloudName: cloud, apiKey: key, timestamp: ts, folder: folder, allowed_formats: fmts,
          signature: sha1hex_('allowed_formats=' + fmts + '&folder=' + folder + '&timestamp=' + ts + secret)};
}
