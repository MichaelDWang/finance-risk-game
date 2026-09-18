import type { Session } from '../shared/schema';
import { VERSION } from '../shared/content';
export const scenarios=['low','middle','high'] as const;
export function fixture(mode:typeof scenarios[number]):Session {
  const low=mode==='low',high=mode==='high';
  return {version:VERSION,reportId:low?'10000000-0000-4000-8000-000000000001':high?'10000000-0000-4000-8000-000000000003':'10000000-0000-4000-8000-000000000002',createdAt:'2026-09-18T04:00:00.000Z',seed:24680,role:'unspecified',answers:{
    '1':{choices:low?[false,false,false]:high?[true,true,true]:[true,false,true]},
    '2':{rounds:[{pumps:0,end:'collect'},{pumps:0,end:'collect'}]},
    '3':{chance:low?0:high?100:50},
    '4':{wait:low?[true,true,true]:high?[false,false,false]:[false,true,true]},
    '5':{baskets:low?[4,4,4]:high?[12,0,0]:[6,3,3]},
    '6':{level:low?0:high?4:2},
    '7':{protect:low?[true,true,true]:high?[false,false,false]:[true,true,false]},
    '8':{rounds:[{judgement:true,confidence:75},{judgement:false,confidence:100},{judgement:true,confidence:50}]},
    '9':{level:low?0:high?4:2},
    '10':{clues:low?[0,1,2]:high?[]:[0,2],decision:low?'decline':high?'join':'wait'},
    '11':{keep:false,lose:high},
    '12':{buffer:low?60:high?0:20},
  }};
}
