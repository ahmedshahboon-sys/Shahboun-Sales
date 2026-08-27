// Marboua WebRTC compatibility layer - loaded BEFORE calls-v2.js
const NativePC=window.RTCPeerConnection||window.webkitRTCPeerConnection;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
const isSafari=isIOS||(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
const EXTRA_STUN=[
 {urls:'stun:stun.l.google.com:19302'},
 {urls:'stun:stun1.l.google.com:19302'},
 {urls:'stun:stun2.l.google.com:19302'},
 {urls:'stun:stun3.l.google.com:19302'},
 {urls:'stun:stun4.l.google.com:19302'}
];
if(NativePC){
 class MarbouaPC extends NativePC{
  constructor(config={}){
   const supplied=Array.isArray(config.iceServers)?config.iceServers:[];
   super({...config,iceServers:[...supplied,...EXTRA_STUN],bundlePolicy:'max-bundle',rtcpMuxPolicy:'require',iceCandidatePoolSize:isIOS?0:2});
  }
 }
 window.RTCPeerConnection=MarbouaPC;
}
let audioCtx=null;
async function unlockAudio(){
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(C){audioCtx=audioCtx||new C();if(audioCtx.state==='suspended')await audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();g.gain.value=0;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.01)}
  document.querySelectorAll('audio,video').forEach(m=>{m.setAttribute('playsinline','');m.setAttribute('webkit-playsinline','');});
 }catch{}
}
['touchstart','pointerdown','click'].forEach(ev=>document.addEventListener(ev,unlockAudio,{passive:true,once:false}));
const obs=new MutationObserver(()=>{
 const a=document.getElementById('remoteAudio');if(a){a.autoplay=true;a.playsInline=true;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');a.muted=false;a.volume=1}
 ['localVideo','remoteVideo'].forEach(id=>{const v=document.getElementById(id);if(v){v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','')}});
});
obs.observe(document.documentElement,{childList:true,subtree:true});
window.__MARBOUA_RTC_COMPAT__={isIOS,isSafari,unlockAudio,hasTurn:false};
if(isIOS){document.documentElement.dataset.marbouaIos='1';}
