// Marboua Social Pro UI v27 — UI/navigation presentation only.
(()=>{
  const root=document.documentElement;
  const saved=localStorage.getItem('marboua-theme')||'dark';
  root.dataset.theme=saved;

  function ensureFinalCss(){
    if(document.getElementById('mqFinalCss'))return;
    const l=document.createElement('link');l.id='mqFinalCss';l.rel='stylesheet';l.href='./social-pro-ui.css?v=27';document.head.appendChild(l);
  }

  function themeButton(){
    if(document.getElementById('mqThemeBtn'))return;
    const b=document.createElement('button');b.id='mqThemeBtn';b.type='button';b.title='الوضع الفاتح / الداكن';
    const paint=()=>{b.innerHTML=root.dataset.theme==='light'?'🌙':'☀️';b.setAttribute('aria-label',root.dataset.theme==='light'?'الوضع الداكن':'الوضع الفاتح')};paint();
    b.onclick=()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';localStorage.setItem('marboua-theme',root.dataset.theme);paint()};
    document.body.appendChild(b);
  }

  const roleFor=(b)=>{
    const oc=b.getAttribute('onclick')||'',txt=(b.textContent||'').trim();
    if(b.id==='feedBtn'||oc.includes("socialFeed"))return['home','⌂','الرئيسية'];
    if(b.id==='notifBtn')return['notifications','♢','الإشعارات'];
    if(b.id==='globalSearchBtn')return['search','⌕','بحث'];
    if(b.id==='requestsBtn'||txt.startsWith('طلبات'))return['requests','✉','الطلبات'];
    if(txt.includes('البلوك'))return['blocked','⊘','المحظورون'];
    if(oc.includes("'discover'"))return['discover','◎','استكشاف'];
    if(oc.includes("'chats'"))return['chats','☏','الدردشات'];
    if(oc.includes("'groups'"))return['groups','♧','المجموعات'];
    if(oc.includes("'calls'"))return['calls','☎','المكالمات'];
    if(oc.includes("'invites'"))return['invites','◇','الدعوات'];
    if(oc.includes("'me'"))return['me','◉','حسابي'];
    if(oc.includes('logout'))return['logout','↪','خروج'];
    return null;
  };

  function decorateNav(){
    const nav=document.querySelector('.nav');if(!nav)return;
    nav.querySelectorAll(':scope > button').forEach(b=>{
      const r=roleFor(b);if(!r)return;const[role,icon,label]=r;b.dataset.uiRole=role;b.dataset.uiLabel=label;
      if(!b.querySelector('.mqNavIcon')){const i=document.createElement('span');i.className='mqNavIcon';i.textContent=icon;b.prepend(i)}
      let lab=b.querySelector('.mqNavLabel');if(!lab){lab=document.createElement('span');lab.className='mqNavLabel';b.appendChild(lab)}lab.textContent=label;
      // hide original naked text nodes so dynamic counts don't create button layout chaos
      [...b.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.textContent='');
    });
  }

  function ensureMore(){
    if(document.getElementById('mqMoreBtn'))return;
    const b=document.createElement('button');b.id='mqMoreBtn';b.type='button';b.innerHTML='☰';b.setAttribute('aria-label','المزيد');document.body.appendChild(b);
    const d=document.createElement('div');d.id='mqMoreDrawer';d.innerHTML='<div class="mqDrawerHead"><b>مربوعة</b><button id="mqMoreClose">×</button></div><div id="mqMoreItems"></div>';document.body.appendChild(d);
    b.onclick=()=>{syncMore();d.classList.add('open')};d.querySelector('#mqMoreClose').onclick=()=>d.classList.remove('open');
  }

  function syncMore(){
    const host=document.getElementById('mqMoreItems'),nav=document.querySelector('.nav');if(!host||!nav)return;host.innerHTML='';
    const keep=new Set(['home','chats','groups','notifications','me']);
    nav.querySelectorAll(':scope > button[data-ui-role]').forEach(orig=>{if(keep.has(orig.dataset.uiRole))return;const c=document.createElement('button');c.className='mqDrawerItem';c.innerHTML=`<span>${orig.querySelector('.mqNavIcon')?.textContent||'•'}</span><b>${orig.dataset.uiLabel||''}</b>`;c.onclick=()=>{orig.click();document.getElementById('mqMoreDrawer')?.classList.remove('open')};host.appendChild(c)});
  }

  function hookShow(){
    if(typeof window.show!=='function'||window.show.__mq)return;
    const old=window.show;function wrapped(id,btn){document.body.classList.toggle('mq-chat-focus',id==='chats');const r=old.apply(this,arguments);setTimeout(decorateNav,30);return r}wrapped.__mq=true;window.show=wrapped;
  }

  function defaultHome(){
    if(sessionStorage.getItem('mq-home-opened'))return;
    const main=document.getElementById('main'),feed=document.getElementById('feedBtn');
    if(main&&!main.classList.contains('hide')&&feed){sessionStorage.setItem('mq-home-opened','1');feed.click()}
  }

  function compactDebug(){
    const bar=document.getElementById('shbDbgBar');if(bar){bar.classList.add('mqDbgCompact');const o=document.getElementById('shbDbgOpen');if(o)o.textContent='DBG'}
    const cb=document.getElementById('marbDbgBtn');if(cb){cb.classList.add('mqCallDbgCompact');cb.textContent='☎ DBG'}
  }

  function tick(){decorateNav();hookShow();defaultHome();compactDebug();}
  document.addEventListener('DOMContentLoaded',()=>{ensureFinalCss();themeButton();ensureMore();tick()});
  let n=0;const t=setInterval(()=>{tick();if(++n>120)clearInterval(t)},250);
})();