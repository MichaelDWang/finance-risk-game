import { BRAND, DISCLAIMER, FIGURE_NOTE, GAMES, LINKS, CORE, bi } from '../../shared/content';
import { buildReport, fmt } from '../../shared/report/model';
import type { Session, GameId } from '../../shared/schema';
import { b, btn, on, icon, external, escape } from './dom';
import { UI } from '../content/ui';
import { mountEmail } from './email';
export function mountResults(root:HTMLElement,s:Session,go:(id:GameId)=>void,restart:()=>void){
  const report=buildReport(s);let active=true,cleanupEmail=()=>{};
  root.innerHTML=`<section class="report-heading">${b(BRAND,'p','institution')}<div class="eyebrow">FIELD NOTES · ${report.dateHK} HKT</div>${b(UI.reportTitle,'h1')}<p class="report-id">${escape(report.reportId)} · v${report.version}</p></section>
  <section class="result-overview"><div class="result-badge">${icon('compass')}</div><div>${b(report.type?.title||UI.incomplete,'h2')}${b(report.type?.text||UI.missing,'p')}${report.missing.map(i=>btn('missing'+i,GAMES[i-1].title,'secondary')).join('')}</div>
  <div class="main-score">${b(UI.tendency,'h3')}<strong>${report.score===null?'—':fmt(report.score)}<small>${report.score===null?'':' / 100'}</small></strong><div class="risk-track">${report.score===null?'':`<span style="left:${report.score}%"></span>`}</div>${b(UI.scale,'p','scale-label')}${b(UI.indexNote,'p','muted')}</div></section>
  ${report.varied?`<aside class="notice">${b(UI.varied,'strong')}<p>${CORE.map((n,i)=>`${n}: ${fmt(report.core[i]!)}`).join(' · ')}</p></aside>`:''}
  <section class="report-section"><div class="section-title"><span class="section-number">01</span>${b(UI.observations,'h2')}</div>${b(UI.observationNote,'p','muted')}<div class="observations">${report.observations.map(o=>`<article class="observation"><div class="observation-head">${b(o.title,'h3')}<strong>${o.value===null?'—':fmt(o.value)}</strong></div><div class="bar" role="img" aria-label="${escape(o.title.zh+' / '+o.title.en+': '+(o.value===null?UI.noData.zh:fmt(o.value)))}"><span style="width:${o.value||0}%"></span></div>${b(o.ends,'p','scale-label')}${b(o.formula,'p','formula')}</article>`).join('')}</div></section>
  <section class="report-section"><div class="section-title"><span class="section-number">02</span>${b(UI.evidence,'h2')}</div><div class="findings">${GAMES.map((g,i)=>`<article><span class="finding-number">${String(g.id).padStart(2,'0')}</span><div>${b(g.title,'h3')}${b(report.summaries[i],'p')}</div>${btn('review'+g.id,UI.redo,'quiet')}</article>`).join('')}</div></section>
  <section class="report-section"><div class="section-title"><span class="section-number">03</span>${b(UI.tips,'h2')}</div><div class="tip-grid">${report.tips.map((t,i)=>`<article><span>${i+1}</span>${b(t,'p')}</article>`).join('')}</div></section>
  ${report.figures.length?`<section class="report-section"><div class="section-title"><span class="section-number">04</span>${b(UI.figures,'h2')}</div><div class="figure-grid">${report.figures.map(m=>`<article class="figure-card"><div class="figure-initials">${m.figure.name.split(' ').map(n=>n[0]).slice(0,2).join('')}</div><h3>${m.figure.name}</h3>${b(m.figure.intro,'p','muted')}${b(m.figure.idea,'p')}${b(m.matched?UI.editorial:UI.compare,'h4')}${b(m.reason,'p')}${b(UI.learn,'h4')}${b(m.figure.learn,'p')}${b(UI.limitation,'h4')}${b(m.figure.limit,'p','muted')}${external(m.figure.url,UI.source)}</article>`).join('')}</div>${b(FIGURE_NOTE,'p','notice')}</section>`:''}
  <section class="report-actions"><div class="actions">${btn('download',UI.download)}${btn('email-open',UI.email,'secondary')}</div><div id="download-status" role="status" aria-live="polite"></div><div id="email-area" hidden></div></section>
  <section class="explore"><div>${b(BRAND,'p','institution')}${b(UI.exploreTitle,'h2')}${b(UI.exploreText,'p')}<div class="explore-links">${external(LINKS.department,UI.department)}${external(LINKS.apply,UI.apply)}${external(LINKS.finance,UI.finance)}${external(LINKS.information,UI.information)}</div></div><div class="qr-area"><div id="qr"></div>${b(UI.department,'small')}</div></section>
  ${b(DISCLAIMER,'p','disclaimer')}<div class="actions">${btn('restart',UI.again,'secondary')}${btn('next-participant',UI.nextPerson,'primary')}</div>`;
  for(const g of GAMES)on(root,'review'+g.id,()=>go(String(g.id) as GameId));for(const n of report.missing)on(root,'missing'+n,()=>go(String(n) as GameId));
  on(root,'restart',restart);on(root,'next-participant',restart);
  on(root,'email-open',()=>{const area=root.querySelector<HTMLElement>('#email-area')!;if(!area.hidden)return;area.hidden=false;cleanupEmail=mountEmail(area,s);area.scrollIntoView({behavior:'auto',block:'center'});});
  on(root,'download',async()=>{
    const button=root.querySelector<HTMLButtonElement>('#download')!,status=root.querySelector('#download-status')!;if(button.disabled)return;button.disabled=true;status.innerHTML=b(UI.generating,'p');
    try{
      const [{generatePdf},font]=await Promise.all([import('../../shared/report/pdf'),fetch(import.meta.env.BASE_URL+'assets/fonts/FinanceLabTC.ttf').then(r=>{if(!r.ok)throw new Error('Font unavailable');return r.arrayBuffer();})]);
      const bytes=await generatePdf(report,new Uint8Array(font));if(!active)return;
      const blob=new Blob([bytes as BlobPart],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Finance-Discovery-${report.reportId}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);status.innerHTML=b(UI.saved,'p');
    }catch{if(active)status.innerHTML=b(UI.failed,'p');}finally{if(active)button.disabled=false;}
  });
  void import('qrcode').then(q=>q.default.toString(LINKS.department,{type:'svg',margin:2,width:140})).then(svg=>{if(active)root.querySelector('#qr')!.innerHTML=svg;}).catch(()=>{});
  return ()=>{active=false;cleanupEmail();};
}
