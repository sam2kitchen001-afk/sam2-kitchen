(()=>{const C=window.SAM2,$=s=>document.querySelector(s);let T=sessionStorage.getItem("sam2t")||"",DB=null,view="overview",q="",dk="Monday",sel=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const b=v=>v===true||/^(true|yes|y|1)$/i.test(String(v)),ord=a=>[...a].sort((x,y)=>(+x.Order||999)-(+y.Order||999));
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const E={Products:{k:"ProductID",l:"Product",p:"P",f:[["Name","text"],["Category","cat"],["Price","num"],["Description","area"],["ImageURL","url"]],fl:["Available","Featured","Published"]},
Deals:{k:"DealID",l:"Deal",p:"D",f:[["Name","text"],["Type","type"],["Price","num"],["Description","area"],["ImageURL","url"]],fl:["Available","Published"]},
Categories:{k:"CategoryID",l:"Category",p:"",f:[["Name","text"]],fl:["Active"]}};
function toast(m,bad){const t=$("#toast");t.textContent=m;t.className=bad?"bad show":"show";clearTimeout(toast.h);toast.h=setTimeout(()=>t.className="",2800)}
async function api(body){if(!C.API_URL){return{error:"API_URL is empty in js/config.js"}}
 try{const r=await fetch(C.API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({...body,token:T})});const d=await r.json();if(d.code==="auth")out();return d}catch(e){return{error:"Network problem. Please try again."}}}
async function refresh(){const d=await api({action:"list"});if(d.error){toast(d.error,1);return false}DB=d;return true}
function out(){T="";sessionStorage.removeItem("sam2t");$("#app").hidden=true;$("#login").hidden=false}
let Q=Promise.resolve(),pend=0,svT;
function sv(m){const e=$("#sv");if(!e)return;clearTimeout(svT);if(pend){e.textContent="Saving...";e.className="busy"}else if(m){e.textContent=m;e.className="";svT=setTimeout(()=>e.textContent="",2500)}else e.textContent=""}
function local(b){const t=b.tab,c=E[t];
 if(b.action==="upsert"){const r=b.record,id=String(r[c.k]);let row=DB[t].find(x=>String(x[c.k])===id);
  if(!row){row={Order:Math.max(0,...DB[t].map(x=>+x.Order||0))+1,Available:true,Published:true,Featured:false,Active:true,ImageURL:"",Description:""};DB[t].push(row)}
  Object.assign(row,r);["Price","Order"].forEach(k=>{if(k in r)row[k]=Number(r[k])})}
 else if(b.action==="remove"){DB[t]=DB[t].filter(x=>String(x[c.k])!==String(b.id));if(t!=="Categories")DB.DailyMenu=DB.DailyMenu.filter(x=>String(x.ProductID)!==String(b.id))}
 else if(b.action==="reorder"){b.ids.forEach((id,n)=>{const r=DB[t].find(x=>String(x[c.k])===String(id));if(r)r.Order=n+1})}
 else if(b.action==="setDaily"){const d=!!b.date,k=d?b.date:b.day;DB.DailyMenu=DB.DailyMenu.filter(r=>!(d?String(r.Date)===k:(!r.Date&&r.Day===k)));b.ids.forEach((id,n)=>DB.DailyMenu.push({Date:d?k:"",Day:d?"":k,ProductID:id,Order:n+1}))}
 else if(b.action==="setSetting"){let r=DB.Settings.find(x=>x.Key===b.key);if(!r){r={Key:b.key};DB.Settings.push(r)}r.Value=b.value}}
function act(body){local(body);render();pend++;sv();
 Q=Q.then(async()=>{const d=await api(body);pend--;if(d.error){toast(d.error,1);await refresh();render();sv()}else sv(pend?"":"Saved \u2713")});return true}
async function start(){$("#login").hidden=true;$("#app").hidden=false;$("#main").innerHTML="<p>Loading...</p>";if(!(await refresh())){out();return}render()}
$("#lf").onsubmit=async e=>{e.preventDefault();$("#lerr").textContent="";const bt=$("#lf .btn");bt.disabled=true;bt.textContent="Logging in...";const d=await api({action:"login",password:$("#pw").value});bt.disabled=false;bt.textContent="Log in";if(d.error){$("#lerr").textContent=d.error;return}T=d.token;sessionStorage.setItem("sam2t",T);$("#pw").value="";start()};
$("#lo").onclick=async()=>{await api({action:"logout"});out()};
$("#nav").onclick=e=>{const v=e.target.dataset.v;if(v){view=v;q="";sel=null;render()}};
function render(){document.querySelectorAll("#nav button").forEach(x=>x.classList.toggle("on",x.dataset.v===view));
 ({overview:ovw,Products:()=>list("Products"),Daily:daily,Categories:()=>list("Categories"),Deals:()=>list("Deals"),Settings:sets})[view]()}
const demoOn=()=>{const r=DB.Settings.find(x=>x.Key==="demo");return !r||b(r.Value)};
const nowKeys=()=>({day:new Date().toLocaleDateString("en-US",{timeZone:C.TZ,weekday:"long"}),iso:new Date().toLocaleDateString("en-CA",{timeZone:C.TZ})});
function ovw(){const P=DB.Products,{day,iso}=nowKeys(),dt=DB.DailyMenu.filter(r=>r.Date&&String(r.Date)===iso),tm=(dt.length?dt:DB.DailyMenu.filter(r=>!r.Date&&r.Day===day)).length,
 off=DB.Deals.filter(d=>b(d.Published)&&b(d.Available)).length,c=(n,l)=>`<div class="stat"><b>${n}</b>${l}</div>`;
 $("#main").innerHTML=`<h2>Overview</h2><div class="stats">${c(P.length,"Total products")}${c(P.filter(p=>b(p.Published)).length,"Active (published)")}${c(P.filter(p=>!b(p.Available)).length,"Unavailable")}${c(DB.Categories.length,"Categories")}${c(tm,"In today's menu")}${c(off,"Active offers")}</div>`+(demoOn()?'<div class="note">Demo mode is ON: customers see a "Demo data" banner. Turn it off in Settings once your real menu is entered.</div>':"")}
function list(tab){const c=E[tab],all=ord(DB[tab]),rows=all.filter(r=>!q||String(r.Name).toLowerCase().includes(q.toLowerCase()));
 $("#main").innerHTML=`<div class="top"><h2>${tab}</h2><button class="btn" data-a="add">+ Add ${c.l}</button></div>`+(tab!=="Categories"?`<input id="sq" placeholder="Search..." value="${esc(q)}">`:"")+
 (rows.map(r=>{const id=esc(r[c.k]),img=/^https:/.test(r.ImageURL||"")?`<img loading="lazy" src="${esc(r.ImageURL)}" alt="">`:"";
 return `<div class="row" data-id="${id}">${tab!=="Categories"?`<div class="th">${img}</div>`:""}<div class="info"><b>${esc(r.Name)}</b><small>${tab==="Categories"?id:(tab==="Deals"?esc(r.Type):esc((DB.Categories.find(x=>x.CategoryID===r.Category)||{}).Name||r.Category))+" · Rs. "+esc(r.Price)}</small></div>
 ${c.fl.map(f=>`<button class="chip${b(r[f])?" on":""}" data-a="flag" data-f="${f}">${f}</button>`).join("")}
 <div class="acts"><button data-a="up" title="Move up">↑</button><button data-a="dn" title="Move down">↓</button><button data-a="edit">Edit</button><button data-a="del">Delete</button></div></div>`}).join("")||'<p>Nothing here yet.</p>');
 const s=$("#sq");if(s)s.oninput=e=>{q=e.target.value;const p=e.target.selectionStart;list(tab);const n=$("#sq");n.focus();n.setSelectionRange(p,p)}}
$("#main").onclick=async e=>{const a=e.target.dataset.a;if(!a)return;const tab=view,c=E[tab],row=e.target.closest(".row"),id=row&&row.dataset.id;
 if(a==="add")return form(tab,"");if(a==="edit")return form(tab,id);
 if(a==="flag"){const r=DB[tab].find(x=>String(x[c.k])===id);return act({action:"upsert",tab,record:{[c.k]:id,[e.target.dataset.f]:!b(r[e.target.dataset.f])}})}
 if(a==="del"){if(tab==="Categories"&&DB.Products.some(p=>String(p.Category)===id)){toast("This category still has products. Move or delete them first.",1);return}if(!confirm("Delete this item? This cannot be undone."))return;return act({action:"remove",tab,id})}
 if(a==="up"||a==="dn"){const ids=ord(DB[tab]).map(x=>String(x[c.k])),i=ids.indexOf(id),j=a==="up"?i-1:i+1;if(j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];return act({action:"reorder",tab,ids})}
 if(a==="dsv")return act({action:"setDaily",[/^\d{4}/.test(dk)?"date":"day"]:dk,ids:[...sel]});
 if(a==="dadd"){sel.push(e.target.dataset.i);return daily()}if(a==="drm"){sel=sel.filter(x=>x!==e.target.dataset.i);return daily()}
 if(a==="dup"||a==="ddn"){const i=sel.indexOf(e.target.dataset.i),j=a==="dup"?i-1:i+1;if(j<0||j>=sel.length)return;[sel[i],sel[j]]=[sel[j],sel[i]];return daily()}};
function newId(tab,name){const c=E[tab],ids=DB[tab].map(x=>String(x[c.k]));if(tab==="Categories"){let s=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24)||"cat",n=s,i=2;while(ids.includes(n))n=s+"-"+i++;return n}
 return c.p+(Math.max(0,...ids.map(x=>parseInt(x.slice(1))||0))+1)}
function form(tab,id){const c=E[tab],r=id?DB[tab].find(x=>String(x[c.k])===id):{},fld=([n,t])=>{const v=esc(r[n]??"");
 const inp=t==="cat"?`<select name="${n}">${DB.Categories.map(x=>`<option value="${esc(x.CategoryID)}"${x.CategoryID===r[n]?" selected":""}>${esc(x.Name)}</option>`).join("")}</select>`
 :t==="type"?`<select name="${n}">${["Family","Daily","Special"].map(x=>`<option${x===r[n]?" selected":""}>${x}</option>`).join("")}</select>`
 :t==="area"?`<textarea name="${n}" maxlength="300">${v}</textarea>`:t==="url"?`<input name="${n}" type="url" placeholder="https://..." value="${v}"><img class="pv" alt="" ${/^https:/.test(r[n]||"")?`src="${v}"`:"hidden"}><input type="file" accept="image/jpeg,image/png,image/webp" id="up" hidden><div class="acts"><button type="button" class="btn" data-x="up">${r[n]?"Replace photo":"Upload photo"}</button><button type="button" class="btn sec" data-x="rmimg">Remove image</button></div><small class="ust"></small>`
 :`<input name="${n}" type="${t==="num"?"number":"text"}" ${t==="num"?'min="0" step="any"':'maxlength="80"'} value="${v}" required>`;
 return `<label>${n==="ImageURL"?"Image link":n}${inp}</label>`};
 $("#dlg").innerHTML=`<form class="f" method="dialog"><h2>${id?"Edit":"Add"} ${c.l}</h2>${c.f.map(fld).join("")}<div class="flags">${c.fl.map(f=>`<label><input type="checkbox" name="${f}"${(id?b(r[f]):f!=="Featured")?" checked":""}>${f}</label>`).join("")}</div>
 <div class="top"><button type="button" class="btn sec" data-x="cancel">Cancel</button><button class="btn" value="ok">Save</button></div></form>`;
 const d=$("#dlg"),f=d.querySelector("form");d.showModal();
 d.onclick=e=>{const x=e.target.dataset.x;if(x==="cancel")d.close();if(x==="up")d.querySelector("#up").click();if(x==="rmimg"){f.ImageURL.value="";f.querySelector(".pv").hidden=true;f.querySelector(".ust").textContent="Image removed. Click Save.";f.querySelector("[data-x=up]").textContent="Upload photo"}};
 const up=d.querySelector("#up");if(up)up.onchange=()=>{if(up.files[0])upload(up.files[0],f);up.value=""};
 const u=f.ImageURL;if(u){const p=f.querySelector(".pv"),m=f.querySelector(".ust");p.onerror=()=>{p.hidden=true;m.textContent="This link did not open as a picture. Use Upload photo, or a direct image link (ends with .jpg, .png or .webp)."};p.onload=()=>{m.textContent=""};u.oninput=()=>{m.textContent="";p.hidden=!/^https:/.test(u.value);if(!p.hidden)p.src=u.value}}
 f.onsubmit=e=>{e.preventDefault();const rec={[c.k]:id||newId(tab,f.Name.value)};c.f.forEach(([n])=>rec[n]=f[n].value);c.fl.forEach(n=>rec[n]=f[n].checked);
  if(rec.Name!==undefined&&!String(rec.Name).trim()){toast("Name is required",1);return}
  if("Price" in rec&&(rec.Price===""||isNaN(+rec.Price)||+rec.Price<0)){toast("Enter a valid price",1);return}
  if(rec.ImageURL&&!/^https:\/\//i.test(rec.ImageURL)){toast("Image link must start with https://",1);return}
  act({action:"upsert",tab,record:rec});d.close()}}
async function upload(file,f){const st=f.querySelector(".ust");
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)){toast("Please choose a JPG, PNG or WebP photo",1);return}
 if(file.size>15e6){toast("Photo is too large (max 15 MB)",1);return}
 try{st.textContent="Preparing photo...";
  const bmp=await createImageBitmap(file,{imageOrientation:"from-image"}),k=Math.min(1,1200/Math.max(bmp.width,bmp.height)),cv=document.createElement("canvas");
  cv.width=Math.round(bmp.width*k);cv.height=Math.round(bmp.height*k);const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);x.drawImage(bmp,0,0,cv.width,cv.height);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.85));
  st.textContent="Uploading...";const s=await api({action:"signUpload"});if(s.error)throw new Error(s.error);
  const fd=new FormData();fd.append("file",blob,"photo.jpg");fd.append("api_key",s.apiKey);fd.append("timestamp",s.timestamp);fd.append("folder",s.folder);fd.append("allowed_formats",s.allowed_formats);fd.append("signature",s.signature);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(s.cloudName)}/image/upload`,{method:"POST",body:fd}),j=await r.json();
  if(!r.ok||!j.secure_url)throw new Error((j.error&&j.error.message)||"Upload failed");
  const url=j.secure_url.replace("/upload/","/upload/f_auto,q_auto,c_limit,w_900/");f.ImageURL.value=url;const pv=f.querySelector(".pv");pv.src=url;pv.hidden=false;
  f.querySelector("[data-x=up]").textContent="Replace photo";st.textContent="Photo uploaded. Click Save to publish it."}
 catch(e){st.textContent="";toast(e.message||"Upload failed",1)}}
function daily(){const {iso}=nowKeys(),isD=/^\d{4}/.test(dk),items=[...DB.Products,...DB.Deals].filter(x=>b(x.Published)).map(x=>({id:String(x.ProductID||x.DealID),n:x.Name}));
 if(!sel)sel=ord(DB.DailyMenu.filter(r=>isD?String(r.Date)===dk:(!r.Date&&r.Day===dk))).map(r=>String(r.ProductID));
 const nm=i=>(items.find(x=>x.id===i)||{n:i+" (hidden)"}).n;
 $("#main").innerHTML=`<h2>Daily Menu</h2><div class="two"><label>Day (repeats weekly) or a specific date<select id="dk">${DAYS.map(d=>`<option${d===dk?" selected":""}>${d}</option>`).join("")}<option value="date"${isD?" selected":""}>Specific date...</option></select></label>${isD?`<label>Date<input id="dd" type="date" value="${dk}"></label>`:""}</div>
 <h3>On the menu (${sel.length})</h3>${sel.map(i=>`<div class="row"><div class="info">${esc(nm(i))}</div><div class="acts"><button data-a="dup" data-i="${esc(i)}">↑</button><button data-a="ddn" data-i="${esc(i)}">↓</button><button data-a="drm" data-i="${esc(i)}">Remove</button></div></div>`).join("")||"<p>Nothing selected.</p>"}
 <h3>Add items</h3>${items.filter(x=>!sel.includes(x.id)).map(x=>`<div class="row"><div class="info">${esc(x.n)}</div><button class="btn sec" data-a="dadd" data-i="${esc(x.id)}">+ Add</button></div>`).join("")}
 <p><button class="btn" data-a="dsv">Save Daily Menu</button></p>`;
 $("#dk").onchange=e=>{dk=e.target.value==="date"?iso:e.target.value;sel=null;daily()};const dd=$("#dd");if(dd)dd.onchange=e=>{if(e.target.value){dk=e.target.value;sel=null;daily()}}}
function sets(){$("#main").innerHTML=`<h2>Settings</h2><div class="row"><div class="info"><b>Demo mode</b><small>Shows a "Demo data" banner on the website. Turn off when your real menu is ready.</small></div><button class="chip${demoOn()?" on":""}" id="dm">${demoOn()?"ON":"OFF"}</button></div>
 <div class="note">Admin password is stored in Google Script Properties (ADMIN_PASSWORD). Change it there; it is never saved in this website.</div>`;
 $("#dm").onclick=()=>act({action:"setSetting",key:"demo",value:!demoOn()})}
if(T)start();})();
