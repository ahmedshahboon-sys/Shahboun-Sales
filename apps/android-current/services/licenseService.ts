import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import {toByteArray} from 'base64-js';

const PUBLIC_KEY_B64='RKp/T18jbb/JxKEiM15em89PFUmzBPpgFHGUgrljIIs=';
const LICENSE_KEY='shahboun.sales.license.v6';
const TRIAL_START_KEY='shahboun.sales.trial.start.v6';
const TRIAL_DEVICE_KEY='shahboun.sales.trial.device.v6';
const TRIAL_MAX_SEEN_KEY='shahboun.sales.trial.maxseen.v6';
const DEVICE_SALT='SHAHBOUN-SUITE-6-DEVICE';
const TRIAL_MS=24*60*60*1000;
const fromUrl=(s:string)=>toByteArray(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));
function utf8Decode(bytes:Uint8Array){let binary='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk){binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));}return decodeURIComponent(escape(binary));}

export type VerifiedLicense={version:number;licenseId:string;appId:string;deviceId:string;platform?:'android';customerName:string;storeName?:string;phone?:string;issuedAt:string;expiresAt:string|null;licenseType:string;maxDevices?:number;note?:string};
export type TrialStatus={state:'unused'|'active'|'expired';startedAt:number|null;endsAt:number|null;remainingMs:number};

async function safeGet(key:string){try{return await SecureStore.getItemAsync(key)}catch{return null}}
async function safeSet(key:string,value:string){try{await SecureStore.setItemAsync(key,value,{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});return true}catch{return false}}

export async function getDeviceId(){
 const raw=(Application.getAndroidId?.()||Application.applicationId||'android')+'|'+(Application.applicationId||'com.shahboun.sales')+'|'+DEVICE_SALT;
 const h=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,raw,{encoding:Crypto.CryptoEncoding.HEX});
 return `SHB-${h.slice(0,8).toUpperCase()}-${h.slice(8,16).toUpperCase()}-${h.slice(16,24).toUpperCase()}`;
}

export async function verifyLicenseCode(code:string):Promise<VerifiedLicense>{
 const parts=code.trim().split('.');if(parts.length!==3||parts[0]!=='SHB1')throw new Error('INVALID_LICENSE_FORMAT');
 const payloadBytes=fromUrl(parts[1]),sig=fromUrl(parts[2]),pk=toByteArray(PUBLIC_KEY_B64);
 if(sig.length!==64||pk.length!==32||!nacl.sign.detached.verify(payloadBytes,sig,pk))throw new Error('INVALID_LICENSE_SIGNATURE');
 let p:any;try{p=JSON.parse(utf8Decode(payloadBytes))}catch{throw new Error('INVALID_LICENSE_PAYLOAD')}
 const deviceId=await getDeviceId();
 if(p.appId!=='com.shahboun.sales')throw new Error('WRONG_APP_LICENSE');
 // Legacy Suite codes did not include platform. Missing platform is treated as Android for backward compatibility.
 if(p.platform&&p.platform!=='android')throw new Error('WRONG_PLATFORM_LICENSE');
 if(String(p.deviceId||'').toUpperCase()!==deviceId)throw new Error('LICENSE_DEVICE_MISMATCH');
 if(p.expiresAt&&Date.now()>Date.parse(p.expiresAt))throw new Error('LICENSE_EXPIRED');
 if(!p.licenseId||!p.customerName||!p.issuedAt)throw new Error('INVALID_LICENSE_PAYLOAD');
 return {...p,platform:'android',maxDevices:Number(p.maxDevices||1)} as VerifiedLicense;
}

export async function activateLicense(code:string){
 const v=await verifyLicenseCode(code);
 const ok=await safeSet(LICENSE_KEY,code.trim());
 if(!ok)throw new Error('LICENSE_STORAGE_FAILED');
 return v;
}
export async function loadLicense(){const c=await safeGet(LICENSE_KEY);if(!c)return null;try{return await verifyLicenseCode(c)}catch{return null}}
export async function clearLicense(){try{await SecureStore.deleteItemAsync(LICENSE_KEY)}catch{}}

export async function getTrialStatus():Promise<TrialStatus>{
 const deviceId=await getDeviceId();
 const[startRaw,boundDevice,maxSeenRaw]=await Promise.all([safeGet(TRIAL_START_KEY),safeGet(TRIAL_DEVICE_KEY),safeGet(TRIAL_MAX_SEEN_KEY)]);
 if(!startRaw)return {state:'unused',startedAt:null,endsAt:null,remainingMs:TRIAL_MS};
 const startedAt=Number(startRaw);if(!Number.isFinite(startedAt)||startedAt<=0)return {state:'expired',startedAt:null,endsAt:null,remainingMs:0};
 if(boundDevice&&boundDevice!==deviceId)return {state:'expired',startedAt,endsAt:startedAt+TRIAL_MS,remainingMs:0};
 const now=Date.now(),maxSeen=Number(maxSeenRaw||0);
 // Prevent extending the trial by setting the phone clock backwards.
 if(Number.isFinite(maxSeen)&&maxSeen>0&&now+5*60*1000<maxSeen)return {state:'expired',startedAt,endsAt:startedAt+TRIAL_MS,remainingMs:0};
 const effectiveNow=Math.max(now,Number.isFinite(maxSeen)?maxSeen:0);
 await safeSet(TRIAL_MAX_SEEN_KEY,String(effectiveNow));
 const endsAt=startedAt+TRIAL_MS,remainingMs=Math.max(0,endsAt-effectiveNow);
 return {state:remainingMs>0?'active':'expired',startedAt,endsAt,remainingMs};
}

export async function startTrial():Promise<TrialStatus>{
 const existing=await getTrialStatus();if(existing.state!=='unused')return existing;
 const deviceId=await getDeviceId(),now=Date.now();
 const results=await Promise.all([safeSet(TRIAL_START_KEY,String(now)),safeSet(TRIAL_DEVICE_KEY,deviceId),safeSet(TRIAL_MAX_SEEN_KEY,String(now))]);
 if(results.some(v=>!v))throw new Error('TRIAL_STORAGE_FAILED');
 return {state:'active',startedAt:now,endsAt:now+TRIAL_MS,remainingMs:TRIAL_MS};
}
