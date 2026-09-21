export type Bi = { zh: string; en: string };
export const bi = (zh: string, en: string): Bi => ({ zh, en });
export const VERSION = '1.0.0';
export const BRAND = bi('香港珠海學院｜商學院｜財務金融系', 'Department of Finance · Faculty of Business · Hong Kong Chu Hai College');
export const TITLE = bi('金融探索實驗室', 'Finance Discovery Lab');
export const currentYearHK = (date = new Date()) => new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Hong_Kong',year:'numeric'}).format(date);
export const DISCLAIMER = bi('本活動用於金融教育與自我探索，結果只反映你在本次遊戲中的選擇，不是投資建議或正式風險評級。', 'This activity is for financial education and self-exploration. The results reflect your choices in these games and are not investment advice or a formal risk assessment.');
export const FIGURE_NOTE = bi('此處只比較公開投資理念，不代表個人評級相同或任何人士認可本活動。', 'These comparisons concern public investment ideas only. They do not imply identical personal ratings or endorsement of this activity.');
export const LINKS = {
  college: 'https://www.chuhai.edu.hk/', faculty: 'https://fob.chuhai.edu.hk/',
  department: 'https://fne.chuhai.edu.hk/', finance: 'https://fne.chuhai.edu.hk/?page_id=52',
  information: 'https://fne.chuhai.edu.hk/?page_id=51', apply: 'https://apply.chuhai.edu.hk/',
};
export const CORE = [1, 3, 6, 9] as const;
export const WALLET_RANGES = [[80, 120], [60, 140], [20, 180]] as const;
export const BALLOON = [
  { chance: .05, gain: 5 }, { chance: .10, gain: 5 }, { chance: .20, gain: 5 },
  { chance: .30, gain: 5 }, { chance: .45, gain: 5 }, { chance: .60, gain: 5 },
];
export const VOLATILITY = [[100,100],[95,105],[85,115],[70,130],[50,150]] as const;
export const ROUTES = [[200,200],[180,220],[150,250],[100,300],[0,400]] as const;
export const TIME = [{days:7, coins:12},{days:14, coins:15},{days:28, coins:20}];
export const SHIELD_COSTS = [5,10,20];
export const CLUES = [
  { name: bi('來源', 'Source'), text: bi('消息由虛構項目的推廣者發布，未附獨立核實。', 'The fictional project promoter published this claim without independent verification.') },
  { name: bi('成本', 'Cost'), text: bi('參與需要10枚虛擬金幣；其中2枚是不能取回的處理費。', 'Joining costs 10 virtual coins, including a non-refundable fee of 2 coins.') },
  { name: bi('風險', 'Risk'), text: bi('收益及機會未獲證實；可能損失全部10枚金幣。', 'Returns and probabilities are unverified. All 10 coins could be lost.') },
];
export const CONFIDENCE_ROUNDS = [
  { icons: ['◆','●','◆','◆','●'], prompt: bi('菱形是否比圓形多？', 'Are there more diamonds than circles?'), correct: true },
  { icons: ['●','◆','●','◆','●','◆'], prompt: bi('圓形是否比菱形多？', 'Are there more circles than diamonds?'), correct: false },
  { icons: ['◆','●','●','◆','●','◆','●'], prompt: bi('圓形是否剛好有四個？', 'Are there exactly four circles?'), correct: true },
];
export const GAMES = [
  { id:1, icon:'wallet', title:bi('兩個小錢包','Two Little Wallets'), rule:bi('每輪選一個錢包；確定收取100枚，或接受各有一半機會的兩個結果。','Choose a wallet each round: 100 certain coins, or two equally likely outcomes.'), lesson:bi('三個機會錢包的平均數都是100；結果的範圍卻不同。','All three chance wallets average 100 coins, but their ranges differ.') },
  { id:2, icon:'balloon', title:bi('氣球小金庫','Balloon Bank'), rule:bi('充氣成功加5枚；隨時收集。爆破只會失去本輪未收集的金幣，共兩輪。','Each successful pump adds 5 coins. Collect at any time. A burst loses only this round’s uncollected coins. Play two rounds.'), lesson:bi('爆破是隨機中斷，不代表你主動選擇提早收集。','A burst is a random interruption, not a deliberate decision to collect early.') },
  { id:3, icon:'coins', title:bi('我的100枚金幣','My 100 Coins'), rule:bi('分配100枚金幣；保留口袋不變，機會口袋各有50%機會變成0倍或2倍。','Allocate 100 coins. The keep pocket stays unchanged. The chance pocket has a 50% chance each of becoming 0 or 2 times its amount.'), lesson:bi('把兩種最終結果放在一起看，再決定你能接受多少不確定性。','Compare both final totals before deciding how much uncertainty you accept.') },
  { id:4, icon:'clock', title:bi('儲蓄時間膠囊','Savings Time Capsule'), rule:bi('三次選擇即日10枚或模擬將來較多金幣；不需真的等待。','Choose 10 coins today or more in a simulated future, three times. There is no real wait.'), lesson:bi('等待意願與承受金融損失的能力是不同問題。','Willingness to wait is different from the ability to bear financial losses.') },
  { id:5, icon:'basket', title:bi('三個小籃子','Three Little Baskets'), rule:bi('把12枚代幣分配到三間小店；確認後看同一間小店遇到困難的影響。','Allocate 12 tokens across three shops. Then see the effect of the same shop running into difficulty.'), lesson:bi('分散可減少單一小店的影響，但不能消除所有共同風險。','Spreading tokens can reduce one shop’s impact, but cannot remove risks shared by all shops.') },
  { id:6, icon:'wave', title:bi('金幣過山車','Coin Rollercoaster'), rule:bi('移動滑塊，選擇你最能安心接受的上下範圍；每個結果機會相同。','Move the slider to the range you feel comfortable accepting. Both outcomes are equally likely.'), lesson:bi('這是你在此情境中表達的接受程度，不是實際財務承受能力。','This is your stated comfort in this scenario, not your real financial capacity.') },
  { id:7, icon:'shield', title:bi('為背包加一面盾','Shield Your Backpack'), rule:bi('背包有25%機會損失40枚；分別考慮付5、10、20枚來消除這次風險。','The backpack has a 25% chance of losing 40 coins. Consider paying 5, 10 and 20 coins separately to remove this risk.'), lesson:bi('三次保障選擇反映成本與安心的取捨，不能測出嚴格的損失厭惡系數。','Three protection choices show a cost–comfort trade-off, not a precise loss-aversion coefficient.') },
  { id:8, icon:'chest', title:bi('寶箱有幾分把握','How Sure Are You?'), rule:bi('觀察圖形，作出判斷並選擇把握程度，然後揭曉；共三輪，不計速度。','Inspect the shapes, make a judgement and set your confidence before revealing the answer. Three rounds; speed is not scored.'), lesson:bi('比較表達的把握與三次結果，只供反思，不是智力或金融才能評分。','Compare expressed confidence with these three outcomes for reflection, not as an intelligence or financial-talent score.') },
  { id:9, icon:'route', title:bi('選一條航線','Choose Your Route'), rule:bi('選一條運送金幣的航線；各路線平均200枚，每個結果各有50%機會。','Choose a coin-delivery route. Every route averages 200 coins, with a 50% chance of each outcome.'), lesson:bi('平均數相同，可能出現的範圍仍很不同；航行運氣不計分。','Equal averages can hide very different ranges. Sailing luck is not scored.') },
  { id:10, icon:'search', title:bi('熱門消息偵探','Hype Detective'), rule:bi('虛構的「星光小島」正在熱傳；可翻開三張線索，再決定是否參與。','The fictional “Starlight Island” is trending. You may reveal three clues before deciding whether to join.'), lesson:bi('我們記錄你查看了哪些資料，不把參與或拒絕當作能力高低。','We record which information you viewed, without ranking your ability by whether you joined or declined.') },
  { id:11, icon:'ticket', title:bi('同一張票，兩種說法','Same Ticket, Different Words'), rule:bi('從60枚金幣出發，分別回答兩種說法；完成後比較最終結果。','Start with 60 coins and respond to two descriptions. Compare their final outcomes afterwards.'), lesson:bi('措辭可能影響本次選擇；前後不同不代表不誠實或測試無效。','Wording may affect a choice. A difference does not imply dishonesty or invalidate this activity.') },
  { id:12, icon:'budget', title:bi('週末小預算','Weekend Budget'), rule:bi('100枚中先保留40枚作固定需要；把餘下60枚分給活動及備用，再看20枚意外支出。','Reserve 40 of 100 coins for fixed needs. Divide the remaining 60 between activities and a buffer, then face a 20-coin surprise expense.'), lesson:bi('這是虛擬情境中的規劃，不反映你的實際家庭財務承受能力。','This is planning within a fictional scenario, not a measure of your household’s finances.') },
];
export const TYPES = [
  { title:bi('穩步守護者','Steady Guardian'), text:bi('你在四個核心情境中多選確定或較窄的結果範圍。你重視可預期性；留意確定的選項也可能涉及成本。','Across the four core scenarios, you tended to choose certainty or narrower ranges. Predictability matters to you; remember that certainty can also carry a cost.') },
  { title:bi('審慎探索者','Cautious Explorer'), text:bi('你在部分核心情境中接受有限的不確定性。你會保留探索空間；可多比較不同選項最差時的結果。','You accepted some uncertainty in the core scenarios. You leave room to explore; compare the less favourable outcomes across options.') },
  { title:bi('均衡航行者','Balanced Navigator'), text:bi('你的核心選擇落在本活動分組的中間區域。這可能包含不同情境下的取捨；中間分數不代表每次都選折衷。','Your core choices fall in this activity’s middle group. This may combine different trade-offs across scenarios; a middle score does not mean you always chose a compromise.') },
  { title:bi('成長探索者','Growth Explorer'), text:bi('你在核心情境中較常接受較寬的可能結果。你願意探索機會；也可先想清楚較差結果是否能接受。','You often accepted wider possible outcomes in the core scenarios. You are willing to explore opportunities; consider whether the less favourable outcome would be acceptable.') },
  { title:bi('大膽探索者','Bold Explorer'), text:bi('你在核心情境中常選較高的不確定性。這是本次虛擬選擇的傾向；不能推斷你有能力承受真實損失。','You often chose greater uncertainty in the core scenarios. This describes your virtual choices here; it does not establish your ability to absorb real losses.') },
];
