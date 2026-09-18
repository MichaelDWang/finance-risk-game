import { BALLOON, WALLET_RANGES, TIME, SHIELD_COSTS, VOLATILITY, ROUTES, CONFIDENCE_ROUNDS, CLUES, bi } from '../../shared/content';
import type { Answers, GameId, Session } from '../../shared/schema';
import { randomAt, framingOrder } from '../../shared/random';
import { b, btn, on, icon, coin } from '../components/dom';
import { UI } from '../content/ui';

export function mountGame(root:HTMLElement,id:GameId,s:Session,complete:(a:NonNullable<Answers[GameId]>)=>void){
  let locked=false;
  const finish=(a:NonNullable<Answers[GameId]>)=>{if(locked)return;locked=true;complete(a);};
  const range=(label:ReturnType<typeof bi>,max:number,value:number,step=1)=>`<label class="range-label" for="game-range">${b(label)}</label><input id="game-range" type="range" min="0" max="${max}" step="${step}" value="${value}"/>`;
  const rounds=(n:number,total:number)=>b(UI.round(n,total),'p','eyebrow');
  if(id==='1'){
    const choices:boolean[]=[];let revealed:number|null=null;
    const render=()=>{
      const n=choices.length, i=revealed===null?n:n-1;
      root.innerHTML=`${rounds(i+1,3)}<div class="choice-grid wallets">
      <button id="sure" class="choice" ${revealed!==null?'disabled':''}>${icon('wallet')}${b(UI.certain)}<strong>100</strong>${b(UI.coin)}<small>100%</small></button>
      <button id="chance" class="choice" ${revealed!==null?'disabled':''}>${icon('wallet')}${b(UI.chance)}<strong>${WALLET_RANGES[i].join(' / ')}</strong>${b(UI.coin)}${b(UI.half,'small')}</button></div>
      ${revealed!==null?`<div class="reveal" role="status">${b(UI.outcome(revealed))}</div>${btn('advance',n===3?UI.confirm:UI.nextRound)}`:''}`;
      const choose=(v:boolean)=>{if(revealed!==null)return;choices.push(v);revealed=v?WALLET_RANGES[i][randomAt(s.seed,100+i)<.5?0:1]:100;render();};
      on(root,'sure',()=>choose(false));on(root,'chance',()=>choose(true));
      on(root,'advance',()=>{if(n===3)finish({choices});else{revealed=null;render();}});
    };render();return;
  }
  if(id==='2'){
    const records:NonNullable<Answers['2']>['rounds']=[];let pumps=0,terminal:''|'collect'|'burst'|'limit'='';
    const render=()=>{
      root.innerHTML=`${rounds(records.length+1,2)}<div class="balloon-stage ${terminal==='burst'?'popped':''}"><div class="balloon-art" style="--pump:${pumps}">${icon('balloon')}</div>${coin(terminal==='burst'?0:pumps*5,UI.unbanked)}</div>
      ${!terminal?b(UI.probability(BALLOON[pumps].chance*100),'p','probability'):b(terminal==='burst'?UI.burst:terminal==='limit'?UI.limit:UI.banked(pumps*5),'p','reveal')}
      <div class="actions">${terminal?btn('advance',records.length===1?UI.confirm:UI.nextRound):btn('pump',UI.pump)+btn('collect',UI.collect,'secondary')}</div>
      <details class="probability-table"><summary>${b(UI.table)}</summary><table><thead><tr><th>${b(UI.pumpNo)}</th><th>${b(UI.burstChance)}</th><th>${b(UI.safeGain)}</th></tr></thead><tbody>${BALLOON.map((v,i)=>`<tr><td>${i+1}</td><td>${v.chance*100}%</td><td>${(i+1)*5} (+5)</td></tr>`).join('')}</tbody></table></details>`;
      on(root,'pump',()=>{if(terminal)return;const burst=randomAt(s.seed,200+records.length*10+pumps)<BALLOON[pumps].chance;pumps++;terminal=burst?'burst':pumps===6?'limit':'';render();});
      on(root,'collect',()=>{if(terminal)return;terminal='collect';render();});
      on(root,'advance',()=>{if(!terminal)return;records.push({pumps,end:terminal});if(records.length===2)finish({rounds:records});else{terminal='';pumps=0;render();}});
    };render();return;
  }
  if(id==='3'){
    let chance=50;
    root.innerHTML=`<div class="pockets" id="pockets"></div>${range(UI.allocate,100,chance)}<div class="slider-ends"><span>0</span><span>100</span></div><div class="scenario-preview"><h3>${b(UI.preview)}</h3><div id="preview" class="choice-grid"></div>${b(UI.half,'p')}</div>${btn('confirm',UI.confirm)}`;
    const update=()=>{root.querySelector('#pockets')!.innerHTML=coin(100-chance,UI.keep)+coin(chance,UI.opportunity);root.querySelector('#preview')!.innerHTML=`<div>0× <strong>${100-chance}</strong></div><div>2× <strong>${100+chance}</strong></div>`;};
    root.querySelector<HTMLInputElement>('#game-range')!.oninput=e=>{chance=Number((e.target as HTMLInputElement).value);update();};on(root,'confirm',()=>finish({chance}));update();return;
  }
  if(id==='4'||id==='7'){
    const choices:boolean[]=[];let awaiting=false;
    const render=()=>{
      const n=choices.length, time=TIME[n],cost=SHIELD_COSTS[n];
      root.innerHTML=`${rounds(n+1,3)}<div class="centre-piece">${icon(id==='4'?'clock':'shield')}${b(id==='4'?UI.simulated:UI.pack,'p')}</div><div class="choice-grid">${id==='4'?btn('a',UI.today,'choice')+btn('b',UI.later(time.days,time.coins),'choice'): `<div>${b(UI.shield(cost),'p','price')}${btn('b',UI.protection,'choice')}</div><div>${b(UI.probability(25),'p','price')}${btn('a',UI.noProtection,'choice')}</div>`}</div>`;
      const choose=(v:boolean)=>{if(awaiting)return;awaiting=true;choices.push(v);root.innerHTML=`${b(UI.completed,'h3')}${b(id==='4'?(v?UI.later(time.days,time.coins):UI.today):(v?UI.shield(cost):UI.pack),'p','reveal')}${btn('advance',choices.length===3?UI.confirm:UI.nextRound)}`;on(root,'advance',()=>{if(!awaiting)return;awaiting=false;if(choices.length===3)finish(id==='4'?{wait:choices}:{protect:choices});else render();});};
      on(root,'a',()=>choose(false));on(root,'b',()=>choose(true));
    };render();return;
  }
  if(id==='5'){
    const baskets=[0,0,0];
    const render=()=>{
      const left=12-baskets.reduce((x,y)=>x+y,0);
      root.innerHTML=`${b(UI.available(left),'p','probability')}<div class="basket-grid">${baskets.map((n,i)=>`<div class="basket">${icon('basket')}${b(UI.shop('ABC'[i]),'h3')}<div class="token-dots" aria-hidden="true">${'●'.repeat(n)||'·'}</div><strong>${n}</strong><div class="counter">${btn('minus'+i,UI.minus,'secondary',n===0)}${btn('plus'+i,UI.plus,'secondary',left===0)}</div></div>`).join('')}</div><div class="actions">${btn('equal',UI.equal,'quiet')}${btn('reset',UI.reset,'quiet')}</div>${btn('confirm',UI.confirm,'primary',left!==0)}`;
      for(let i=0;i<3;i++){on(root,'plus'+i,()=>{if(left>0)baskets[i]++;render();root.querySelector<HTMLButtonElement>('#plus'+i)?.focus();});on(root,'minus'+i,()=>{if(baskets[i]>0)baskets[i]--;render();root.querySelector<HTMLButtonElement>('#minus'+i)?.focus();});}
      on(root,'equal',()=>{baskets.fill(4);render();});on(root,'reset',()=>{baskets.fill(0);render();});on(root,'confirm',()=>{if(!left)finish({baskets});});
    };render();return;
  }
  if(id==='6'||id==='9'){
    let level=2;const values=id==='6'?VOLATILITY:ROUTES;
    root.innerHTML=`${id==='6'?range(UI.selectRange,4,level):''}<div class="${id==='6'?'range-cards':'route-cards'}">${values.map((v,i)=>`<button class="${id==='6'?'range-card':'route-card'}" id="level${i}" aria-pressed="${i===level}"><span class="route-name">${id==='6'?String(i+1):b(UI.route('ABCDE'[i]))}</span><svg viewBox="0 0 180 55" aria-hidden="true"><path d="M5 28 Q35 ${28-i*7} 60 28 T115 28 T175 28" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="5" cy="28" r="4"/><circle cx="175" cy="28" r="4"/></svg><strong>${v.join(' / ')}</strong>${b(UI.half,'small')}</button>`).join('')}</div><div class="selected-range" id="selected-range"></div>${btn('confirm',id==='9'?UI.sail:UI.confirm)}`;
    const update=()=>{root.querySelector('#selected-range')!.innerHTML=coin(values[level][0],UI.coin)+coin(values[level][1],UI.coin);for(let i=0;i<5;i++)root.querySelector('#level'+i)!.setAttribute('aria-pressed',String(level===i));};
    const input=root.querySelector<HTMLInputElement>('#game-range');if(input)input.oninput=()=>{level=Number(input.value);update();};
    for(let i=0;i<5;i++)on(root,'level'+i,()=>{level=i;if(input)input.value=String(i);update();});
    on(root,'confirm',()=>{if(id==='6'){finish({level});return;}root.innerHTML=`<div class="sailing">${icon('route')}${b(UI.outcome(values[level][randomAt(s.seed,900)<.5?0:1]),'p','reveal')}${btn('done',UI.confirm)}</div>`;on(root,'done',()=>finish({level}));});update();return;
  }
  if(id==='8'){
    const records:NonNullable<Answers['8']>['rounds']=[];let judgement:boolean|null=null,confidence:50|75|100=50,reveal=false;
    const render=()=>{
      const n=records.length, data=CONFIDENCE_ROUNDS[n];
      root.innerHTML=`${rounds(n+1,3)}<div class="shape-clue" aria-label="${data.icons.map(c=>c==='◆'?'菱形 diamond':'圓形 circle').join(', ')}">${data.icons.map(c=>`<span aria-hidden="true">${c}</span>`).join('')}</div>${b(data.prompt,'h3')}<div class="actions"><button id="yes" class="secondary" aria-pressed="${judgement===true}" ${reveal?'disabled':''}>${b(UI.yes)}</button><button id="no" class="secondary" aria-pressed="${judgement===false}" ${reveal?'disabled':''}>${b(UI.no)}</button></div><fieldset ${reveal?'disabled':''}><legend>${b(UI.confidence)}</legend><div class="confidence-options">${[50,75,100].map(c=>`<label><input type="radio" name="confidence" value="${c}" ${confidence===c?'checked':''}/> ${c}%</label>`).join('')}</div></fieldset>${reveal?b(UI.correct(confidence,data.correct),'p','reveal')+btn('advance',n===2?UI.confirm:UI.nextRound):btn('reveal',UI.reveal,'primary',judgement===null)}`;
      on(root,'yes',()=>{judgement=true;render();});on(root,'no',()=>{judgement=false;render();});
      root.querySelectorAll<HTMLInputElement>('input[name=confidence]').forEach(x=>x.onchange=()=>{confidence=Number(x.value) as 50|75|100;});
      on(root,'reveal',()=>{if(judgement===null)return;reveal=true;render();});
      on(root,'advance',()=>{if(judgement===null)return;records.push({judgement,confidence});if(records.length===3)finish({rounds:records});else{judgement=null;confidence=50;reveal=false;render();}});
    };render();return;
  }
  if(id==='10'){
    const clues:number[]=[];
    const render=()=>{
      root.innerHTML=`<div class="news-card">${icon('search')}${b(UI.hype,'p')}</div><div class="clue-grid">${CLUES.map((c,i)=>`<button id="clue${i}" class="clue-card" aria-expanded="${clues.includes(i)}">${b(c.name,'strong')}${clues.includes(i)?b(c.text):'<span class="clue-mark" aria-hidden="true">?</span>'}</button>`).join('')}</div><div class="actions">${btn('join',UI.join,'secondary')}${btn('wait',UI.investigate,'primary')}${btn('decline',UI.decline,'secondary')}</div>`;
      CLUES.forEach((_,i)=>on(root,'clue'+i,()=>{if(!clues.includes(i))clues.push(i);render();root.querySelector<HTMLButtonElement>('#clue'+i)?.focus();}));
      (['join','wait','decline'] as const).forEach(decision=>on(root,decision,()=>finish({clues:[...clues].sort(),decision})));
    };render();return;
  }
  if(id==='11'){
    const order=framingOrder(s.seed), choices:Partial<{keep:boolean;lose:boolean}>={};let n=0;
    const render=()=>{
      const key=order[n],keep=key==='keep';
      root.innerHTML=`${rounds(n+1,2)}<div class="ticket-art">${icon('ticket')}${b(keep?UI.framedKeep:UI.framedLose,'p')}</div>${b(UI.thirds,'p','muted')}<div class="choice-grid">${btn('sure',keep?UI.sureKeep:UI.sureLose,'choice')}${btn('chance',keep?UI.chanceKeep:UI.chanceLose,'choice')}</div>`;
      let chosen=false;const choose=(v:boolean)=>{if(chosen)return;chosen=true;choices[key]=v;n++;root.innerHTML=`${b(UI.completed,'h3')}${b(keep?(v?UI.chanceKeep:UI.sureKeep):(v?UI.chanceLose:UI.sureLose),'p','reveal')}${btn('advance',n===2?UI.confirm:UI.nextRound)}`;on(root,'advance',()=>{if(n===2)finish(choices as {keep:boolean;lose:boolean});else render();});};on(root,'sure',()=>choose(false));on(root,'chance',()=>choose(true));
    };render();return;
  }
  if(id==='12'){
    let buffer=20;
    root.innerHTML=`<div class="budget-bars" id="budget-bars"></div><div class="budget-numbers" id="budget-numbers"></div>${range(UI.budget,60,buffer)}<div class="slider-ends"><span>0</span><span>60</span></div>${btn('confirm',UI.surprise)}`;
    const update=()=>{root.querySelector('#budget-bars')!.innerHTML=`<span style="flex:40">40</span><span style="flex:${60-buffer}">${60-buffer||''}</span><span style="flex:${buffer}">${buffer||''}</span>`;root.querySelector('#budget-numbers')!.innerHTML=coin(40,UI.fixed)+coin(60-buffer,UI.activities)+coin(buffer,UI.buffer);};
    root.querySelector<HTMLInputElement>('#game-range')!.oninput=e=>{buffer=Number((e.target as HTMLInputElement).value);update();};on(root,'confirm',()=>finish({buffer}));update();
  }
}
