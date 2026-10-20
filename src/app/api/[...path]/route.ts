import {NextRequest,NextResponse} from 'next/server';
import {config,seal,unseal,allowed} from '@/server/session.mjs';
export const runtime='nodejs';
const COOKIE='erp_session';
async function handler(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
 try{const c=config(),path=(await params).path.join('/');if(req.method!=='GET'&&(req.headers.get('origin')!==c.origin||req.headers.get('sec-fetch-site')==='cross-site'))return reply({message:'Origem não permitida.'},403);
 if(req.headers.get('sec-fetch-site')==='cross-site')return reply({message:'Origem não permitida.'},403);
 let body:Record<string,unknown>|undefined;if(req.method!=='GET'){if(!req.headers.get('content-type')?.startsWith('application/json'))return reply({message:'Envie JSON.'},415);const reader=req.body?.getReader();if(!reader)return reply({message:'Dados ausentes.'},400);let size=0;const parts:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>800000){await reader.cancel();return reply({message:'Requisição acima do limite.'},413);}parts.push(part.value);}try{body=JSON.parse(Buffer.concat(parts).toString());}catch{return reply({message:'JSON inválido.'},400);}if(!body||typeof body!=='object'||Array.isArray(body))return reply({message:'Dados inválidos.'},400);}
 const session=unseal(req.cookies.get(COOKIE)?.value,c);let target=path;
 if(req.method==='GET'&&path==='branding')target='branding/'+c.slug;
 else if(req.method==='GET'&&path==='logo')target='branding/'+c.slug+'/logo';
 else if(req.method==='POST'&&path==='session'){target='sessions';body={email:body?.email,password:body?.password,slug:c.slug};}
 else if(req.method==='POST'&&path==='reset'){target='access/reset';body={email:body?.email,slug:c.slug};}
 else if(req.method==='POST'&&path==='complete')target='access/complete';
 else{if(!session)return reply({message:'Entre para continuar.'},401);if(!allowed(req.method,path))return reply({message:'Rota não permitida.'},403);}
 const response=await fetch(c.api+'/v1/'+target+req.nextUrl.search,{method:req.method,headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.token}:{}),...(req.headers.has('idempotency-key')?{'Idempotency-Key':req.headers.get('idempotency-key')!}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
 if(path==='logo'&&response.ok)return new NextResponse(await response.arrayBuffer(),{headers:{'Content-Type':'image/webp','Cache-Control':'no-store'}});
 const data=await response.json();let result;if(path==='session'&&response.ok){result=reply({authenticated:true});result.cookies.set(COOKIE,seal({token:data.accessToken,expires:Date.parse(data.expiresAt)},c),{httpOnly:true,secure:c.production,sameSite:'strict',path:'/',expires:new Date(data.expiresAt)});}else result=reply(data,response.status);
 if(response.status===401||(path==='logout'&&response.ok))result.cookies.set(COOKIE,'',{maxAge:0,path:'/',httpOnly:true,secure:c.production,sameSite:'strict'});
 if(response.headers.has('retry-after'))result.headers.set('Retry-After',response.headers.get('retry-after')!);return result;
 }catch{return reply({message:'Não foi possível acessar a API. Confira as variáveis e a disponibilidade do serviço.'},503);}
}
export {handler as GET,handler as POST,handler as PATCH};
