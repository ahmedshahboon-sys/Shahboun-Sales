// Marboua Social Pro UI — UI behavior only; no application/business logic changes.
(()=>{
 const root=document.documentElement;
 const saved=localStorage.getItem('marboua-theme')||'dark';
 root.dataset.theme=saved;
 const b=document.createElement('button'); b.id='mqThemeBtn'; b.type='button'; b.title='الوضع الفاتح / الداكن';
 const paint=()=>b.textContent=root.dataset.theme==='light'?'🌙':'☀️'; paint();
 b.onclick=()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';localStorage.setItem('marboua-theme',root.dataset.theme);paint()};
 document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(b));
 // Keep existing show() behavior, only add a CSS state so chat can expand when selected.
 const hook=()=>{if(typeof window.show!=='function')return;const old=window.show;if(old.__mq)return;function wrapped(id,btn){document.body.classList.toggle('mq-chat-focus',id==='chats');return old.apply(this,arguments)}wrapped.__mq=true;window.show=wrapped};
 let n=0;const t=setInterval(()=>{hook();if(++n>40)clearInterval(t)},250);
})();
