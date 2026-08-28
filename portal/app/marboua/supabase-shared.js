import{createClient as realCreateClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';

const KEY='__MARBOUA_SHARED_SUPABASE__';

function wrapQuery(q){
  if(!q||(typeof q!=='object'&&typeof q!=='function'))return q;
  return new Proxy(q,{
    get(target,prop){
      if(prop==='catch')return fn=>Promise.resolve(target).catch(fn);
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
