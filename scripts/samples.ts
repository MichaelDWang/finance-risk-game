import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { fixture,scenarios } from '../tests/fixtures';
import { sessionSchema } from '../shared/schema';
import { buildReport } from '../shared/report/model';
import { generatePdf } from '../shared/report/pdf';
await mkdir('output/pdf',{recursive:true});
const font=await readFile('public/assets/fonts/FinanceLabTC.ttf');
for(const mode of scenarios){
  const s=sessionSchema.parse(fixture(mode)),report=buildReport(s),start=performance.now();
  const bytes=await generatePdf({...report,synthetic:true},font);
  await writeFile(`output/pdf/synthetic-${mode}.pdf`,bytes);
  await writeFile(`output/pdf/synthetic-${mode}.json`,JSON.stringify({synthetic:true,session:s,report},null,2));
  console.log(JSON.stringify({mode,score:report.score,type:report.type?.title.en,figures:report.figures.map(x=>x.figure.name),bytes:bytes.length,generationMs:Math.round(performance.now()-start),rssMB:Math.round(process.memoryUsage().rss/1048576)}));
}
