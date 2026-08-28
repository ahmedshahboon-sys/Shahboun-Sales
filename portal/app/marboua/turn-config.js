import{createClient}from'./supabase-shared.js';
const U='https://uojytcmeqegnlgvlmexx.supabase.co',K='sb_publishable_IB9p4LAK2s7VLW1u55SJQA_pANuxzHl';
const s=createClient(U,K);
window.__MARBOUA_TURN_SERVERS__=[];
window.__MARBOUA_TURN_READY__=(async()=>{
 try{
  const{data,error}=await s.rpc('marboua_get_ice_servers');
  if(error)throw error;
  if(Array.isArray(data)&&data.length){window.__MARBOUA_TURN_SERVERS__=data;return data}
 }catch(e){console.warn('TURN config unavailable',e)}
 return [];
})();
await window.__MARBOUA_TURN_READY__;
