import { PDFDocument, PDFName, PDFString, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { BRAND,TITLE,DISCLAIMER,FIGURE_NOTE,GAMES,LINKS,CORE,bi,type Bi } from '../content';
import { type ReportModel,fmt } from './model';
const W=595.28,H=841.89,M=38,CW=W-M*2;
const navy=rgb(.07,.24,.32),teal=rgb(.08,.42,.4),muted=rgb(.32,.41,.44),pale=rgb(.9,.95,.91),line=rgb(.81,.87,.83),gold=rgb(.9,.75,.43);

export async function generatePdf(r:ReportModel,fontBytes:Uint8Array):Promise<Uint8Array>{
  const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
  // The checked-in TrueType font is already subset with fontTools.
  // Embed it directly to preserve character mapping across PDF readers.
  const font=await doc.embedFont(fontBytes,{subset:false});
  doc.setTitle('金融探索實驗室 | Finance Discovery Lab');doc.setAuthor(BRAND.en);doc.setSubject('Bilingual educational exploration report');
  doc.setCreationDate(new Date(r.createdAt));doc.setModificationDate(new Date(r.createdAt));doc.setProducer('Finance Discovery Lab '+r.version);
  const pages=[doc.addPage([W,H]),doc.addPage([W,H]),doc.addPage([W,H])];
  function rect(p:PDFPage,x:number,t:number,w:number,h:number,color=pale){p.drawRectangle({x,y:H-t-h,width:w,height:h,color});}
  function wrap(text:string,size:number,width:number){
    const tokens=text.match(/[\u2E80-\u9FFF\uF900-\uFAFF]|[^\s\u2E80-\u9FFF\uF900-\uFAFF]+|[ \t]+|\n/g)||[];
    const lines:string[]=[];let current='';
    for(const token of tokens){
      if(token==='\n'){lines.push(current.trimEnd());current='';continue;}
      if(font.widthOfTextAtSize(current+token,size)<=width){current+=token;continue;}
      if(/^[。，；：、！？）】」』]/.test(token)&&current.length>2){
        const tail=current.slice(-2);lines.push(current.slice(0,-2).trimEnd());current=tail+token;continue;
      }
      if(current.trim())lines.push(current.trimEnd());current=token.trimStart();
      if(font.widthOfTextAtSize(current,size)>width){let part='';for(const char of current){if(font.widthOfTextAtSize(part+char,size)>width){lines.push(part);part='';}part+=char;}current=part;}
    }
    if(current.trim())lines.push(current.trimEnd());return lines;
  }
  function text(p:PDFPage,t:string,x:number,top:number,width=CW,size=10,color=navy){
    const lines=wrap(t,size,width),height=size*1.32;
    for(const [i,l]of lines.entries())p.drawText(l,{x,y:H-top-size-i*height,size,font,color});
    return top+lines.length*height;
  }
  function dual(p:PDFPage,t:Bi,x:number,top:number,width=CW,zh=10,en=9,color=navy){let y=text(p,t.zh,x,top,width,zh,color);return text(p,t.en,x,y+2,width,en,color)+3;}
  function link(p:PDFPage,label:string,url:string,x:number,top:number,width:number,size=9){
    const bottom=text(p,label,x,top,width,size,teal);
    const annot=doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,H-bottom,x+width,H-top],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url)}});
    p.node.addAnnot(doc.context.register(annot));return bottom;
  }
  function header(p:PDFPage,n:number){
    rect(p,0,0,W,7,teal);dual(p,BRAND,M,22,CW,9,7.8);text(p,`FINANCE DISCOVERY LAB  /  ${String(n).padStart(2,'0')}${r.synthetic?'  /  合成示例 SYNTHETIC SAMPLE':''}`,M,63,CW,8,muted);
  }
  pages.forEach((p,i)=>{
    header(p,i+1);p.drawLine({start:{x:M,y:53},end:{x:W-M,y:53},thickness:.7,color:line});
    dual(p,BRAND,M,H-43,CW-55,7.5,6.7,muted);text(p,`${i+1} / 3`,W-M-30,H-37,30,8,muted);
  });
  const p=pages[0];let y=88;
  y=dual(p,bi('你的金融探索報告','Your finance discovery report'),M,y,CW,22,12);
  y=text(p,`${r.dateHK} HKT  |  ${r.reportId}  |  v${r.version}`,M,y+2,CW,8,muted)+10;
  const typeTop=y;rect(p,M,typeTop,CW,113);
  y=dual(p,r.type?.title||bi('探索尚未完成','Your exploration is incomplete'),M+16,y+13,CW-32,17,12);
  y=dual(p,r.type?.text||bi(`請補做核心關卡：${r.missing.join('、')}。不以缺失推算類型。`,`Complete core games ${r.missing.join(', ')}. No type is inferred from missing answers.`),M+16,y+5,CW-32,10,9);
  if(y>typeTop+110)throw new Error('PDF type panel overflow');y=typeTop+127;
  y=dual(p,bi('本次風險選擇傾向','Risk-taking tendency in this activity'),M,y,CW-120,11,9);
  text(p,r.score===null?'—':`${fmt(r.score)} / 100`,W-M-105,y-32,105,22,teal);
  rect(p,M,y+4,CW,8,line);if(r.score!==null)rect(p,M,y+4,CW*r.score/100,8,teal);
  y=dual(p,bi('0 偏向確定結果 · 100 接受更多不確定性','0 Favour certainty · 100 Accept more uncertainty'),M,y+20,CW,8.6,8,muted);
  y=dual(p,bi('四關等權平均；不是百分位、準確率或勝率。分組是本活動的設計規則。','Equal mean of four games; not a percentile, accuracy or win rate. Groups are defined for this activity.'),M,y+5,CW,9,8.3,muted);
  y=dual(p,bi('六項任務內觀察','Six observations within these tasks'),M,y+8,CW,13,10)+6;
  const col=(CW-20)/2;
  for(let row=0;row<3;row++){
    const top=y;let rowBottom=top;
    for(let c=0;c<2;c++){
      const o=r.observations[row*2+c],x=M+c*(col+20);
      let t=dual(p,o.title,x,top,col-42,10,8.5);text(p,o.value===null?'—':fmt(o.value),x+col-38,top,38,16,teal);
      rect(p,x,t+2,col,5,line);if(o.value!==null)rect(p,x,t+2,col*o.value/100,5,teal);
      t=dual(p,o.ends,x,t+11,col,7.6,7.3,muted);
      rowBottom=Math.max(rowBottom,t);
    }y=rowBottom+4;
  }
  y=dual(p,bi('以上是描述性指標，不是經驗證的心理維度，也不是越高越優秀。','These are descriptive indicators, not validated psychological dimensions. Higher is not better.'),M,y+2,CW,8.5,8,muted);
  y=dual(p,bi('計算來源：風險=第1/3/9關平均；波動=第6關檔位×25；等待=第4關等待/3；分散=100×(1−Σw²)/(1−1/3)，w為第5關各比例；資訊=第10關線索/3；緩衝=第12關備用/60。比例乘100。','Sources: risk = mean of Games 1/3/9; variation = Game 6 level × 25; waiting = Game 4 waits/3; spread = 100×(1−Σw²)/(1−1/3), w = Game 5 shares; information = Game 10 clues/3; buffer = Game 12 reserve/60. Ratios × 100.'),M,y+4,CW,7.8,7.5,muted);
  y=dual(p,DISCLAIMER,M,y+3,CW,8.5,8,muted);
  if(y>H-64)throw new Error(`PDF page 1 overflow: ${y}`);

  const p2=pages[1];y=88;
  y=dual(p2,bi('沿途的選擇與發現','Your choices and discoveries'),M,y,CW,20,13)+9;
  y=dual(p2,bi(`核心選擇指標（第1／3／6／9關）：${r.core.map(x=>x===null?'未完成':fmt(x)).join('／')}。${r.varied?'你在不同情境下作出了不同選擇。':''}`,`Core indicators (Games 1 / 3 / 6 / 9): ${r.core.map(x=>x===null?'missing':fmt(x)).join(' / ')}.${r.varied?' You made different choices across scenarios.':''}`),M,y,CW,9,8.5)+10;
  for(let row=0;row<6;row++){
    let end=y;
    for(let c=0;c<2;c++){
      const i=row*2+c,x=M+c*(col+20);rect(p2,x,y,col,1,line);
      let t=text(p2,`${String(i+1).padStart(2,'0')} ${GAMES[i].title.zh} / ${GAMES[i].title.en}`,x,y+6,col,8.8)+4;
      t=dual(p2,r.summaries[i],x,t+3,col,8.7,8.1,muted);end=Math.max(end,t);
    }y=end+8;
  }
  y=dual(p2,bi('三個學習提示','Three ideas to explore'),M,y+4,CW,12,9.5)+6;
  const tipW=(CW-24)/3;let tipBottom=y;
  r.tips.forEach((t,i)=>{const x=M+i*(tipW+12);text(p2,String(i+1),x,y,20,14,teal);tipBottom=Math.max(tipBottom,dual(p2,t,x,y+22,tipW,8.3,7.8));});
  if(tipBottom>H-64)throw new Error(`PDF page 2 overflow: ${tipBottom}`);

  const p3=pages[2];y=88;
  y=dual(p3,bi('你的選擇，與哪些金融觀點有共鳴？','Which financial ideas echo your choices?'),M,y,CW,17,12)+12;
  let cardsEnd=y;
  r.figures.forEach((m,i)=>{
    const x=M+i*(col+20);let t=y;
    t=text(p3,m.figure.name,x,t,col,15,teal)+6;t=dual(p3,m.figure.intro,x,t,col,9.3,8.5,muted);
    t=dual(p3,m.figure.idea,x,t+7,col,9.5,8.8);
    t=dual(p3,bi(m.matched?'選擇對照（本專案的解釋）':'值得比較的觀點',m.matched?'Choice connection (our interpretation)':'Ideas to compare'),x,t+8,col,8.7,8,teal);
    t=dual(p3,m.reason,x,t+3,col,9,8.5);
    t=dual(p3,bi('可學的思路：'+m.figure.learn.zh,'An idea to learn from: '+m.figure.learn.en),x,t+7,col,9,8.4);
    t=dual(p3,bi('局限：'+m.figure.limit.zh,'Limit: '+m.figure.limit.en),x,t+7,col,8.7,8.2,muted);
    t=link(p3,'資料來源 / Source: '+m.figure.sourceTitle,m.figure.url,x,t+8,col,8);cardsEnd=Math.max(cardsEnd,t);
  });
  if(!r.figures.length)cardsEnd=dual(p3,bi('請完成四個核心關卡。暫不進行人物對照。','Complete all four core games before viewing figure comparisons.'),M,y,CW,11,10);
  y=dual(p3,FIGURE_NOTE,M,cardsEnd+12,CW,8.5,8,muted)+11;
  rect(p3,M,y,CW,2,gold);y+=15;
  y=dual(p3,bi('把好奇心變成金融知識','Turn curiosity into financial understanding.'),M,y,CW,16,12);
  y=dual(p3,BRAND,M,y+6,CW,9.5,8.5);
  y=dual(p3,bi('理解風險、比較選擇、運用資料及規劃資源。金融學習讓你繼續探索這些問題。','Understand risk, compare choices, use information and plan resources. Studying finance lets you explore these questions further.'),M,y+6,CW,9.3,8.7)+12;
  const qrTop=y,qrSize=82;
  const qr=(url:string,x:number)=>{
    const code=QRCode.create(url,{errorCorrectionLevel:'M'}),modules=code.modules,cell=qrSize/(modules.size+8);rect(p3,x,qrTop,qrSize,qrSize,rgb(1,1,1));
    for(let row=0;row<modules.size;row++)for(let c=0;c<modules.size;c++)if(modules.get(row,c))rect(p3,x+(c+4)*cell,qrTop+(row+4)*cell,cell+.04,cell+.04,navy);
  };
  qr(LINKS.department,M);qr(LINKS.apply,M+col+20);
  let a=dual(p3,bi('認識財務金融系','Explore the Department of Finance'),M+qrSize+8,qrTop,col-qrSize-8,9.3,8.5);
  a=link(p3,'fne.chuhai.edu.hk',LINKS.department,M+qrSize+8,a+4,col-qrSize-8,8.3);
  let z=dual(p3,bi('了解課程及報名','Explore programmes and apply'),M+col+20+qrSize+8,qrTop,col-qrSize-8,9.3,8.5);
  z=link(p3,'apply.chuhai.edu.hk',LINKS.apply,M+col+20+qrSize+8,z+4,col-qrSize-8,8.3);
  y=Math.max(qrTop+qrSize,a,z)+10;
  y=link(p3,'金融學 / Finance programme · fne.chuhai.edu.hk/?page_id=52',LINKS.finance,M,y,CW,8.5)+6;
  y=link(p3,'金融及資訊管理 / Finance and Information Management · fne.chuhai.edu.hk/?page_id=51',LINKS.information,M,y,CW,8.5)+12;
  if(y>H-64)throw new Error(`PDF page 3 overflow: ${y}`);
  return doc.save({useObjectStreams:true});
}
