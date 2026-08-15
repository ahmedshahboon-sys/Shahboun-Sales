import nacl from 'tweetnacl';
import { fromByteArray, toByteArray } from 'base64-js';
import * as Crypto from 'expo-crypto';
import { PUBLIC_KEY_B64 } from './privateKey';
import { getSigningKey } from './keyVault';
import { utf8Encode } from './utf8';

export type LicensePlatform='android'|'windows';
export type LicensePayload={version:1;licenseId:string;appId:'com.shahboun.sales';deviceId:string;platform:LicensePlatform;customerName:string;phone:string;issuedAt:string;expiresAt:string|null;note?:string;licenseType:'trial'|'licensed';maxDevices:number};
export type RecoveryPayload={version:1;type:'account-recovery';appId:'com.shahboun.sales';deviceId:string;nonce:string;issuedAt:string;expiresAt:string};
const b64url=(b:Uint8Array)=>fromByteArray(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function assertSigningKeyIntegrity(){const secret=await getSigningKey();if(!secret)throw new Error('SIGNING_KEY_NOT_IMPORTED');const sk=toByteArray(secret),pk=toByteArray(PUBLIC_KEY_B64);if(sk.length!==64||pk.length!==32)throw new Error('INVALID_LICENSE_SIGNING_KEY');for(let i=0;i<32;i++)if(sk[32+i]!==pk[i])throw new Error('LICENSE_KEYPAIR_MISMATCH');return sk}
export async function createLicense(input:{deviceId:string;customerName:string;phone:string;days?:number;hours?:number;note?:string;licenseType?:'trial'|'licensed';maxDevices?:number}){
 const sk=await assertSigningKeyIntegrity();const customerName=input.customerName.trim(),phone=input.phone.trim(),deviceId=input.deviceId.trim().toUpperCase();const days=Number(input.days??0),hours=Number(input.hours??0),licenseType=input.licenseType||'licensed';
 const android=/^SHB-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(deviceId),windows=/^WIN-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(deviceId);const platform:LicensePlatform=windows?'windows':'android';const maxDevices=Math.max(1,Math.min(999,Math.trunc(Number(input.maxDevices??5))));if(!customerName||!phone)throw new Error('MISSING_CUSTOMER_DATA');if(!android&&!windows)throw new Error('INVALID_DEVICE_ID');if(!Number.isFinite(days)||days<0||!Number.isFinite(hours)||hours<0||!Number.isFinite(maxDevices))throw new Error('INVALID_LICENSE_DURATION');
 const issuedAt=new Date();let expiresAt:string|null=null;if(licenseType==='trial')expiresAt=new Date(issuedAt.getTime()+24*3600000).toISOString();else if(hours>0)expiresAt=new Date(issuedAt.getTime()+hours*3600000).toISOString();else if(days>0)expiresAt=new Date(issuedAt.getTime()+days*86400000).toISOString();
 const payload:LicensePayload={version:1,licenseId:Crypto.randomUUID(),appId:'com.shahboun.sales',deviceId,platform,customerName,phone,issuedAt:issuedAt.toISOString(),expiresAt,note:input.note?.trim()||undefined,licenseType,maxDevices};const bytes=utf8Encode(JSON.stringify(payload)),sig=nacl.sign.detached(bytes,sk);return {code:`SHB1.${b64url(bytes)}.${b64url(sig)}`,payload};
}
export function publicKeyFingerprint(){return PUBLIC_KEY_B64.slice(0,10)+'…'+PUBLIC_KEY_B64.slice(-10)}

export async function createRecoveryCode(deviceInput:string,minutes=30){
 const sk=await assertSigningKeyIntegrity();const deviceId=deviceInput.trim().toUpperCase();if(!/^SHB-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(deviceId))throw new Error('INVALID_DEVICE_ID');const mins=Number(minutes);if(!Number.isFinite(mins)||mins<5||mins>120)throw new Error('INVALID_RECOVERY_DURATION');const issued=new Date(),payload:RecoveryPayload={version:1,type:'account-recovery',appId:'com.shahboun.sales',deviceId,nonce:Crypto.randomUUID(),issuedAt:issued.toISOString(),expiresAt:new Date(issued.getTime()+mins*60000).toISOString()};const bytes=utf8Encode(JSON.stringify(payload)),sig=nacl.sign.detached(bytes,sk);return {code:`SHBR1.${b64url(bytes)}.${b64url(sig)}`,payload};
}
