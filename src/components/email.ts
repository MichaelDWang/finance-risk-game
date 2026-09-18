import type { Session } from '../../shared/schema';
import { b, btn, on } from './dom';
import { UI } from '../content/ui';
type Turnstile = {render:(el:HTMLElement,o:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void};
declare global {interface Window {turnstile?:Turnstile}}
let scriptPromise:Promise<void>|null=null;
function loadVerification(){
  if(window.turnstile)return Promise.resolve();
  if(!scriptPromise)scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    const timer=setTimeout(()=>{script.remove();scriptPromise=null;reject(new Error('Verification unavailable'));},15000);
    script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);scriptPromise=null;script.remove();reject(new Error('Verification unavailable'));};document.head.append(script);
  });return scriptPromise;
}
export function mountEmail(root:HTMLElement,session:Session){
  const api=import.meta.env.VITE_EMAIL_API_URL,sitekey=import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if(!api||!sitekey||!/^https:\/\//.test(api)){root.innerHTML=b(UI.unavailable,'p','notice');return ()=>{};}
  let token='',widget='',disposed=false;const abort=new AbortController();
  root.innerHTML=`<form id="email-form" novalidate><label for="email-address">${b(UI.emailLabel)}</label><input type="email" id="email-address" name="email" autocomplete="off" maxlength="254" required/><label class="consent"><input type="checkbox" id="email-consent" required/>${b(UI.consent)}</label>${b(UI.verify,'p','muted')}<div id="verification"></div>${btn('retry-verification',UI.retryVerify,'quiet')}<button type="submit" id="send-report" class="primary">${b(UI.send)}</button><div id="email-status" role="status" aria-live="polite"></div></form>`;
  const status=(text:typeof UI.failed)=>{root.querySelector('#email-status')!.innerHTML=b(text,'p');};
  const init=async()=>{try{await loadVerification();if(disposed)return;if(widget)window.turnstile?.remove(widget);token='';widget=window.turnstile!.render(root.querySelector('#verification')!,{sitekey,action:'send-report',callback:(t:string)=>{token=t;},'expired-callback':()=>{token='';status(UI.verify);},'error-callback':()=>{token='';status(UI.failed);},theme:'light'});}catch{if(!disposed)status(UI.failed);}};
  on(root,'retry-verification',()=>void init());void init();
  root.querySelector<HTMLFormElement>('#email-form')!.onsubmit=async e=>{
    e.preventDefault();const field=root.querySelector<HTMLInputElement>('#email-address')!,consent=root.querySelector<HTMLInputElement>('#email-consent')!,button=root.querySelector<HTMLButtonElement>('#send-report')!;
    if(!field.checkValidity()||!consent.checked||!token){status(UI.invalid);return;}
    if(button.disabled)return;button.disabled=true;status(UI.sending);
    try{
      const response=await fetch(api.replace(/\/$/,'')+'/api/send-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:field.value.trim(),consent:true,token,session}),signal:abort.signal});
      const data=await response.json() as {status?:string};if(disposed)return;
      if(response.ok&&(data.status==='accepted'||data.status==='already_accepted')){status(UI.accepted);field.value='';consent.checked=false;}
      else status(response.status===429?UI.rate:response.status===503?UI.unavailable:response.status===400||response.status===403?UI.invalid:UI.failed);
    }catch{if(!disposed)status(UI.failed);}finally{if(!disposed){button.disabled=false;token='';if(widget)window.turnstile?.reset(widget);}}
  };
  return ()=>{disposed=true;token='';abort.abort();if(widget)window.turnstile?.remove(widget);root.replaceChildren();};
}
