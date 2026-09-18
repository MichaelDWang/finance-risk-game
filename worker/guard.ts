// One globally named Durable Object serialises all mail reservations.
// Only keyed hashes and short-lived counters are stored, never addresses or answers.
import type { DurableObjectState } from '@cloudflare/workers-types';
export type Reservation={key:string;digest:string;recipient:string;report:string;day:string;now:number;limit:number};
export type GuardResult={status:string;code:number};
export interface AtomicStore {
  get<T>(key:string):T|undefined;
  put(key:string,value:unknown,expires:number):void;
  purge(now:number):void;
}
type RecordState={digest:string;state:'pending'|'accepted'|'retry';lease:number;started:number;expires:number};
export function reserve(store:AtomicStore,r:Reservation):GuardResult{
  store.purge(r.now);const existing=store.get<RecordState>('request:'+r.key);
  if(existing){
    if(existing.digest!==r.digest)return {status:'conflict',code:409};
    if(existing.state==='accepted')return {status:'already_accepted',code:200};
    if(existing.lease>r.now)return {status:'pending',code:409};
    // Resend keys expire after 24h. Never retry an ambiguous request past 23h.
    if(r.now-existing.started>23*3600000)return {status:'expired',code:409};
  }
  if(!existing&&(store.get<number>('recipient:'+r.recipient)||0)>r.now)return {status:'limited',code:429};
  if(!existing&&(store.get<number>('report:'+r.report)||0)>r.now)return {status:'limited',code:429};
  const count=store.get<number>('day:'+r.day)||0;
  if(count>=r.limit)return {status:'limited',code:429};
  const expires=existing?.expires||r.now+48*3600000;
  store.put('day:'+r.day,count+1,r.now+48*3600000);
  store.put('request:'+r.key,{digest:r.digest,state:'pending',lease:r.now+120000,started:existing?.started||r.now,expires},expires);
  store.put('recipient:'+r.recipient,r.now+600000,r.now+600000);
  store.put('report:'+r.report,r.now+600000,r.now+600000);
  return {status:'reserved',code:200};
}
export function finishReservation(store:AtomicStore,key:string,accepted:boolean,now:number){
  const record=store.get<RecordState>('request:'+key);if(!record)return;
  // A delayed failure must never overwrite an accepted state.
  if(record.state==='accepted')return;
  store.put('request:'+key,{...record,state:accepted?'accepted':'retry',lease:accepted?0:now+30000},record.expires);
}
export class MailGuard {
  private store:AtomicStore;
  constructor(private state:DurableObjectState){
    state.storage.sql.exec('CREATE TABLE IF NOT EXISTS guard (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)');
    this.store={
      get:<T>(key:string)=>{const rows=[...state.storage.sql.exec<{value:string}>('SELECT value FROM guard WHERE key = ?',key)];return rows[0]?JSON.parse(rows[0].value) as T:undefined;},
      put:(key,value,expires)=>{state.storage.sql.exec('INSERT INTO guard(key,value,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,expires=excluded.expires',key,JSON.stringify(value),expires);},
      purge:now=>{state.storage.sql.exec('DELETE FROM guard WHERE expires <= ?',now);},
    };
  }
  async fetch(req:Request){
    const path=new URL(req.url).pathname;
    if(path==='/reserve'){
      const data=await req.json() as Reservation;
      const out=this.state.storage.transactionSync(()=>reserve(this.store,data));
      await this.state.storage.setAlarm(Date.now()+3600000);
      return Response.json(out,{status:out.code});
    }
    if(path==='/finish'){
      const d=await req.json() as {key:string;accepted:boolean;now:number};
      this.state.storage.transactionSync(()=>finishReservation(this.store,d.key,d.accepted,d.now));
      return Response.json({ok:true});
    }
    return new Response(null,{status:404});
  }
  async alarm(){
    this.store.purge(Date.now());
    const rows=[...this.state.storage.sql.exec<{n:number}>('SELECT COUNT(*) as n FROM guard')];
    if(rows[0].n)await this.state.storage.setAlarm(Date.now()+3600000);
  }
}
