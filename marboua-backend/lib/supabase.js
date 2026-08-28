const URL=process.env.SUPABASE_URL;
const ANON=process.env.SUPABASE_ANON_KEY;
const SERVICE=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!URL)console.warn('SUPABASE_URL missing');
export async function getUser(req){const auth=req.headers.authorization||'';if(!auth.startsWith('Bearer '))return null;const r=await fetch(`${URL}/auth/v1/user`,{headers:{apikey:ANON,Authorization:auth}});if(!r.ok)return null;return r.json()}
export async function serviceFetch(path,opts={}){return fetch(`${URL}${path}`,{...opts,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,'Content-Type':'application/json',...(opts.headers||{})}})}
export function json(res,status,data){res.status(status).setHeader('content-type','application/json; charset=utf-8').setHeader('cache-control','no-store').end(JSON.stringify(data))}
export function cors(req,res){const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean),origin=req.headers.origin||'';if(!allowed.length||allowed.includes(origin)){res.setHeader('access-control-allow-origin',origin||'*');res.setHeader('vary','Origin')}res.setHeader('access-control-allow-headers','authorization,content-type');res.setHeader('access-control-allow-methods','GET,POST,DELETE,OPTIONS');if(req.method==='OPTIONS'){res.status(204).end();return true}return false}
