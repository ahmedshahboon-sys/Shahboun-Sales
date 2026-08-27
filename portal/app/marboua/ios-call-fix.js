// iOS/Safari WebRTC compatibility layer for Marboua calls.
// Keeps existing Android flow intact while adding TURN fallback and Safari media handling.
const NativePC=window.RTCPeerConnection||window.webkitRTCPeerConnection;
const TURN=[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:openrelay.metered.ca:80'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
];
if(NativePC&&!window.__marbouaPcPatched){
  window.__marbouaPcPatched=true;
  const Wrapped=new Proxy(NativePC,{construct(Target,args){const cfg=args?.[0]||{};const merged={...cfg,iceServers:TURN,iceTransportPolicy:'all',bundlePolicy:'max-bundle',rtcpMuxPolicy:'require',iceCandidatePoolSize:4};return new Target(merged)}});
  Wrapped.prototype=NativePC.prototype;
  window.RTCPeerConnection=Wrapped;
  if(window.webkitRTCPeerConnection)window.webkitRTCPeerConnection=Wrapped;
}
const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function mediaNode(){return document.getElementById('remoteAudio')||document.getElementById('remoteVideo')}
async function unlockAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(C){window.__marbouaIOSAudio=window.__marbouaIOSAudio||new C();if(window.__marbouaIOSAudio.state==='suspended')await window.__marbouaIOSAudio.resume()}
  }catch{}
  const a=mediaNode();
  if(a){try{a.autoplay=true;a.muted=false;a.volume=1;a.setAttribute('playsinline','');await a.play()}catch{}}
}
function normalizeRemoteAudio(){
  const a=document.getElementById('remoteAudio');
  if(a){a.setAttribute('playsinline','');a.autoplay=true;a.muted=false;a.volume=1;if(isiOS){a.style.display='block';a.style.position='fixed';a.style.width='1px';a.style.height='1px';a.style.opacity='0.001';a.style.pointerEvents='none';a.style.left='-10px';a.style.bottom='0'}}
  const lv=document.getElementById('localVideo'),rv=document.getElementById('remoteVideo');
  [lv,rv].forEach(v=>{if(v){v.setAttribute('playsinline','');v.playsInline=true}})
}
new MutationObserver(()=>normalizeRemoteAudio()).observe(document.documentElement,{childList:true,subtree:true});
['pointerdown','touchstart','click'].forEach(ev=>document.addEventListener(ev,()=>{normalizeRemoteAudio();unlockAudio()},{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{normalizeRemoteAudio();unlockAudio()},150)});
window.addEventListener('pageshow',()=>setTimeout(()=>{normalizeRemoteAudio();unlockAudio()},150));
// Safari sometimes needs a direct user gesture at answer time before remote audio can start.
document.addEventListener('click',e=>{if(e.target?.id==='answerBtn'||e.target?.closest?.('#answerBtn')){unlockAudio();setTimeout(unlockAudio,500);setTimeout(unlockAudio,1500)}},true);
normalizeRemoteAudio();