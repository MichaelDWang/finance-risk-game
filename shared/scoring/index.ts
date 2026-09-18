import { CORE, TYPES } from '../content';
import type { Answers } from '../schema';
export const mean = (xs:number[]) => xs.reduce((a,b)=>a+b,0)/xs.length;
export const percent = (xs:boolean[]) => xs.filter(Boolean).length/xs.length*100;
export function typeIndex(score:number):number {
  if (!Number.isFinite(score)||score<0||score>100) throw new Error('Score out of range');
  return Math.min(4,Math.floor(score/20));
}
export function diversity(baskets:number[]):number {
  return Math.max(0,Math.min(100,100*(1-baskets.reduce((s,n)=>s+(n/12)**2,0))/(1-1/3)));
}
export function score(answers:Answers){
  const core = [
    answers['1'] ? percent(answers['1'].choices):null,
    answers['3'] ? answers['3'].chance:null,
    answers['6'] ? answers['6'].level*25:null,
    answers['9'] ? answers['9'].level*25:null,
  ];
  const missing = CORE.filter((_,i)=>core[i]===null);
  const value = missing.length===0 ? mean(core as number[]):null;
  return {core,missing,value,type:value===null?null:TYPES[typeIndex(value)],
    varied: missing.length===0 && Math.max(...core as number[])-Math.min(...core as number[])>=50};
}
