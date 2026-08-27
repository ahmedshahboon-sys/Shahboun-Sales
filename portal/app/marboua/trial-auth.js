import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import'./ios-call-fix.js';
import'./enhancements.js';
import'./social-v2.js';
import'./calls-v2.js';
const U='https://uojytcmeqegnlgvlmexx.supabase.co',K='sb_publishable_IB9p4LAK2s7VLW1u55SJQA_pANuxzHl',s=createClient(U,K);
const e=()=>document.getElementById('email'),p=()=>document.getElementById('password'),m=()=>document.getElementById('authMsg');
function valid(){const email=(e()?.value||'').trim(),pass=p()?.value||'';if(!email){m().textContent='اكتب البريد الإلكتروني أول.';return null}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){m().textContent='البريد الإلكتروني مش صحيح.';return null}if(pass.length<6){m().textContent='كلمة المرور لازم تكون 6 خانات أو أكثر.';return null}return{email,password:pass}}
window.signIn=async()=>{const c=valid();if(!c)return;m().textContent='جاري الدخول...';try{const{error}=await s.auth.signInWithPassword(c);if(error){m().textContent='تعذر الدخول: '+error.message;return}m().textContent='تم الدخول ✓';setTimeout(()=>location.reload(),80)}catch(err){m().textContent='تعذر الدخول: '+(err?.message||'خطأ اتصال')}};
window.signUp=async()=>{const c=valid();if(!c)return;m().textContent='جاري إنشاء الحساب التجريبي...';const{data,error}=await s.auth.signUp({email:c.email,password:c.password});if(error){m().textContent='تعذر إنشاء الحساب: '+error.message;return}if(data.session){m().textContent='تم إنشاء الحساب والدخول ✓';setTimeout(()=>location.reload(),80);return}for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,250*(i+1)));const{error:loginError}=await s.auth.signInWithPassword(c);if(!loginError){m().textContent='تم إنشاء الحساب والدخول ✓';setTimeout(()=>location.reload(),80);return}}m().textContent='تم إنشاء الحساب. جرّب زر دخول بنفس البريد وكلمة المرور.'};