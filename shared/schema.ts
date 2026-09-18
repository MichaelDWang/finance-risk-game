import { z } from 'zod';
import { BALLOON, VERSION } from './content';
import { randomAt } from './random';
const int = (max: number) => z.number().int().min(0).max(max);
const triple = <T extends z.ZodType>(item: T) => z.array(item).length(3);
const optional = <T extends z.ZodType>(item: T) => item.nullable().optional();
export const answersSchema = z.strictObject({
  '1': optional(z.strictObject({ choices: triple(z.boolean()) })),
  '2': optional(z.strictObject({ rounds: z.array(z.strictObject({ pumps: int(6), end: z.enum(['collect','burst','limit']) })).length(2) })),
  '3': optional(z.strictObject({ chance: int(100) })),
  '4': optional(z.strictObject({ wait: triple(z.boolean()) })),
  '5': optional(z.strictObject({ baskets: triple(int(12)).refine(x => x.reduce((a,b) => a+b,0)===12, 'Total must be 12') })),
  '6': optional(z.strictObject({ level: int(4) })),
  '7': optional(z.strictObject({ protect: triple(z.boolean()) })),
  '8': optional(z.strictObject({ rounds: triple(z.strictObject({ judgement: z.boolean(), confidence: z.union([z.literal(50),z.literal(75),z.literal(100)]) })) })),
  '9': optional(z.strictObject({ level: int(4) })),
  '10': optional(z.strictObject({ clues: z.array(int(2)).max(3).refine(x=>new Set(x).size===x.length), decision: z.enum(['join','wait','decline']) })),
  '11': optional(z.strictObject({ keep: z.boolean(), lose: z.boolean() })),
  '12': optional(z.strictObject({ buffer: int(60) })),
});
export const sessionSchema = z.strictObject({
  version: z.literal(VERSION), reportId: z.string().uuid(),
  createdAt: z.string().datetime(), seed: int(4294967295),
  role: z.enum(['student','parent','other','unspecified']), answers: answersSchema,
}).superRefine((s,ctx)=> {
  s.answers['2']?.rounds.forEach((r,round)=>{
    let burstAt=0;
    for(let p=0;p<r.pumps;p++) if(randomAt(s.seed, 200+round*10+p)<BALLOON[p].chance){burstAt=p+1;break;}
    const valid = r.end==='burst' ? burstAt===r.pumps && r.pumps>0 : burstAt===0 && (r.end==='limit' ? r.pumps===6 : r.pumps<6);
    if(!valid) ctx.addIssue({code:'custom',path:['answers','2','rounds',round],message:'Inconsistent balloon events'});
  });
});
export type Answers = z.infer<typeof answersSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type GameId = keyof Answers;
export const sendSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email().max(254).refine(s=>!/[\r\n,;]/.test(s)),
  consent: z.literal(true), token: z.string().min(1).max(2048),
  session: sessionSchema,
});
export function newSession(): Session {
  return {version:VERSION,reportId:crypto.randomUUID(),createdAt:new Date().toISOString(),seed:crypto.getRandomValues(new Uint32Array(1))[0],role:'unspecified',answers:{}};
}
