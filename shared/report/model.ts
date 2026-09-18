import { bi, type Bi, CONFIDENCE_ROUNDS, GAMES, SHIELD_COSTS, VOLATILITY, ROUTES, WALLET_RANGES, CLUES } from '../content';
import type { Session } from '../schema';
import { score, percent, mean, diversity } from '../scoring';
import { randomAt } from '../random';
import { matchFigures } from './figures';
export const fmt = (n:number) => Number(n.toFixed(1)).toString();
export const EMPTY = bi('未完成；沒有推算。','Not completed; no value inferred.');
export type Observation = {title:Bi;value:number|null;formula:Bi;ends:Bi};
export function buildReport(s:Session){
  const a=s.answers, result=score(a);
  const risk=[result.core[0],result.core[1],result.core[3]];
  const observations:Observation[]=[
    {title:bi('風險選擇','Risk choices'),value:risk.every(x=>x!==null)?mean(risk as number[]):null,formula:bi('第1、3、9關指標的平均。','Mean of Games 1, 3 and 9.'),ends:bi('0 確定選擇較多 · 100 機會選擇較多','0 More certainty · 100 More chance choices')},
    {title:bi('波動接受','Comfort with variation'),value:result.core[2],formula:bi('第6關：所選檔位 × 25。','Game 6: selected level × 25.'),ends:bi('0 窄範圍 · 100 寬範圍','0 Narrow range · 100 Wide range')},
    {title:bi('等待意願','Willingness to wait'),value:a['4']?percent(a['4'].wait):null,formula:bi('第4關：等待次數 ÷ 3 × 100。','Game 4: waits ÷ 3 × 100.'),ends:bi('0 全選即日 · 100 全選等待','0 All today · 100 All later')},
    {title:bi('配置分散','Spread of allocation'),value:a['5']?diversity(a['5'].baskets):null,formula:bi('第5關：100 × (1 − 各比例平方之和) ÷ (1 − 1/3)。','Game 5: 100 × (1 − sum of squared shares) ÷ (1 − 1/3).'),ends:bi('0 單一小店 · 100 平均分配','0 One shop · 100 Equal shares')},
    {title:bi('查看資訊','Information viewed'),value:a['10']?a['10'].clues.length/3*100:null,formula:bi('第10關：翻開線索數 ÷ 3 × 100。','Game 10: clues opened ÷ 3 × 100.'),ends:bi('0 未翻閱 · 100 三張全翻閱','0 None opened · 100 All three opened')},
    {title:bi('預留緩衝','Buffer reserved'),value:a['12']?a['12'].buffer/60*100:null,formula:bi('第12關：備用金幣 ÷ 60 × 100。','Game 12: buffer coins ÷ 60 × 100.'),ends:bi('0 無備用 · 100 餘額全作備用','0 No buffer · 100 All 60 reserved')},
  ];
  const summaries:Bi[]=GAMES.map(()=>EMPTY);
  if(a['1']) summaries[0]=bi(`選擇：${a['1'].choices.filter(Boolean).length}/3次機會錢包。隨機示例結果：${a['1'].choices.map((c,i)=>c?WALLET_RANGES[i][randomAt(s.seed,100+i)<.5?0:1]:100).join('／')}枚；不影響分數。`,`Choices: ${a['1'].choices.filter(Boolean).length}/3 chance wallets. Illustrative outcomes: ${a['1'].choices.map((c,i)=>c?WALLET_RANGES[i][randomAt(s.seed,100+i)<.5?0:1]:100).join(' / ')} coins; not scored.`);
  if(a['2']) summaries[1]=bi(`主動收集${a['2'].rounds.filter(r=>r.end==='collect').length}輪，爆破中斷${a['2'].rounds.filter(r=>r.end==='burst').length}輪，達上限${a['2'].rounds.filter(r=>r.end==='limit').length}輪；未納入主指數。`,`${a['2'].rounds.filter(r=>r.end==='collect').length} deliberate collections, ${a['2'].rounds.filter(r=>r.end==='burst').length} bursts, ${a['2'].rounds.filter(r=>r.end==='limit').length} limits reached; excluded from the main index.`);
  if(a['3']) summaries[2]=bi(`選擇：機會口袋${a['3'].chance}枚；最終總額可能是${100-a['3'].chance}或${100+a['3'].chance}枚，各50%。`,`Choice: ${a['3'].chance} in the chance pocket; final totals ${100-a['3'].chance} or ${100+a['3'].chance}, each at 50%.`);
  if(a['4']) summaries[3]=bi(`選擇：${a['4'].wait.filter(Boolean).length}/3次等待。這是本次等待意願。`,`Choice: waited ${a['4'].wait.filter(Boolean).length}/3 times. This describes waiting in this activity.`);
  if(a['5']) summaries[4]=bi(`配置${a['5'].baskets.join('／')}。教學衝擊：小店A的${a['5'].baskets[0]}枚損失；餘下${12-a['5'].baskets[0]}枚。`,`Allocation ${a['5'].baskets.join(' / ')}. Teaching shock: shop A loses ${a['5'].baskets[0]} tokens; ${12-a['5'].baskets[0]} remain.`);
  if(a['6']) summaries[5]=bi(`選擇：接受${VOLATILITY[a['6'].level].join('／')}枚，各50%機會。自述波動指標${a['6'].level*25}。`,`Choice: ${VOLATILITY[a['6'].level].join(' / ')} coins, each at 50%. Stated variation indicator ${a['6'].level*25}.`);
  if(a['7']) summaries[6]=bi(`保障價格5／10／20枚：${a['7'].protect.map(v=>v?'購買':'不買').join('／')}。比較成本與安心。`,`Protection at 5 / 10 / 20 coins: ${a['7'].protect.map(v=>v?'buy':'decline').join(' / ')}. Compare cost and reassurance.`);
  if(a['8']) summaries[7]=bi(`把握${a['8'].rounds.map(r=>r.confidence+'%').join('／')}；本次判斷吻合${a['8'].rounds.filter((r,i)=>r.judgement===CONFIDENCE_ROUNDS[i].correct).length}/3。不是能力評分。`,`Confidence ${a['8'].rounds.map(r=>r.confidence+'%').join(' / ')}; ${a['8'].rounds.filter((r,i)=>r.judgement===CONFIDENCE_ROUNDS[i].correct).length}/3 judgements matched. Not an ability score.`);
  if(a['9']) summaries[8]=bi(`選擇航線${'ABCDE'[a['9'].level]}：${ROUTES[a['9'].level].join('／')}枚，各50%；平均200枚。`,`Route ${'ABCDE'[a['9'].level]}: ${ROUTES[a['9'].level].join(' / ')} coins, each at 50%; mean 200.`);
  if(a['10']) summaries[9]=bi(`查看${a['10'].clues.length}/3張線索${a['10'].clues.length?'（'+a['10'].clues.map(i=>CLUES[i].name.zh).join('、')+'）':''}；決定${{join:'參與',wait:'再查證',decline:'不參與'}[a['10'].decision]}。`,`Opened ${a['10'].clues.length}/3 clues${a['10'].clues.length?' ('+a['10'].clues.map(i=>CLUES[i].name.en).join(', ')+')':''}; chose to ${{join:'join',wait:'investigate further',decline:'decline'}[a['10'].decision]}.`);
  if(a['11']) summaries[10]=bi(`兩種措辭下選擇${a['11'].keep===a['11'].lose?'相同':'不同'}。等價結果：確定剩20，或1/3剩60、2/3剩0。`,`Choices ${a['11'].keep===a['11'].lose?'matched':'differed'} across wording. Equivalent outcomes: 20 certain, or 1/3 chance of 60 and 2/3 of 0.`);
  if(a['12']) summaries[11]=bi(`選擇：備用${a['12'].buffer}枚、活動${60-a['12'].buffer}枚。20枚教學支出後${a['12'].buffer>=20?'備用餘下'+(a['12'].buffer-20)+'枚':'尚欠'+(20-a['12'].buffer)+'枚，須調整活動'}。`,`Choice: buffer ${a['12'].buffer}, activities ${60-a['12'].buffer}. After the 20-coin teaching expense, ${a['12'].buffer>=20?(a['12'].buffer-20)+' buffer coins remain':(20-a['12'].buffer)+' coins must come from adjusted activities'}.`);
  const tips:Bi[]=[
    a['3'] ? bi(`你把${a['3'].chance}枚放入機會口袋。練習先寫出最好及最差結果，再問損失是否可承受。`,`You put ${a['3'].chance} coins in the chance pocket. Practise writing down both extremes and asking whether a loss is affordable.`) : bi('第3關未完成。先比較兩種最終結果，再探索你接受的範圍。','Game 3 is missing. Compare both final outcomes before exploring your accepted range.'),
    a['10'] ? bi(`你查看${a['10'].clues.length}張線索。下一次可逐項檢查來源、費用及可能損失，並留意仍缺少甚麼。`,`You opened ${a['10'].clues.length} clues. Next time, check sources, fees and possible losses, and note what is still unknown.`) : bi('第10關未完成。練習把來源、成本及風險分開查證。','Game 10 is missing. Practise checking sources, costs and risks separately.'),
    a['12'] ? bi(`你預留${a['12'].buffer}枚備用。試想意外支出改成10或30枚時，哪些活動需要調整。`,`You reserved ${a['12'].buffer} coins. Consider which activities would change if the surprise expense were 10 or 30 coins.`) : bi('第12關未完成。試把固定需要、可選活動及備用分開規劃。','Game 12 is missing. Try planning fixed needs, optional activities and a buffer separately.'),
  ];
  return {
    version:s.version, reportId:s.reportId, createdAt:s.createdAt,
    dateHK:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s.createdAt)),
    complete:result.value!==null, completedCount:Object.values(a).filter(Boolean).length,
    score:result.value, type:result.type, missing:result.missing, core:result.core, varied:result.varied,
    observations, summaries, tips, figures:result.value===null?[]:matchFigures(a),
  };
}
export type ReportModel = ReturnType<typeof buildReport> & { synthetic?:boolean };
