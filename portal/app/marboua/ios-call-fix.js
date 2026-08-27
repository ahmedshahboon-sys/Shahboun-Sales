// Marboua iOS/Safari media compatibility. This file does NOT replace RTCPeerConnection.
const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isSafari=isiOS||(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
const ICE=[
 {urls:'stun:stun.l.google.com:19302'},
 {urls:'stun:stun1.l.google.com:19302'},
 {urls:'stun:stun2.l.google.com:19302'},
 {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
 {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'},
 {urls:'turns:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
];
window.__MARBOUA_IOS_RTC__={isiOS,isSafari,iceServers:ICE};
async function unlockAudio(){try{const C=window.AudioContext||window.webkitAudioContext;if(C){window.__marbouaIOSAudio=window.__marbouaIOSAudio||new C();if(window.__marbouaIOSAudio.state==='suspended')await window.__marbouaIOSAudio.resume()}}catch{}for(const m of document.querySelectorAll('audio,video')){try{m.setAttribute('playsinline','');m.setAttribute('webkit-playsinline','');m.playsInline=true;if(m.id==='remoteAudio'){m.muted=false;m.volume=1}if(m.srcObject)await m.play()}catch{}}}
function normalize(){const a=document.getElementById('remoteAudio');if(a){a.autoplay=true;a.playsInline=true;a.muted=false;a.volume=1;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','')}for(const id of ['localVideo','remoteVideo']){const v=document.getElementById(id);if(v){v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','')}}}
try{new MutationObserver(normalize).observe(document.documentElement,{childList:true,subtree:true})}catch{}
for(const ev of ['touchstart','pointerdown','click'])document.addEventListener(ev,()=>{normalize();unlockAudio()},{capture:true,passive:true});
document.addEventListener('click',e=>{if(e.target?.id==='answerBtn'||e.target?.closest?.('#answerBtn')){unlockAudio();setTimeout(unlockAudio,250);setTimeout(unlockAudio,900)}},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{normalize();unlockAudio()},100)});window.addEventListener('pageshow',()=>setTimeout(()=>{normalize();unlockAudio()},100));normalize();