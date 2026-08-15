const crypto = require('crypto');
const pool = require('../config/db');
const env = require('../config/env');
const { serverFingerprint, licenseDeviceId } = require('../utils/fingerprint');

function ed25519PublicKey(){
  const raw=Buffer.from(env.licensePublicKeyB64,'base64');
  if(raw.length!==32) throw Object.assign(new Error('Invalid public key'),{status:500,code:'LICENSE_PUBLIC_KEY_INVALID'});
  return crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),raw]),format:'der',type:'spki'});
}

async function ensureTrial(){
  const fp = serverFingerprint();
  const {rows} = await pool.query('SELECT * FROM license_state ORDER BY id DESC LIMIT 1');
  if(rows[0]){
    if(rows[0].mode==='trial' && Number(rows[0].max_devices||1)<Number(env.trialMaxDevices||5)){
      const u=await pool.query('UPDATE license_state SET max_devices=$1 WHERE id=$2 RETURNING *',[env.trialMaxDevices,rows[0].id]);
      return u.rows[0];
    }
    return rows[0];
  }
  const now = new Date();
  const end = new Date(now.getTime() + env.trialHours*3600000);
  const created = await pool.query(`INSERT INTO license_state(mode,server_fingerprint,trial_started_at,trial_ends_at,max_devices,last_trusted_time)
    VALUES('trial',$1,$2,$3,$4,$2) RETURNING *`,[fp,now,end,env.trialMaxDevices]);
  return created.rows[0];
}

async function getStatus(){
  const state = await ensureTrial();
  const now = new Date();
  let clockRollback = false;
  if(state.last_trusted_time && now < new Date(state.last_trusted_time)) clockRollback = true;
  await pool.query('UPDATE license_state SET last_trusted_time = GREATEST(COALESCE(last_trusted_time,$1),$1) WHERE id=$2',[now,state.id]);
  if(state.server_fingerprint !== serverFingerprint()) return {active:false,reason:'SERVER_FINGERPRINT_CHANGED',deviceId:licenseDeviceId(),state};
  if(clockRollback) return {active:false,reason:'CLOCK_ROLLBACK_DETECTED',deviceId:licenseDeviceId(),state};
  if(state.mode === 'licensed' && state.license_valid_until && now > new Date(state.license_valid_until)) return {active:false,reason:'LICENSE_EXPIRED',deviceId:licenseDeviceId(),state};
  if(state.mode === 'trial' && now > new Date(state.trial_ends_at)) return {active:false,reason:'TRIAL_EXPIRED',deviceId:licenseDeviceId(),state};
  return {active:true,reason: state.mode === 'trial' ? 'TRIAL_ACTIVE':'LICENSE_ACTIVE',deviceId:licenseDeviceId(),state};
}

function makeActivationRequest(){
  const payload = {deviceId:licenseDeviceId(),platform:'windows',fingerprint:serverFingerprint(),createdAt:new Date().toISOString(),suiteVersion:'6.0.0'};
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

async function activate(signedToken){
  const parts=String(signedToken||'').trim().split('.');
  if(parts.length!==3 || parts[0]!=='SHB1') throw Object.assign(new Error('Invalid license format'),{status:400,code:'INVALID_LICENSE_FORMAT'});
  const body=Buffer.from(parts[1],'base64url'),signature=Buffer.from(parts[2],'base64url');
  if(signature.length!==64 || body.length<20) throw Object.assign(new Error('Invalid license payload'),{status:400,code:'INVALID_LICENSE_FORMAT'});
  if(!crypto.verify(null,body,ed25519PublicKey(),signature)) throw Object.assign(new Error('Invalid signature'),{status:400,code:'INVALID_LICENSE_SIGNATURE'});
  const data=JSON.parse(body.toString('utf8'));
  if(data.version!==1 || data.appId!=='com.shahboun.sales') throw Object.assign(new Error('Wrong application'),{status:400,code:'LICENSE_APP_MISMATCH'});
  if(data.platform && data.platform!=='windows') throw Object.assign(new Error('Wrong platform'),{status:400,code:'LICENSE_PLATFORM_MISMATCH'});
  if(data.deviceId!==licenseDeviceId()) throw Object.assign(new Error('Wrong server'),{status:400,code:'LICENSE_SERVER_MISMATCH'});
  const issued=Date.parse(data.issuedAt);if(!Number.isFinite(issued)) throw Object.assign(new Error('Invalid issue date'),{status:400,code:'INVALID_LICENSE_DATE'});
  let validUntil=null;if(data.expiresAt){validUntil=new Date(data.expiresAt);if(!Number.isFinite(validUntil.getTime())||validUntil.getTime()<=issued)throw Object.assign(new Error('Invalid expiry'),{status:400,code:'INVALID_LICENSE_DATE'});}
  const maxDevices=Math.max(1,Math.min(2147483647,Number(data.maxDevices||env.trialMaxDevices||5)));
  await ensureTrial();
  await pool.query(`UPDATE license_state SET mode='licensed', serial=$1, max_devices=$2, activated_at=NOW(), license_valid_until=$3, license_payload=$4 WHERE id=(SELECT id FROM license_state ORDER BY id DESC LIMIT 1)`,
    [data.licenseId || null,maxDevices,validUntil,data]);
  return getStatus();
}

module.exports = {getStatus,makeActivationRequest,activate,ensureTrial};
