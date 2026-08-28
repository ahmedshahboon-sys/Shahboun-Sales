// Marboua Social Pro UI v28 — UI/navigation only. Never replaces application actions.
(()=>{
 const root=document.documentElement;
 root.dataset.theme=localStorage.getItem('marboua-theme')||'dark';
 const ROLE={
  feedBtn:['home','⌂','الرئيسية'],notifBtn:['notifications','♢','الإشعارات'],globalSearchBtn:['search','⌕','بحث'],requestsBtn:['requests','✉','الطلبات']
 };
 function roleFor(b){
  if(ROLE[b.id])return ROLE[b.id];
  const oc=b.getAttribute('onclick')||'',txt=(b.textContent||'').trim();
  if(oc.includes("show('discover'")||oc.includes('show("discover"'))return['discover','◎','استكشاف'];
  if(oc.includes("show('chats'")||oc.includes('show("chats"'))return['chats','☏','الدردشات'];
  if(oc.includes("show('groups'")||oc.includes('show("groups"'))return['groups','♧','المجموعات'];
  if(oc.includes("show('calls'")||oc.includes('show("calls"'))return['calls','☎','المكالمات'];
  if(oc.includes("show('invites'")||oc.includes('show("invites"'))return['invites','◇','الدعوات'];
  if(oc.includes("show('me'")||oc.includes('show("me"'))return['me','◉','حسابي'];
  if(oc.includes('logout'))return['logout','↪','خروج'];
  if(txt.startsWith('طلبات'))return['requests','✉','الطلبات'];
  if(txt.includes('البلوك')||txt.includes('المحظور'))return['blocked','⊘','المحظورون'];
  return null;
 }
 function decorate(){
  const nav=document.querySelector('.nav');if(!nav)return;
  nav.querySelectorAll(':scope > button').forEach(b=>{
   const r=roleFor(b);if(!r)return;
   const [role,icon,label]=r;b.dataset.uiRole=role;b.dataset.uiLabel=label;b.title=label;b.setAttribute('aria-label',label);
   let i=b.querySelector('.mqNavIcon');if(!i){i=document.createElement('span');i.className='mqNavIcon';b.prepend(i)}i.textContent=icon;
   let l=b.querySelector('.mqNavLabel');if(!l){l=document.createElement('span');l.className='mqNavLabel';b.appendChild(l)}l.textContent=label;
   [...b.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());
  });
 }
 function theme(){
  let b=document.getElementById('mqThemeBtn');if(b)return;
  b=document.createElement('button');b.id='mqThemeBtn';b.type='button';
  const paint=()=>{const light=root.dataset.theme==='light';b.textContent=light?'🌙':'☀️';b.title=light?'الوضع الداكن':'الوضع الفاتح'};paint();
  b.onclick=()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';localStorage.setItem('marboua-theme',root.dataset.theme);paint()};document.body.appendChild(b);
 }
 function restoreShahboun(){const a=document.querySelector('.top a[href="../../"],.top a[href="../.."],.top a.btn');if(a){a.classList.add('mqShahbounBtn');a.style.removeProperty('display');a.textContent='شهبون'}}
 function more(){if(document.getElementById('mqMoreBtn'))return;const b=document.createElement('button');b.id='mqMoreBtn';b.type='button';b.textContent='☰';b.title='المزيد';document.body.appendChild(b);const d=document.createElement('div');d.id='mqMoreDrawer';d.innerHTML='<div class="mqDrawerHead"><b>المزيد</b><button id="mqMoreClose">×</button></div><div id="mqMoreItems"></div>';document.body.appendChild(d);b.onclick=()=>{syncMore();d.classList.add('open')};d.querySelector('#mqMoreClose').onclick=()=>d.classList.remove('open')}
 function syncMore(){const h=document.getElementById('mqMoreItems'),n=document.querySelector('.nav');if(!h||!n)return;h.innerHTML='';const main=new Set(['home','chats','groups','notifications','me']);n.querySelectorAll(':scope > button[data-ui-role]').forEach(o=>{if(main.has(o.dataset.uiRole))return;const c=document.createElement('button');c.className='mqDrawerItem';c.innerHTML=`<span>${o.querySelector('.mqNavIcon')?.textContent||'•'}</span><b>${o.dataset.uiLabel}</b>`;c.onclick=()=>{o.click();document.getElementById('mqMoreDrawer').classList.remove('open')};h.appendChild(c)})}
 function activeSync(){const n=document.querySelector('.nav');if(!n)return;const active=n.querySelector('.primary[data-ui-role]');if(active)document.body.dataset.mqSection=active.dataset.uiRole}
 function hookShow(){if(typeof window.show!=='function'||window.show.__mq28)return;const old=window.show;function w(){const r=old.apply(this,arguments);setTimeout(()=>{decorate();activeSync()},0);return r}w.__mq28=true;window.show=w}
 function defaultFeed(){if(sessionStorage.getItem('mq28-home'))return;const main=document.getElementById('main'),feed=document.getElementById('feedBtn');if(main&&!main.classList.contains('hide')&&feed){sessionStorage.setItem('mq28-home','1');feed.click()}}
 function debugCompact(){document.getElementById('shbDbgBar')?.classList.add('mqDbgCompact');const c=document.getElementById('marbDbgBtn');if(c)c.classList.add('mqCallDbgCompact')}
 function tick(){decorate();restoreShahboun();hookShow();activeSync();defaultFeed();debugCompact()}
 document.addEventListener('DOMContentLoaded',()=>{theme();more();tick()});let i=0;const t=setInterval(()=>{tick();if(++i>160)clearInterval(t)},250);
})();