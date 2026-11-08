/** Pure helpers: no Google services used here, so they can be unit-tested. */
var DAYS_ = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
var DEAL_TYPE_ = {family:'family', special:'offers', daily:'offers'};

function toBool_(v){ return v === true || /^(true|yes|y|1)$/i.test(String(v).trim()); }
function toNum_(v, d){
  var s = String(v === null || v === undefined ? '' : v).trim();
  if (s === '') return d || 0;
  var m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : (d || 0);
}
function str_(v){ return String(v === null || v === undefined ? '' : v).trim(); }
function safeImg_(v){ var u = str_(v); return /^https:\/\//i.test(u) ? u : ''; }
function dayName_(v){
  var s = str_(v).toLowerCase();
  for (var i = 0; i < DAYS_.length; i++) if (DAYS_[i].toLowerCase() === s) return DAYS_[i];
  return '';
}

function buildMenu_(raw, nowIso){
  var categories = (raw.Categories || []).map(function(r, i){
    return {id: str_(r.CategoryID), name: str_(r.Name), order: toNum_(r.Order, i + 1), active: toBool_(r.Active)};
  }).filter(function(c){ return c.id && c.name; });

  var seen = {}, products = [];
  function add(p){ if (p.id && p.name && !seen[p.id]) { seen[p.id] = 1; products.push(p); } }

  (raw.Products || []).forEach(function(r, i){
    if (!toBool_(r.Published)) return;
    add({id: str_(r.ProductID), name: str_(r.Name), category: str_(r.Category), price: toNum_(r.Price),
         description: str_(r.Description), image: safeImg_(r.ImageURL), available: toBool_(r.Available),
         featured: toBool_(r.Featured), published: true, order: toNum_(r.Order, i + 1)});
  });
  (raw.Deals || []).forEach(function(r, i){
    if (!toBool_(r.Published)) return;
    var cat = DEAL_TYPE_[str_(r.Type).toLowerCase()] || 'offers';
    add({id: str_(r.DealID), name: str_(r.Name), category: cat, price: toNum_(r.Price),
         description: str_(r.Description), image: safeImg_(r.ImageURL), available: toBool_(r.Available),
         featured: false, published: true, order: 1000 + toNum_(r.Order, i + 1)});
  });

  var daily = (raw.DailyMenu || []).map(function(r, i){
    var e = {productId: str_(r.ProductID), order: toNum_(r.Order, i + 1)};
    var date = str_(r.Date);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) e.date = date; else e.day = dayName_(r.Day);
    return e;
  }).filter(function(e){ return e.productId && (e.date || e.day); });

  var settings = {demo: true};
  (raw.Settings || []).forEach(function(r){
    var k = str_(r.Key); if (!k) return;
    settings[k] = (k === 'demo') ? toBool_(r.Value) : str_(r.Value);
  });

  return {settings: settings, categories: categories, products: products, dailyMenu: daily, generatedAt: nowIso || ''};
}
