import { makeHandler } from './handler';
import { generatePdf } from '../shared/report/pdf';
import font from '../public/assets/fonts/FinanceLabTC.ttf';
export { MailGuard } from './guard';
export default {fetch:makeHandler(report=>generatePdf(report,new Uint8Array(font)))};
