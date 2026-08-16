const crypto = require('crypto');
const pool = require('../config/db');
const env = require('../config/env');
const { serverFingerprint } = require('../utils/fingerprint');

const PUBLIC_KEY_B64='RKp/T18jbb/JxKEiM15em89PFUmzBPpgFHGUgrljIIs=';
const ED25519_SPKI_PREFIX=Buffer.from('302a300506032b6570032100','hex');
const PUBLIC_KEY=crypto.createPublicKey({key:Buffer.concat([ED25519_SPKI_PREFIX,Buffer.from(PUBLIC_KEY_B64,'base64')]),format:'der',type:'spki'});
function deviceId(){const d=crypto.createHash('sha256').update(`com.shahboun.sales|windows|${serverFingerprint()}`).digest('hex').toUpperCase();return `SHB-${d.slice(0,8)}-${d.slice(8,16)}-${d.slice(16,24)}`}
function decodeB64url(x){return Buffer.from(String(x).replace(/-/g,'+').replace(/_/g,'/'),'base64')}

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
  const now = new Date(), end = new Date(now.getTime() + Number(env.trialHours||24)*3600000);
  const created = await pool.query(`INSERT INTO license_state(mode,server_fingerprint,trial_started_at,trial_ends_at,max_devices,last_trusted_time)
    VALUES('trial',$1,$2,$3,$4,$2) RETURNING *`,[fp,now,end,env.trialMaxDevices]);
  return created.rows[0];
}
async function getStatus(){
  const state=await ensureTrial(), now=new Date(); let clockRollback=false;
  if(state.last_trusted_time && now < new Date(state.last_trusted_time)) clockRollback=true;
  await pool.query('UPDATE license_state SET last_trusted_time = GREATEST(COALESCE(last_trusted_time,$1),$1) WHERE id=$2',[now,state.id]);
  if(state.server_fingerprint!==serverFingerprint())return {active:false,reason:'SERVER_FINGERPRINT_CHANGED',state,deviceId:deviceId()};
  if(clockRollback)return {active:false,reason:'CLOCK_ROLLBACK_DETECTED',state,deviceId:deviceId()};
  if(state.mode==='licensed'&&state.license_valid_until&&now>new Date(state.license_valid_until))return {active:false,reason:'LICENSE_EXPIRED',state,deviceId:deviceId()};
  if(state.mode==='trial'&&now>new Date(state.trial_ends_at))return {active:false,reason:'TRIAL_EXPIRED',state,deviceId:deviceId()};
  return {active:true,reason:state.mode==='trial'?'TRIAL_ACTIVE':'LICENSE_ACTIVE',state,deviceId:deviceId()};
}
function makeActivationRequest(){return deviceId()}
async function activate(code){
  const parts=String(code||'').trim().split('.');
  if(parts.length!==3||parts[0]!=='SHB1')throw Object.assign(new Error('Invalid license format'),{status:400,code:'INVALID_LICENSE_FORMAT'});
  const body=decodeB64url(parts[1]), sig=decodeB64url(parts[2]);
  if(sig.length!==64||!crypto.verify(null,body,PUBLIC_KEY,sig))throw Object.assign(new Error('Invalid signature'),{status:400,code:'INVALID_LICENSE_SIGNATURE'});
  let data;try{data=JSON.parse(body.toString('utf8'))}catch{throw Object.assign(new Error('Invalid payload'),{status:400,code:'INVALID_LICENSE_FORMAT'})}
  if(data.version!==1||data.appId!=='com.shahboun.sales')throw Object.assign(new Error('Wrong app'),{status:400,code:'LICENSE_APP_MISMATCH'});
  if(data.platform && data.platform!=='windows')throw Object.assign(new Error('Wrong platform'),{status:400,code:'LICENSE_PLATFORM_MISMATCH'});
  if(String(data.deviceId||'').toUpperCase()!==deviceId())throw Object.assign(new Error('Wrong server'),{status:400,code:'LICENSE_SERVER_MISMATCH'});
  const issued=Date.parse(data.issuedAt), exp=data.expiresAt?Date.parse(data.expiresAt):null, now=Date.now();
  if(!Number.isFinite(issued)||issued>now+10*60*1000)throw Object.assign(new Error('Invalid issued time'),{status:400,code:'INVALID_LICENSE_TIME'});
  if(exp!==null&&(!Number.isFinite(exp)||exp<=issued||now>exp))throw Object.assign(new Error('License expired'),{status:400,code:'LICENSE_EXPIRED'});
  const maxDevices=Math.max(1,Math.min(2147483647,Number(data.maxDevices||env.trialMaxDevices||5)));
  await ensureTrial();
  await pool.query(`UPDATE license_state SET mode='licensed', serial=$1, max_devices=$2, activated_at=NOW(), license_valid_until=$3, license_payload=$4 WHERE id=(SELECT id FROM license_state ORDER BY id DESC LIMIT 1)`,
    [data.licenseId||null,maxDevices,data.expiresAt||null,data]);
  return getStatus();
}
module.exports={getStatus,makeActivationRequest,activate,ensureTrial,deviceId};
