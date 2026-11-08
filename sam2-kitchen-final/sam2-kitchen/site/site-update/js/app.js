(()=>{const C=window.SAM2,$=s=>document.querySelector(s);let D,cat="all",q="";
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const im=(u,w)=>u.replace("/upload/f_auto,q_auto,c_limit,w_900/","/upload/f_auto,q_auto,c_limit,w_"+w+"/");
const wa=(t)=>`https://wa.me/${C.WA}?text=${encodeURIComponent(t)}`;
const fmt=n=>"Rs. "+Number(n).toLocaleString("en-PK");
async function load(){const key="sam2menu",now=Date.now();let c=null;
 try{c=JSON.parse(localStorage.getItem(key)||"null")}catch(e){}
 if(c&&now-c.t<C.CACHE_SECONDS*1e3)return c.d;
 try{const r=await fetch(C.API_URL?C.API_URL+"?action=menu":"data/demo-menu.json");if(!r.ok)throw 0;const d=await r.json();if(d.error||!d.products)throw 0;
  try{localStorage.setItem(key,JSON.stringify({t:now,d}))}catch(e){}return d}
 catch(e){if(c)return c.d;throw e}}
function card(p,big){const ok=p.available,msg=`Assalam o Alaikum! I'd like to order: ${p.name} (${fmt(p.price)}) from Sam² Kitchen.`;
 return `<article class="card${big?" big":""}"><div class="ph">${p.image?`<img loading="lazy" src="${esc(im(p.image,big?900:480))}" alt="${esc(p.name)}">`:"Photo coming soon"}</div><div class="cb">
 ${p.featured?'<span class="tag feat">★ Featured</span>':""}<h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="price">${fmt(p.price)}</div>
 <span class="tag ${ok?"in":"out"}">${ok?"Available":"Unavailable"}</span>
 ${ok?`<a class="btn btn-wa" target="_blank" rel="noopener" href="${wa(msg)}">Order on WhatsApp</a>`:'<button class="btn" disabled>Unavailable</button>'}</div></article>`}
const byOrder=(a,b)=>a.order-b.order;
function today(){const now=new Date(),o={timeZone:C.TZ},day=now.toLocaleDateString("en-US",{...o,weekday:"long"}),
 iso=now.toLocaleDateString("en-CA",o),pretty=now.toLocaleDateString("en-GB",{...o,weekday:"long",day:"numeric",month:"long",year:"numeric"});
 $("#todayDate").textContent=pretty;
 const ids=D.dailyMenu.filter(m=>m.date?m.date===iso:m.day===day).sort(byOrder).map(m=>m.productId);
 const items=ids.map(i=>D.products.find(p=>p.id===i&&p.published)).filter(Boolean);
 $("#todayGrid").innerHTML=items.length?items.map(p=>card(p)).join(""):'<div class="empty" style="grid-column:1/-1"><h3>Today\'s menu is being prepared</h3><p>Please check back shortly or message us on WhatsApp to ask what\'s fresh today.</p></div>'}
function chips(){const cs=D.categories.filter(c=>c.active).sort(byOrder);
 $("#chips").innerHTML=[{id:"all",name:"All"},...cs].map(c=>`<button class="chip${c.id===cat?" on":""}" data-c="${esc(c.id)}">${esc(c.name)}</button>`).join("")}
function list(){const ql=q.toLowerCase(),act=new Set(D.categories.filter(c=>c.active).map(c=>c.id));
 const r=D.products.filter(p=>p.published&&act.has(p.category)&&(cat==="all"||p.category===cat)&&(p.name+p.description).toLowerCase().includes(ql)).sort((a,b)=>b.featured-a.featured||a.order-b.order);
 $("#list").innerHTML=r.length?r.map(p=>card(p,p.featured)).join(""):'<div class="empty" style="grid-column:1/-1">No items found. Try another search or category.</div>'}
function bind(){$("#chips").onclick=e=>{const b=e.target.closest(".chip");if(b){cat=b.dataset.c;chips();list()}};
 $("#q").oninput=e=>{q=e.target.value;list()};
 document.querySelectorAll("[data-cat]").forEach(a=>a.onclick=()=>{cat=a.dataset.cat;chips();list();$("#nav").classList.remove("open")});
 $("#burger").onclick=()=>$("#nav").classList.toggle("open");
 document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>$("#nav").classList.remove("open")))}
document.querySelectorAll("[data-wa]").forEach(a=>{a.href=wa("Assalam o Alaikum! I'd like to place an order from Sam² Kitchen.");a.target="_blank";a.rel="noopener"});
document.getElementById("yr").textContent=new Date().getFullYear();
load().then(d=>{D=d;if(d.settings&&d.settings.demo)$("#demo").hidden=false;today();chips();list();bind()})
.catch(()=>{const m='<div class="empty" style="grid-column:1/-1">We couldn\'t load the menu right now. Please refresh, or order directly on WhatsApp.</div>';$("#todayGrid").innerHTML=m;$("#list").innerHTML=m})})();
