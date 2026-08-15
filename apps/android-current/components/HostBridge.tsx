import React,{useEffect,useRef} from 'react';
import {NativeEventEmitter,NativeModules,Platform} from 'react-native';
import {useApp} from '@/context/AppContext';

const bridge:any=NativeModules.ShahbounHost;
const emitter=bridge?new NativeEventEmitter(bridge):null;
const json=(status:number,body:any)=>({status,type:'application/json; charset=utf-8',body:JSON.stringify(body)});
const parse=(s:any)=>{try{return s?JSON.parse(String(s)): {}}catch{return {}}};
const bearer=(h:any)=>{const x=String(h?.authorization||'');return x.startsWith('Bearer ')?x.slice(7):''};

export function HostBridge(){
 const app=useApp();
 const appRef=useRef(app);appRef.current=app;
 const token=useRef('');
 useEffect(()=>{if(Platform.OS!=='android'||!bridge||!emitter||app.loading)return;let sub:any;
  const handle=async(req:any)=>{const a=appRef.current;let out:any;try{
   const method=String(req.method||'GET').toUpperCase();const path=String(req.path||'/').split('?')[0];const body=parse(req.body);
   if(path==='/api/health')out=json(200,{ok:true,service:'Shahboun Android Host',version:'6.0.0',host:'android'});
   else if(path==='/api/auth/login'&&method==='POST'){
    const r=await a.login(String(body.username||''),String(body.password||''));if(!r.ok)out=json(401,{error:'INVALID_CREDENTIALS',message:r.message});else{token.current=`shb_${Date.now()}_${Math.random().toString(36).slice(2)}`;out=json(200,{token:token.current,user:{username:'admin',displayName:'المدير',role:'manager'},store:a.state.storeProfile,version:'6.0.0'})}
   }else if(!token.current||bearer(req.headers)!==token.current)out=json(401,{error:'UNAUTHORIZED'});
   else if(path==='/api/auth/me')out=json(200,{user:{username:'admin',displayName:'المدير',role:'manager'},store:a.state.storeProfile});
   else if(path==='/api/bootstrap')out=json(200,{version:'6.0.0',store:a.state.storeProfile,user:{username:'admin',displayName:'المدير',role:'manager'},settings:{defaultWarehouseId:'main'},warehouses:[{id:'main',name:'المخزن الرئيسي'}],modules:['sales','products','customers','suppliers','purchases','reports']});
   else if(path==='/api/dashboard'){
    const today=new Date().toISOString().slice(0,10);const ss=a.state.sales.filter(s=>s.createdAt.slice(0,10)===today&&!s.returned);const todaySales=ss.reduce((x,s)=>x+s.total,0);const todayProfit=ss.reduce((x,s)=>x+s.items.reduce((y,i)=>y+(i.unitPrice-(i.costPrice||0))*i.quantity,0),0);const customerDebts=a.state.customers.reduce((x,c)=>x+Math.max(0,c.balance),0);const lowStock=a.state.products.filter(p=>p.active&&p.stock<=p.minimumStock).length;out=json(200,{todaySales,todayProfit,customerDebts,lowStock});
   }else if(path==='/api/products')out=json(200,a.state.products.filter(p=>p.active).map(p=>({...p,price:p.salePrice,cost:p.purchasePrice,minStock:p.minimumStock})));
   else if(path==='/api/customers')out=json(200,a.state.customers);
   else if(path==='/api/suppliers')out=json(200,a.state.suppliers);
   else if(path==='/api/sales')out=json(200,a.state.sales.map(s=>({...s,number:s.invoiceNumber})));
   else if(path==='/api/purchases')out=json(200,a.state.purchases.map(p=>({...p,number:p.invoiceNumber})));
   else if(path==='/api/pos/sale'&&method==='POST'){
    const lines=Array.isArray(body.cart)?body.cart:[];if(!lines.length)out=json(400,{error:'EMPTY_CART'});else{const items=lines.map((x:any)=>({productId:x.productId,name:x.name,quantity:Number(x.qty||x.quantity||0),unitPrice:Number(x.price||x.unitPrice||0),costPrice:Number(x.cost||0),total:Number(x.qty||x.quantity||0)*Number(x.price||x.unitPrice||0)}));const subtotal=items.reduce((x:any,i:any)=>x+i.total,0);const methodMap:any={cash:'نقدي',transfer:'حوالة',credit:'آجل',mixed:'مختلط'};const paymentMethod=methodMap[body.method]||'نقدي';const paid=paymentMethod==='آجل'?0:subtotal;a.completeSale({items,subtotal,discount:0,total:subtotal,paid,paymentMethod,customerId:body.customerId||undefined});out=json(201,{ok:true,accepted:true})}
   }else out=json(404,{error:'NOT_FOUND',path});
  }catch(e:any){out=json(500,{error:'HOST_ERROR',message:String(e?.message||e)})}
  try{await bridge.respondHostRequest(String(req.id),out.status,out.type,out.body)}catch{}
  };
  sub=emitter.addListener('ShahbounHostRequest',handle);bridge.startHostServer(8787).catch((e:any)=>console.warn('Host start failed',e));
  return()=>{try{sub?.remove()}catch{};bridge.stopHostServer?.().catch(()=>{})}
 },[app.loading]);
 return null;
}
