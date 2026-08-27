// AQIM audio manager: resilient adhan playback without broken UI
const AM_NAMES={
 'adhan_abdelrahman_alqodai.mp3':'عبدالرحمن القضاعي',
 'adhan_islam_sobhi.mp3':'إسلام صبحي',
 'adhan_omar_hisham.mp3':'عمر هشام',
 'adhan_nasser_alqatami.mp3':'ناصر القطامي',
 'adhan_yasser_aldosari.mp3':'ياسر الدوسري'
};
let amCtx=null;
function amBeep(){try{amCtx=amCtx||new (window.AudioContext||window.webkitAudioContext)();const o=amCtx.createOscillator(),g=amCtx.createGain();o.frequency.value=660;g.gain.setValueAtTime(.12,amCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,amCtx.currentTime+.6);o.connect(g);g.connect(amCtx.destination);o.start();o.stop(amCtx.currentTime+.65)}catch{}}
async function amPlaySelected(){const file=localStorage.aqim_adhan||document.getElementById('adhanSelect')?.value||Object.keys(AM_NAMES)[0],a=document.getElementById('adhanAudio');if(!a)return amBeep();a.src='assets/adhan/'+file;a.currentTime=0;try{await a.play();return true}catch{}const custom=localStorage.getItem('aqim_custom_adhan_'+file);if(custom){a.src=custom;try{await a.play();return true}catch{}}amBeep();toast(`ملف أذان ${AM_NAMES[file]||''} غير محمّل على الويب بعد؛ تم تشغيل تنبيه بديل بدون تعطيل التطبيق.`);return false}
window.previewAdhan=amPlaySelected;
async function amImport(){const inp=document.getElementById('amFile'),file=inp?.files?.[0],sel=document.getElementById('adhanSelect')?.value;if(!file||!sel)return toast('اختر ملف صوت أولًا');if(file.size>15*1024*1024)return toast('الملف كبير جدًا؛ الحد 15 MB');const r=new FileReader();r.onload=()=>{try{localStorage.setItem('aqim_custom_adhan_'+sel,r.result);toast('تم حفظ صوت الأذان على هذا الجهاز')}catch{toast('مساحة التخزين غير كافية؛ استخدم ملفًا أصغر')}};r.readAsDataURL(file)}
window.amImport=amImport;
function amInject(){const panel=document.querySelector('#settings .panel');if(!panel||document.getElementById('amBox'))return;const d=document.createElement('div');d.id='amBox';d.className='dhikr';d.style.marginTop='14px';d.innerHTML='<b>صوت أذان محلي</b><p class="muted">لو صوت من الأصوات الأصلية مش مستضاف على الويب، تقدر تربطه محليًا على جهازك ويظل محفوظًا بدون رفعه للسيرفر.</p><input id="amFile" class="input" type="file" accept="audio/*"><div class="settingsLinks"><button class="btn" onclick="amImport()">حفظ للصوت المختار</button><button class="btn" onclick="previewAdhan()">تجربة</button></div>';panel.appendChild(d)}
const _amNotify=window.notifyAqim;if(_amNotify)window.notifyAqim=async function(title,body,sound=false){await _amNotify(title,body,false);if(sound)await amPlaySelected()};
window.addEventListener('load',amInject);setTimeout(amInject,600);
