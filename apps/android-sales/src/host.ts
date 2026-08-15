import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { loadState, saveState, uid, verifyPassword } from './storage';
import { applySale, reportMetrics } from './business';

const bridge:any = NativeModules.ShahbounNative;
const emitter = bridge ? new NativeEventEmitter(bridge) : null;
let sub:any = null;
let sessionToken = '';
let sessionUserId = '';

function json(status:number, body:any){
  return {status, contentType:'application/json; charset=utf-8', body:JSON.stringify(body)};
}
function parseBody(text:string){ try{return text?JSON.parse(text):{}}catch{return {}} }
function bearer(headers:any){
  const raw=String(headers?.authorization||headers?.Authorization||'');
  return raw.startsWith('Bearer ')?raw.slice(7):'';
}
function publicUser(u:any){return {id:u.id,username:u.username,displayName:u.displayName,role:u.role,active:u.active}}

async function handle(req:any){
  const method=String(req.method||'GET').toUpperCase();
  const rawPath=String(req.path||'/');
  const path=rawPath.split('?')[0];
  const body=parseBody(String(req.body||''));
  const state=await loadState();

  if(path==='/api/auth/login' && method==='POST'){
    const username=String(body.username||'').trim().toLowerCase();
    const password=String(body.password||'');
    const user=state.users.find((u:any)=>u.active&&String(u.username).trim().toLowerCase()===username);
    if(!user || !(await verifyPassword(password,user.passwordHash))) return json(401,{error:'INVALID_CREDENTIALS'});
    sessionToken=`shb_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    sessionUserId=user.id;
    return json(200,{token:sessionToken,user:publicUser(user),store:state.profile,version:'6.0.0'});
  }

  if(path==='/api/health') return json(200,{ok:true,service:'Shahboun Android Host',version:'6.0.0',host:'android'});

  const token=bearer(req.headers||{});
  if(!sessionToken || token!==sessionToken) return json(401,{error:'UNAUTHORIZED'});
  const current=state.users.find((u:any)=>u.id===sessionUserId&&u.active);
  if(!current) return json(401,{error:'SESSION_EXPIRED'});

  if(path==='/api/auth/me' && method==='GET') return json(200,{user:publicUser(current),store:state.profile});
  if(path==='/api/bootstrap' && method==='GET') return json(200,{
    version:'6.0.0',store:state.profile,user:publicUser(current),settings:state.settings,
    warehouses:state.warehouses,modules:state.settings.enabledModules||[]
  });
  if(path==='/api/dashboard' && method==='GET') return json(200,reportMetrics(state));
  if(path==='/api/products' && method==='GET') return json(200,state.products.filter((x:any)=>x.active!==false));
  if(path==='/api/customers' && method==='GET') return json(200,state.customers);
  if(path==='/api/suppliers' && method==='GET') return json(200,state.suppliers);
  if(path==='/api/sales' && method==='GET') return json(200,state.sales.slice(0,500));
  if(path==='/api/purchases' && method==='GET') return json(200,state.purchases.slice(0,500));
  if(path==='/api/settings' && method==='GET') return json(200,state.settings);
  if(path==='/api/warehouses' && method==='GET') return json(200,state.warehouses);

  if(path==='/api/pos/sale' && method==='POST'){
    const result=applySale(state,{
      cart:Array.isArray(body.cart)?body.cart:[], customerId:body.customerId||undefined,
      method:body.method||'cash', discount:body.discount||0, cash:body.cash||0,
      transfer:body.transfer||0, warehouseId:body.warehouseId||state.settings.defaultWarehouseId,
      tax:body.tax||0, shipping:body.shipping||0, dueDate:body.dueDate||undefined,
      transferRef:body.transferRef||undefined, note:body.note||'', internalNote:body.internalNote||'',
      priceLevel:body.priceLevel||'retail', useCustomerCredit:!!body.useCustomerCredit,
      paymentMethodOptionId:body.paymentMethodOptionId||undefined,
      paymentMethodLabel:body.paymentMethodLabel||undefined
    },new Date().toISOString(),uid);
    const saved=await saveState(result.state);
    return json(201,{ok:true,sale:result.sale,lowStock:result.lowStock,revision:saved.audit.length});
  }

  return json(404,{error:'NOT_FOUND',path});
}

export async function startAndroidHost(port=8787){
  if(Platform.OS!=='android'||!bridge?.startHostServer) throw new Error('ANDROID_HOST_UNAVAILABLE');
  if(!sub && emitter){
    sub=emitter.addListener('ShahbounHostRequest',async(req:any)=>{
      try{
        const r=await handle(req);
        await bridge.respondHostRequest(String(req.id),r.status,r.contentType,r.body);
      }catch(e:any){
        try{await bridge.respondHostRequest(String(req.id),500,'application/json; charset=utf-8',JSON.stringify({error:'HOST_ERROR',message:String(e?.message||e)}))}catch{}
      }
    });
  }
  return String(await bridge.startHostServer(port));
}

export async function stopAndroidHost(){
  sessionToken=''; sessionUserId='';
  if(sub){try{sub.remove()}catch{} sub=null}
  if(Platform.OS==='android'&&bridge?.stopHostServer) return !!(await bridge.stopHostServer());
  return true;
}

export async function getAndroidHostUrl(){
  if(Platform.OS!=='android'||!bridge?.getHostServerUrl) return null;
  try{return await bridge.getHostServerUrl()}catch{return null}
}
