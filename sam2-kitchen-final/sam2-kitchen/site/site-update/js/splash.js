(function(){var d=document.documentElement,force=/[?&]splash\b/.test(location.search);
try{if(!force&&(sessionStorage.getItem("sam2s")||matchMedia("(prefers-reduced-motion: reduce)").matches))d.classList.add("no-splash");else sessionStorage.setItem("sam2s","1")}catch(e){}
document.addEventListener("DOMContentLoaded",function(){var s=document.getElementById("splash");if(!s)return;
function rm(){if(s.parentNode)s.parentNode.removeChild(s)}
s.addEventListener("click",function(){s.classList.add("skip");setTimeout(rm,300)});setTimeout(rm,3200)})})();
