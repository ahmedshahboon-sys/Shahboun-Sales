// iOS/Safari WebRTC compatibility layer for Marboua calls.
// Must load before the rest of the call stack.
const NativePC=window.RTCPeerConnection||window.webkitRTCPeerConnection;
const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isSafari=isiOS||(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
const ICE=[
  {urls:'stun:stun.l.google.com:19302'},
  {urls:'stun:stun1.l.google.com:19302'},
  {urls:'stun:stun2.l.google.com:19302'},
  {urls:'stun:openrelay.metered.ca:80'},
  {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'},
  {urls:'turns:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
];
if(NativePC&&!window.__marbouaPcPatched){
  window.__marbouaPcPatched=true;
  const Wrapped=new Proxy(NativePC,{construct(Target,args){
    const cfg=args?.[0]||{};
    const merged={...cfg,iceServers:ICE,iceTransportPolicy:'all',bundlePolicy:'max-bundle',rtcpMuxPolicy:'require',iceCandidatePoolSize:isiOS?0:2};
    const p=new Target(merged);
    p.addEventListener?.('iceconnectionstatechange',()=>{if(p.iceConnectionState==='failed'&&typeof p.restartIce==='function'){try{p.restartIce()}catch{}}});
    return p;
  }});
  Wrapped.prototype=NativePC.prototype;
  window.RTCPeerConnection=Wrapped;
  if(window.webkitRTCPeerConnection)window.webkitRTCPeerConnection=Wrapped;
}
function mediaNode(){return document.getElementById('remoteAudio')||document.getElementById('remoteVideo')}
async function unlockAudio(){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(C){window.__marbouaIOSAudio=window.__marbouaIOSAudio||new C();if(window.__marbouaIOSAudio.state==='suspended')await window.__marbouaIOSAudio.resume();const o=window.__marbouaIOSAudio.createOscillator(),g=window.__marbouaIOSAudio.createGain();g.gain.value=0;o.connect(g);g.connect(window.__marbouaIOSAudio.destination);o.start();o.stop(window.__marbouaIOSAudio.currentTime+.01)}
  }catch{}
  const a=mediaNode();
  if(a){try{a.autoplay=true;a.muted=false;a.volume=1;a.playsInline=true;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');await a.play()}catch{}}
}
function normalizeRemoteAudio(){
  const a=document.getElementById('remoteAudio');
  if(a){a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');a.autoplay=true;a.playsInline=true;a.muted=false;a.volume=1;if(isiOS){a.style.display='block';a.style.position='fixed';a.style.width='2px';a.style.height='2px';a.style.opacity='0.001';a.style.pointerEvents='none';a.style.left='-20px';a.style.bottom='0'}}
  ['localVideo','remoteVideo'].forEach(id=>{const v=document.getElementById(id);if(v){v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.playsInline=true}})
}
new MutationObserver(()=>normalizeRemoteAudio()).observe(document.documentElement,{childList:true,subtree:true});
['pointerdown','touchstart','click'].forEach(ev=>document.addEventListener(ev,()=>{normalizeRemoteAudio();unlockAudio()},{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>{normalizeRemoteAudio();unlockAudio()},100)});
window.addEventListener('pageshow',()=>setTimeout(()=>{normalizeRemoteAudio();unlockAudio()},100));
document.addEventListener('click',e=>{if(e.target?.id==='answerBtn'||e.target?.closest?.('#answerBtn')){unlockAudio();setTimeout(unlockAudio,250);setTimeout(unlockAudio,900);setTimeout(unlockAudio,1800)}},true);
window.__MARBOUA_IOS_RTC__={isiOS,isSafari,unlockAudio,iceServers:ICE};
normalizeRemoteAudio();