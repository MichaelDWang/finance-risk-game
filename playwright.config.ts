import { defineConfig,devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const localChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export default defineConfig({
  testDir:'tests/e2e',timeout:120000,expect:{timeout:10000},fullyParallel:false,
  use:{baseURL:process.env.PUBLIC_URL||'http://127.0.0.1:4173/finance-risk-game/',headless:true,launchOptions:existsSync(localChrome)?{executablePath:localChrome}:{},trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium',viewport:{width:390,height:844}}}],
  webServer:process.env.PUBLIC_URL?undefined:{command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173/finance-risk-game/',reuseExistingServer:!process.env.CI},
});
