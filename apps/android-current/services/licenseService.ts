import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import {toByteArray} from 'base64-js';

const PUBLIC_KEY_B64='RKp/T18jbb/JxKEiM15em89PFUmzBPpgFHGUgrljIIs=';
const LICENSE_KEY='shahboun.sales.license.v6';
const DEVICE_SALT='SHAHBOUN-SUITE-6-DEVICE';
const dec=new TextDecoder();
const fromUrl=(s:string)=>toByteArray(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));

export type VerifiedLicense={version:number;licenseId:string;appId:string;deviceId:string;platform:'android';customerName:string;storeName?:string;phone?:string;issuedAt:string;expiresAt:string|null;licenseType:string;maxDevices:number;note?:string};

export async function getDeviceId(){
 const raw=(Application.getAndroidId?.()||Application.applicationId||'android')+'|'+(Application.applicationId||'com.shahboun.sales')+'|'+DEVICE_SALT;
 const h=await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,raw,{encoding:Crypto.CryptoEncoding.HEX});
 return `SHB-${h.slice(0,8).toUpperCase()}-${h.slice(8,16).toUpperCase()}-${h.slice(16,24).toUpperCase()}`;
}
export async function verifyLicenseCode(code:string):Promise<VerifiedLicense>{
 const parts=code.trim().split('.');if(parts.length!==3||parts[0]!=='SHB1')throw new Error('INVALID_LICENSE_FORMAT');
 const payloadBytes=fromUrl(parts[1]),sig=fromUrl(parts[2]),pk=toByteArray(PUBLIC_KEY_B64);
 if(sig.length!==64||pk.length!==32||!nacl.sign.detached.verify(payloadBytes,sig,pk))throw new Error('INVALID_LICENSE_SIGNATURE');
 let p:any;try{p=JSON.parse(dec.decode(payloadBytes))}catch{throw new Error('INVALID_LICENSE_PAYLOAD')}
 const deviceId=await getDeviceId();
 if(p.appId!=='com.shahboun.sales')throw new Error('WRONG_APP_LICENSE');
 if(p.platform!=='android')throw new Error('WRONG_PLATFORM_LICENSE');
 if(String(p.deviceId||'').toUpperCase()!==deviceId)throw new Error('LICENSE_DEVICE_MISMATCH');
 if(p.expiresAt&&Date.now()>Date.parse(p.expiresAt))throw new Error('LICENSE_EXPIRED');
 if(!p.licenseId||!p.customerName||!p.issuedAt)throw new Error('INVALID_LICENSE_PAYLOAD');
 return p as VerifiedLicense;
}
export async function activateLicense(code:string){const v=await verifyLicenseCode(code);await SecureStore.setItemAsync(LICENSE_KEY,code.trim(),{keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY});return v}
export async function loadLicense(){const c=await SecureStore.getItemAsync(LICENSE_KEY);if(!c)return null;try{return await verifyLicenseCode(c)}catch{return null}}
export async function clearLicense(){await SecureStore.deleteItemAsync(LICENSE_KEY)}
