// Counter-based deterministic generator. Not for security, prizes or real money.
export function randomAt(seed: number, event: number): number {
  let t = (seed + Math.imul(event + 1, 0x6D2B79F5)) >>> 0;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export const framingOrder = (seed:number): ('keep'|'lose')[] => randomAt(seed,1100)<.5 ? ['keep','lose'] : ['lose','keep'];
