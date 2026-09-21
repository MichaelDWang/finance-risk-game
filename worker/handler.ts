import { sendSchema } from '../shared/schema';
import { buildReport } from '../shared/report/model';
import { BRAND, LINKS } from '../shared/content';
import type { GuardResult } from './guard';
import type { DurableObjectNamespace } from '@cloudflare/workers-types';
export interface Env {
  RESEND_API_KEY:string;TURNSTILE_SECRET_KEY:string;FROM_EMAIL:string;ALLOWED_ORIGINS:string;
  HASH_SECRET:string;TURNSTILE_HOSTNAMES:string;DAILY_SEND_LIMIT:string;
  MAIL_GUARD:DurableObjectNamespace;
}
type PdfFn=(report:ReturnType<typeof buildReport>)=>Promise<Uint8Array>;
type Fetcher=typeof fetch;
const MAX_BODY=16384;
async function boundedJson(req:Request){
  if(Number(req.headers.get('Content-Length')||0)>MAX_BODY)throw new Error('size');
  const reader=req.body?.getReader();if(!reader)throw new Error('body');let total=0;const chunks:Uint8Array[]=[];
  for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BODY){await reader.cancel();throw new Error('size');}chunks.push(value);}
  const bytes=new Uint8Array(total);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
async function hmac(secret:string,text:string){
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
function base64(bytes:Uint8Array){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
export function makeHandler(generate:PdfFn,fetcher:Fetcher=fetch){
  return async(req:Request,env:Env):Promise<Response>=>{
    const origin=req.headers.get('Origin')||'',allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
    const headers:Record<string,string>={'Cache-Control':'no-store','Content-Type':'application/json','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(allowed.includes(origin)&&/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin))headers['Access-Control-Allow-Origin']=origin;
    const reply=(status:string,code:number)=>new Response(JSON.stringify({status}),{status:code,headers});
    if(new URL(req.url).pathname!=='/api/send-report')return reply('not_found',404);
    if(!headers['Access-Control-Allow-Origin'])return reply('forbidden',403);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    if(req.method!=='POST')return reply('method_not_allowed',405);
    const limit=Number(env.DAILY_SEND_LIMIT);
    if(!env.RESEND_API_KEY||!env.TURNSTILE_SECRET_KEY||!env.HASH_SECRET||env.HASH_SECRET.length<32||!env.FROM_EMAIL||!env.TURNSTILE_HOSTNAMES||!env.MAIL_GUARD||!Number.isInteger(limit)||limit<1||limit>10000)return reply('unavailable',503);
    if(req.headers.get('Content-Type')?.split(';')[0]!=='application/json')return reply('invalid',400);
    let raw:unknown;try{raw=await boundedJson(req);}catch(e){return reply('invalid',(e as Error).message==='size'?413:400);}
    const parsed=sendSchema.safeParse(raw);if(!parsed.success)return reply('invalid',400);
    const {email,token,session}=parsed.data,now=Date.now();
    const age=now-new Date(session.createdAt).getTime();if(age < -300000||age>24*3600000)return reply('invalid',400);
    const report=buildReport(session);if(!report.complete)return reply('incomplete',400);
    let verification:{success?:boolean;hostname?:string;action?:string;challenge_ts?:string};
    try{
      const res=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(10000)});
      if(!res.ok)return reply('verification_failed',403);verification=await res.json();
    }catch{return reply('verification_failed',403);}
    const challengeAge=now-Date.parse(verification.challenge_ts||'');
    if(!verification.success||verification.action!=='send-report'||!env.TURNSTILE_HOSTNAMES.split(',').map(h=>h.trim()).includes(verification.hostname||'')||!Number.isFinite(challengeAge)||challengeAge< -60000||challengeAge>300000)return reply('verification_failed',403);
    const key=await hmac(env.HASH_SECRET,'request:'+email+':'+session.reportId),digest=await hmac(env.HASH_SECRET,JSON.stringify(session));
    const guard=env.MAIL_GUARD.get(env.MAIL_GUARD.idFromName('global-mail-v1'));
    let reserved:GuardResult;
    try{
      const response=await guard.fetch('https://internal/reserve',{method:'POST',body:JSON.stringify({key,digest,recipient:await hmac(env.HASH_SECRET,'recipient:'+email),report:await hmac(env.HASH_SECRET,'report:'+session.reportId),day:new Date(now).toISOString().slice(0,10),now,limit})});reserved=await response.json() as GuardResult;
    }catch{return reply('unavailable',503);}
    if(reserved.status!=='reserved')return reply(reserved.status,reserved.code);
    let accepted=false;
    try{
      const pdf=await generate(report);if(pdf.length>5*1024*1024)throw new Error('PDF too large');
      const mail={from:env.FROM_EMAIL,to:[email],subject:'你的金融探索報告 / Your Finance Discovery Report',
        text:`${BRAND.zh}\n${BRAND.en}\n\n多謝參與金融探索實驗室。你的雙語報告已附上。\nThank you for exploring Finance Discovery Lab. Your bilingual report is attached.\n\n報告編號 / Report ID: ${report.reportId}\n認識財務金融系 / Explore the Department of Finance: ${LINKS.department}\n\n此電郵只用於你主動申請的報告寄送。你沒有加入招生郵件名單。\nThis email fulfils your report request only. You have not joined an admissions mailing list.`,
        attachments:[{filename:`Finance-Discovery-${report.reportId}.pdf`,content:base64(pdf),content_type:'application/pdf'}]};
      const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(mail),signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error('Provider rejected');const data=await response.json() as {id?:unknown};if(typeof data.id!=='string'||!data.id)throw new Error('Provider result incomplete');accepted=true;
      await guard.fetch('https://internal/finish',{method:'POST',body:JSON.stringify({key,accepted:true,now:Date.now()})});
      return reply('accepted',202);
    }catch{
      // Unknown delivery state is retried with the identical Resend key.
      try{await guard.fetch('https://internal/finish',{method:'POST',body:JSON.stringify({key,accepted,now:Date.now()})});}catch{}
      return reply(accepted?'accepted':'provider_failed',accepted?202:502);
    }
  };
}
