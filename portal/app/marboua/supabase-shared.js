import{createClient as realCreateClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const KEY='__MARBOUA_SHARED_SUPABASE__';

function wrapQuery(q){
  if(!q||(typeof q!=='object'&&typeof q!=='function'))return q;
  return new Proxy(q,{
    get(target,prop){
      if(prop==='catch')return fn=>Promise.resolve(target).catch(fn);
      // Avoid PostgREST object-response 4xx edge cases: fetch max one row and normalize locally.
      if(prop==='maybeSingle')return async()=>{
        const base=typeof target.limit==='function'?target.limit(1):target;
        const res=await Promise.resolve(base);
        const data=Array.isArray(res?.data)?(res.data[0]??null):(res?.data??null);
        return {...res,data};
      };
      const value=target[prop];
      if(typeof value!=='function')return value;
      if(prop==='then'||prop==='finally')return value.bind(target);
      return(...args)=>{
        const out=value.apply(target,args);
        if(out&&(typeof out==='object'||typeof out==='function'))return wrapQuery(out);
        return out;
      };
    }
  });
}

function wrapClient(client){
  return new Proxy(client,{
    get(target,prop){
      if(prop==='from')return(...args)=>wrapQuery(target.from(...args));
      if(prop==='rpc')return(...args)=>wrapQuery(target.rpc(...args));
      const value=target[prop];
      return typeof value==='function'?value.bind(target):value;
    }
  });
}

export function createClient(url,key,options){
  if(!globalThis[KEY])globalThis[KEY]=wrapClient(realCreateClient(url,key,options));
  return globalThis[KEY];
}
