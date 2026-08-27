// iOS/Safari compatibility for Marboua. Never block the call engine if Safari rejects a shim.
const NativePC=window.RTCPeerConnection||window.webkitRTCPeerConnection;
const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isSafari=isiOS||(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
const ICE=[
 {urls:'stun:stun.l.google.com:19302'},
 {urls:'stun:stun1.l.google.com:19302'},
 {urls:'stun:stun2.l.google.com:19302'},
 {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
 {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
 {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'},
 {urls:'turns:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
];
window.__MARBOUA_IOS_RTC__={isiOS,isSafari,iceServers:ICE};
try{
 if(NativePC&&!window.__marbouaPcPatched){
   window.__marbouaPcPatched=true;
   const SafePC=function(config={}){const cfg={...config,iceServers:ICE,iceTransportPolicy:'all'};if(!isiOS)cfg.iceCandidatePoolSize=2;return new NativePC(cfg)};
   SafePC.prototype=NativePC.prototype;
   window.RTCPeerConnection=SafePC;
   if(window.webkitRTCPeerConnection)window.webkitRTCPeerConnection=SafePC;
 }
}catch(err){console.warn('Marboua iOS RTC shim skipped',err)}
function mediaNode(){return document.getElementById('remoteAudio')||document.getElementById('remoteVideo')}
async function unlockAudio(){
 try{const C=window.AudioContext||window.webkitAudioContext;if(C){window.__marbouaIOSAudio=window.__marbouaIOSAudio||new C();if(window.__marbouaIOSAudio.state==='suspended')await window.__marbouaIOSAudio.resume()}}catch{}
 const a=mediaNode();if(a){try{a.autoplay=true;a.muted=false;a.volume=1;a.playsInline=true;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');await a.play()}catch{}}
}
function normalize(){
 const a=document.getElementById('remoteAudio');if(a){a.autoplay=true;a.playsInline=true;a.muted=false;a.volume=1;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','')}
 ['localVideo','remoteVideo'].forEach(id=>{const v=document.getElementById(id);if(v){v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','')}})
}
try{new MutationObserver(normalize).observe(document.documentElement,{childList:true,subtree:true})}catch{}
['touchstart','pointerdown','click'].forEach(ev=>document.addEventListener(ev,()=>{normalize();unlockAudio()},{capture:true,passive:true}));
document.addEventListener('click',e=>{if(e.target?.id==='answerBtn'||e.target?.closest?.('#answerBtn')){unlockAudio();setTimeout(unlockAudio,300);setTimeout(unlockAudio,1000)}},true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{normalize();unlockAudio()},100)});
window.addEventListener('pageshow',()=>setTimeout(()=>{normalize();unlockAudio()},100));
normalize();