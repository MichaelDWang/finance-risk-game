import './style.css';
import { BRAND,TITLE,DISCLAIMER,GAMES,bi } from '../shared/content';
import { newSession,sessionSchema,type Session,type GameId,type Answers } from '../shared/schema';
import { buildReport } from '../shared/report/model';
import { mountGame } from './games';
import { mountResults } from './components/results';
import { b,btn,on,icon } from './components/dom';
import { UI } from './content/ui';
type View='home'|'intro'|'game'|'results';
const app=document.querySelector<HTMLElement>('#app')!, KEY='finance-lab-session-v1';
let session=newSession(),view:View='home',game:GameId='1',language='bi',cleanup=()=>{},storageError=false;
try{const raw=sessionStorage.getItem(KEY);if(raw){const cached=JSON.parse(raw);const parsed=sessionSchema.safeParse(cached.session);if(parsed.success){session=parsed.data;if(['home','intro','game','results'].includes(cached.view))view=cached.view;if(GAMES.some(g=>String(g.id)===cached.game))game=cached.game;if(['bi','zh','en'].includes(cached.language))language=cached.language;}}}catch{try{sessionStorage.removeItem(KEY);}catch{storageError=true;}}
function persist(){try{sessionStorage.setItem(KEY,JSON.stringify({session,view,game,language}));}catch{storageError=true;}}
function reset(){cleanup();session=newSession();view='home';game='1';try{sessionStorage.removeItem(KEY);}catch{}render();}
function navigate(next:View,id?:GameId){view=next;if(id)game=id;persist();render();window.scrollTo({top:0,behavior:'instant'});app.querySelector<HTMLElement>('h1')?.focus();}
function identity(){return `<div class="identity">${icon('compass')}<div>${b(TITLE,'strong')}${b(BRAND,'span','institution')}</div></div>`;}
function render(){
  cleanup();cleanup=()=>{};document.documentElement.dataset.language=language;document.documentElement.lang=language==='en'?'en-GB':'zh-Hant-HK';
  app.innerHTML=`<a class="skip-link" href="#main">跳至內容 / Skip to content</a><header class="site-header">${identity()}<div class="language-switch" aria-label="語言 / Language"><button data-lang="bi" aria-pressed="${language==='bi'}">雙語</button><button data-lang="zh" aria-pressed="${language==='zh'}">繁中</button><button data-lang="en" aria-pressed="${language==='en'}">English</button></div></header><main id="main" class="${view}"></main><footer class="site-footer">${b(BRAND,'p')}<span>FINANCE DISCOVERY LAB · INFORMATION DAY</span></footer>`;
  app.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(el=>el.onclick=()=>{language=el.dataset.lang!;document.documentElement.dataset.language=language;document.documentElement.lang=language==='en'?'en-GB':'zh-Hant-HK';app.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.lang===language)));persist();});
  const main=app.querySelector<HTMLElement>('main')!;
  if(view==='home'){
    main.innerHTML=`<section class="start-surface"><div class="start-copy"><p class="eyebrow">INFORMATION DAY / 2026</p>${b(UI.how,'h1')}${b(UI.lead,'p','lead')}<div class="start-facts"><span>${icon('clock')}${b(UI.time)}</span><span>${icon('compass')}${b(UI.noLogin)}</span></div>${btn('start',UI.start)}${b(UI.virtual,'p','muted')}</div><div class="harbour-map"><div class="map-caption">FINANCE DISCOVERY LAB <span>EXPLORE YOUR CHOICES</span></div><svg class="map-lines" viewBox="0 0 500 560" aria-hidden="true"><path d="M90 60C480 20 480 190 250 170S-20 305 220 320S560 460 325 495" fill="none" stroke="#99bdb7" stroke-width="2" stroke-dasharray="6 9"/><path d="m390 65 10 16 8-16m-360 410 10 16 8-16" fill="none" stroke="#65958d" stroke-width="2"/></svg><div class="map-islands">${[0,3,5,8,11].map((n,i)=>`<div class="island island-${i}">${icon(GAMES[n].icon)}<span>${String(n+1).padStart(2,'0')}</span>${b(GAMES[n].title)}</div>`).join('')}</div><div class="map-compass">${icon('compass')}<span>N</span></div><div class="map-stamp"><strong>12</strong>${b(bi('站小探索','stops to explore'))}</div></div></section><div class="home-bottom">${b(DISCLAIMER,'p','disclaimer')}<details><summary>${b(bi('資料與私隱','Data and privacy'))}</summary>${b(UI.privacy,'p')}</details></div>`;
    on(main,'start',()=>navigate('intro'));
  } else if(view==='intro'){
    main.innerHTML=`<section class="intro-card"><span class="eyebrow">BEFORE YOU SET SAIL</span>${b(UI.introTitle,'h1')}${b(UI.instructions,'p')}${b(UI.skipNote,'p','notice')}<fieldset><legend>${b(UI.role)}</legend><div class="role-options">${(['student','parent','other','unspecified'] as const).map((r,i)=>`<label><input type="radio" name="role" value="${r}" ${session.role===r?'checked':''}/>${b(UI.roles[i])}</label>`).join('')}</div>${b(UI.roleNote,'p','muted')}</fieldset>${btn('begin',UI.start)}${b(UI.privacy,'p','muted')}</section>`;
    main.querySelectorAll<HTMLInputElement>('input[name=role]').forEach(el=>el.onchange=()=>{session.role=el.value as Session['role'];persist();});on(main,'begin',()=>navigate('game','1'));
  } else if(view==='game'){
    const g=GAMES[Number(game)-1],answer=session.answers[game],count=Object.values(session.answers).filter(Boolean).length;
    main.innerHTML=`<aside class="expedition-sidebar"><div class="sidebar-heading">${b(UI.expedition,'h2')}<strong>${count}<small> / 12</small></strong></div><div class="progress-track"><span style="width:${count/12*100}%"></span></div><nav>${GAMES.map(item=>`<button id="stop${item.id}" class="stop ${item.id===Number(game)?'current':''}" ${item.id===Number(game)?'aria-current="step"':''}><span>${session.answers[String(item.id) as GameId]?'✓':String(item.id).padStart(2,'0')}</span>${b(item.title)}</button>`).join('')}</nav>${btn('report-nav',UI.results,'quiet')}${btn('reset-nav',UI.nextPerson,'quiet')}</aside><section class="game-panel"><div class="game-topline"><span class="eyebrow">EXPLORATION ${String(game).padStart(2,'0')} / 12</span>${b(UI.welcome[session.role==='student'?0:session.role==='parent'?1:2],'small')}</div><div class="game-title">${icon(g.icon)}${b(g.title,'h1')}</div>${b(g.rule,'p','game-rule')}<div id="game-content" class="game-content"></div><div class="game-bottom">${btn('skip',UI.skip,'quiet')}${b(UI.choicesOnly,'small')}</div></section>`;
    for(const item of GAMES)on(main,'stop'+item.id,()=>navigate('game',String(item.id) as GameId));on(main,'report-nav',()=>navigate('results'));on(main,'reset-nav',reset);
    const gameRoot=main.querySelector<HTMLElement>('#game-content')!;
    const next=()=>Number(game)===12?navigate('results'):navigate('game',String(Number(game)+1) as GameId);
    on(main,'skip',()=>{session.answers[game]=null;session.reportId=crypto.randomUUID();session.createdAt=new Date().toISOString();next();});
    if(answer){
      const r=buildReport(session);
      gameRoot.innerHTML=`<div class="completion-mark">✓</div>${b(UI.completed,'h2')}${b(r.summaries[Number(game)-1],'p','reveal')}${game==='5'?`<div class="shock-visual" aria-hidden="true">A: −${session.answers['5']!.baskets[0]} <span>B + C: ${12-session.answers['5']!.baskets[0]}</span></div>`:''}${game==='11'?`<div class="equivalent">${b(bi('兩種說法，相同的最終選項','Both frames have the same final options'))}<div>${b(bi('保留表述','Keep frame'))}<strong>■ 20　｜　● 60　○ 0　○ 0</strong></div><div>${b(bi('失去表述','Lose frame'))}<strong>■ 20　｜　● 60　○ 0　○ 0</strong></div>${b(bi('■ 確定結果；右方三個圓各佔1/3機會。','■ A certain outcome; each of the three circles on the right represents a 1/3 chance.'))}</div>`:''}${game==='12'?'<div class="shock-visual">−20</div>':''}${b(g.lesson,'p','lesson')}<div class="actions">${btn('next',Number(game)===12?UI.results:UI.next)}${btn('redo',UI.redo,'secondary')}</div>`;
      on(main,'next',next);on(main,'redo',()=>{delete session.answers[game];session.reportId=crypto.randomUUID();session.createdAt=new Date().toISOString();persist();render();});
    }else mountGame(gameRoot,game,session,a=>{(session.answers as Record<GameId,Answers[GameId]>)[game]=a;session.reportId=crypto.randomUUID();session.createdAt=new Date().toISOString();persist();render();});
  } else cleanup=mountResults(main,session,id=>navigate('game',id),reset);
  main.querySelectorAll('h1').forEach(h=>h.setAttribute('tabindex','-1'));
  if(storageError)main.insertAdjacentHTML('afterbegin',b(UI.storageError,'p','notice'));
}
render();
