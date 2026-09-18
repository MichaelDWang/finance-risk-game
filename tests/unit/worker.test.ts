import { describe,it,expect,vi } from 'vitest';
import { makeHandler,type Env } from '../../worker/handler';
import { reserve,finishReservation,type AtomicStore } from '../../worker/guard';
import { fixture } from '../fixtures';
// Test-only storage double. Production uses transactional Durable Object SQLite.
function memory():AtomicStore {const m=new Map<string,{value:unknown;expires:number}>();return {get:<T>(k:string)=>m.get(k)?.value as T|undefined,put:(k,v,expires)=>{m.set(k,{value:v,expires});},purge:n=>{for(const[k,v]of m)if(v.expires<=n)m.delete(k);}};}
function setup(options:{verify?:object;provider?:number;quota?:number}={}){
  const store=memory(),sent:RequestInit[]=[];
  const stub={fetch:async(url:string,init:RequestInit)=>{const b=JSON.parse(String(init.body));if(url.endsWith('/reserve')){const r=reserve(store,b);return Response.json(r,{status:r.code});}finishReservation(store,b.key,b.accepted,b.now);return Response.json({ok:true});}};
  const env={RESEND_API_KEY:'unit-test-only',TURNSTILE_SECRET_KEY:'unit-test-only',HASH_SECRET:'unit-test-only-secret-with-at-least-32-characters',FROM_EMAIL:'reports@example.invalid',ALLOWED_ORIGINS:'https://example.github.io',TURNSTILE_HOSTNAMES:'example.github.io',DAILY_SEND_LIMIT:String(options.quota??200),MAIL_GUARD:{idFromName:()=>({}),get:()=>stub}} as unknown as Env;
  const fetcher=vi.fn(async(url:RequestInfo|URL,init?:RequestInit)=>{
    if(String(url).includes('siteverify'))return Response.json(options.verify||{success:true,hostname:'example.github.io',action:'send-report',challenge_ts:new Date().toISOString()});
    sent.push(init!);return Response.json({id:'synthetic-provider-id'},{status:options.provider||200});
  });
  const generate=vi.fn(async(_report:ReturnType<typeof import('../../shared/report/model').buildReport>)=>new TextEncoder().encode('%PDF-test-only'));
  const handler=makeHandler(generate,fetcher as typeof fetch);
  const data=()=>({email:'participant@example.invalid',consent:true,token:'unit-test-token',session:{...fixture('middle'),createdAt:new Date().toISOString()}});
  const request=(body:unknown,origin='https://example.github.io')=>new Request('https://worker.example.invalid/api/send-report',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  return {store,env,handler,data,request,fetcher,sent,generate};
}
describe('mail validation and provider states (no real sends)',()=>{
  it('fails closed with missing credentials',async()=>{const t=setup();t.env.RESEND_API_KEY='';expect((await t.handler(t.request(t.data()),t.env)).status).toBe(503);expect(t.fetcher).not.toHaveBeenCalled();});
  it('accepts only the exact frontend origin, excluding its project path',async()=>{const t=setup();expect((await t.handler(t.request(t.data(),'https://example.github.io/finance-risk-game/'),t.env)).status).toBe(403);expect((await t.handler(t.request(t.data(),'https://attacker.invalid'),t.env)).status).toBe(403);});
  it('rejects arbitrary attachments, recipients, body and client-computed scores',async()=>{const t=setup();for(const extra of [{attachments:[]},{to:['x@example.invalid']},{html:'x'},{score:100},{figures:[]}])expect((await t.handler(t.request({...t.data(),...extra}),t.env)).status).toBe(400);});
  it('rejects email injection, missing consent and unsupported versions',async()=>{const t=setup();for(const change of [{email:'x@example.invalid,y@example.invalid'},{email:'bad'},{consent:false}])expect((await t.handler(t.request({...t.data(),...change}),t.env)).status).toBe(400);const d=t.data();expect((await t.handler(t.request({...d,session:{...d.session,version:'2.0.0'}}),t.env)).status).toBe(400);});
  it('rejects large, malformed and incomplete requests',async()=>{const t=setup();expect((await t.handler(t.request({payload:'x'.repeat(17000)}),t.env)).status).toBe(413);const d=t.data();d.session.answers['1']=null;expect((await t.handler(t.request(d),t.env)).status).toBe(400);});
  it.each([{success:false},{success:true,hostname:'attacker.invalid',action:'send-report'},{success:true,hostname:'example.github.io',action:'other'},{success:true,hostname:'example.github.io',action:'send-report',challenge_ts:'2000-01-01T00:00:00.000Z'}])('rejects expired or mismatched verification',async verify=>{const t=setup({verify});expect((await t.handler(t.request(t.data()),t.env)).status).toBe(403);expect(t.generate).not.toHaveBeenCalled();});
  it('recomputes, fixes the template and sends only to the requested recipient',async()=>{const t=setup(),d=t.data();const res=await t.handler(t.request(d),t.env);expect(res.status).toBe(202);expect(await res.json()).toEqual({status:'accepted'});expect(t.generate.mock.calls[0][0].score).toBeCloseTo(54.16667);const payload=JSON.parse(String(t.sent[0].body));expect(payload.to).toEqual([d.email]);expect(payload.from).toBe(t.env.FROM_EMAIL);expect(payload.attachments).toHaveLength(1);expect(payload.subject).toContain('金融探索報告');});
  it('deduplicates retries and rejects a changed report under the same id',async()=>{const t=setup(),d=t.data();await t.handler(t.request(d),t.env);expect(await (await t.handler(t.request(d),t.env)).json()).toEqual({status:'already_accepted'});expect(t.sent).toHaveLength(1);d.session.answers['3']={chance:99};expect((await t.handler(t.request(d),t.env)).status).toBe(409);});
  it('returns an honest provider failure without fake acceptance',async()=>{const t=setup({provider:500});expect((await t.handler(t.request(t.data()),t.env)).status).toBe(502);});
  it('enforces recipient cooldown and total quotas',async()=>{const t=setup({quota:1}),d=t.data();await t.handler(t.request(d),t.env);d.session.reportId=crypto.randomUUID();expect((await t.handler(t.request(d),t.env)).status).toBe(429);d.email='different@example.invalid';expect((await t.handler(t.request(d),t.env)).status).toBe(429);});
});
describe('reservation policy',()=>{
  it('reserves atomically, supports bounded retries, expires records and never downgrades acceptance',()=>{
    const store=memory(),r={key:'a',digest:'b',recipient:'c',report:'d',day:'day',now:1000000,limit:5};
    expect(reserve(store,r).status).toBe('reserved');expect(reserve(store,r).status).toBe('pending');
    finishReservation(store,'a',false,r.now);expect(reserve(store,{...r,now:r.now+30001}).status).toBe('reserved');
    finishReservation(store,'a',true,r.now+31000);finishReservation(store,'a',false,r.now+32000);expect(reserve(store,{...r,now:r.now+40000}).status).toBe('already_accepted');
    store.purge(r.now+48*3600000+1);expect(store.get('request:a')).toBeUndefined();
  });
  it('never retries unknown provider state beyond its idempotency window',()=>{const store=memory(),r={key:'a',digest:'b',recipient:'c',report:'d',day:'day',now:1000000,limit:5};reserve(store,r);expect(reserve(store,{...r,now:r.now+23*3600000+1}).status).toBe('expired');});
});
