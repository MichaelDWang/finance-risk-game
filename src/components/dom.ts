import type { Bi } from '../../shared/content';
export const escape = (s:unknown) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const b = (t:Bi,tag='span',cls='') => `<${tag} class="bi ${cls}"><span lang="zh-Hant-HK">${escape(t.zh)}</span><span lang="en-GB">${escape(t.en)}</span></${tag}>`;
export const btn = (id:string,text:Bi,cls='primary',disabled=false) => `<button type="button" id="${id}" class="${cls}" ${disabled?'disabled':''}>${b(text)}</button>`;
export const on = (root:ParentNode,id:string,fn:()=>void) => root.querySelector<HTMLButtonElement>('#'+id)?.addEventListener('click',fn);
export const coin = (n:number,label:Bi) => `<div class="coin-stat"><strong>${n}</strong>${b(label)}</div>`;
export const external = (url:string,label:Bi) => `<a class="text-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${b(label)}<span aria-hidden="true">↗</span></a>`;
export function icon(name:string,cls=''){
 const paths:Record<string,string>={
 wallet:'<rect x="7" y="12" width="34" height="27" rx="5"/><path d="M9 12V9h27v3M30 21h13v12H30z"/><circle cx="35" cy="27" r="1"/>',
 balloon:'<ellipse cx="24" cy="19" rx="13" ry="16"/><path d="m24 35-3 4h6l-3-4v9"/>',
 coins:'<ellipse cx="24" cy="12" rx="15" ry="6"/><path d="M9 12v23c0 8 30 8 30 0V12M9 23c0 8 30 8 30 0M9 30c0 8 30 8 30 0"/>',
 clock:'<circle cx="24" cy="24" r="18"/><path d="M24 12v13l8 5"/>',
 basket:'<path d="m7 20 5 21h24l5-21zM14 20 22 6m12 14L26 6M18 24v12m12-12v12"/>',
 wave:'<path d="M3 26C10-10 15 58 24 24S38 6 45 26M3 39h42"/>',
 shield:'<path d="M24 4 41 11v14c-1 11-17 20-17 20S8 36 7 25V11zM16 24l6 6 12-13"/>',
 chest:'<path d="M7 23h34v18H7zM7 23v-9c0-12 34-12 34 0v9M21 23v9h6v-9M15 7v16m18-16v16"/>',
 route:'<path d="M7 40c35 0-9-30 30-30M31 4l7 6-7 6"/><circle cx="7" cy="40" r="4"/>',
 search:'<circle cx="21" cy="20" r="14"/><path d="m31 31 13 13M16 20h10m-5-5v10"/>',
 ticket:'<path d="M5 13h38v8a5 5 0 0 0 0 10v8H5v-8a5 5 0 0 0 0-10zM29 13v26"/>',
 budget:'<rect x="9" y="4" width="30" height="40" rx="4"/><path d="M15 10h18v9H15zM15 27h3m6 0h3m6 0h1M15 35h3m6 0h3m6 0h1"/>',
 compass:'<circle cx="24" cy="24" r="21"/><path d="m32 14-4 14-14 6 6-16zM24 0v4m0 40v4M0 24h4m40 0h4"/>',
 };
 return `<svg class="icon ${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.compass}</svg>`;
}
