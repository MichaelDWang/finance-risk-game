# 以 GitHub 網頁發布金融探索實驗室

本機專案：`~/Desktop/finance-risk-game`。預定倉庫名稱：`finance-risk-game`。

本次只完成本機配置及驗證，沒有登入 GitHub、建立遠端倉庫、推送、執行遠端 Actions 或部署 Cloudflare。下列網站網址是發布後的預期格式，並非已上線網址：

`https://<GitHub用戶名>.github.io/finance-risk-game/`

## 1. 建立公開倉庫

1. 在瀏覽器登入你自己的 [GitHub](https://github.com/)。
2. 點右上角 **+ → New repository**。
3. 選擇你的帳號作 Owner，Repository name 填 `finance-risk-game`，選 **Public**。
4. 保持其他現有網站及 Pages 設定不變，點 **Create repository**。
5. 確認此新倉庫的預設分支為 `main`。若建立時沒有任何檔案，可先按下方方式上传源碼。

本工作流使用 GitHub 自動提供的 `GITHUB_TOKEN`，不需要個人存取權杖（PAT），也不需要在本機使用 GitHub CLI。

## 2. 上傳清單與目錄層級

在倉庫頁使用 **Add file → Upload files**（空倉庫也可按 **uploading an existing file**）。上傳以下檔案／資料夾的內容，提交到 `main`：

```text
finance-risk-game/                    ← 這是倉庫根目錄，不要再多包一層同名資料夾
├── .github/workflows/pages.yml
├── .nvmrc
├── .gitignore
├── .env.example                      ← 只有空白公開設定的範例
├── package.json
├── package-lock.json
├── index.html
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── src/
├── shared/
├── public/
│   └── assets/
│       ├── compass.svg
│       └── fonts/
│           ├── FinanceLabTC.ttf        ← PDF 必須
│           ├── FinanceLabTC.woff2      ← 網頁必須
│           └── OFL.txt                ← 字體授權，必須保留
├── worker/                            ← 保留獨立後端源碼；不會發布到 Pages
│   └── .dev.vars.example              ← 可上傳空白範例，不能上傳 .dev.vars
├── tests/                             ← 工作流會執行現有單元測試
├── scripts/
└── docs/
```

若專案之後有 README 或其他非私密文件，亦可一併上傳。根目錄必須直接看到 `package.json`、`index.html`、`src`；如果看到唯一一個 `finance-risk-game` 資料夾，代表多包了一層，應修正位置。

**網頁上傳不會讀取 `.gitignore` 來替你過濾檔案。必須手動排除：**

- `node_modules/`、`dist/`、`worker-dist/`、`.git/`、`.wrangler/`。
- `tmp/`、`output/`、`test-results/`、`playwright-report/`、`coverage/`、日誌及 `.DS_Store`。
- 真實 `.env`、`.env.local`、`.env.production` 等環境檔，以及 `.dev.vars`／`worker/.dev.vars`。
- 所有真實 API keys、服務端秘密、實際參與者答案、電郵及真實報告。

`dist/` 由 Actions 重新產生；不要把預先建置的 `dist` 當成倉庫源碼。`output/` 的示例 PDF 與截圖也不是前端建置所需。

### Finder 中的隱藏檔案

在 Finder 按 **Command + Shift + .** 切換顯示隱藏檔案。請留意 `.github`、`.nvmrc` 和 `.gitignore`，但不要因此選取 `.git` 或實際密鑰檔。

如果 `.github` 不方便上傳：

1. 在 GitHub 倉庫點 **Add file → Create new file**。
2. 檔名欄完整輸入 `.github/workflows/pages.yml`。
3. 複製本機同一路徑檔案的全部內容（亦附於交付回覆），貼入編輯區。
4. 點 **Commit changes**，提交到 `main`。

也可用同樣方法建立 `.nvmrc`，內容只有 `22.22.1`。完成後確認 `.github/workflows/` 內只有一個 Pages 發布工作流，避免自行再新增另一份重複部署範本。

## 3. 啟用 GitHub Pages

1. 進入新倉庫 **Settings → Pages**。
2. 在 **Build and deployment → Source** 選 **GitHub Actions**。
3. 不需要選擇 `gh-pages` 分支，也不需要變更個人主页、Custom domain 或 DNS。
4. 進入 **Actions → Deploy to GitHub Pages**。
5. 點 **Run workflow**，分支選 `main`，再點 **Run workflow**。
6. 等待 `build`、`deploy` 兩個 job 完成。`deploy` 依賴 `build` 成功，並使用 `github-pages` environment。
7. 成功後，在執行摘要的 deployment／environment 連結或 **Settings → Pages** 取得實際網址。

每次在網頁修改並提交檔案到 `main`，也會自動執行此工作流。若第一次上傳時尚未啟用 Pages 而失敗，設定 Source 後重新手動執行即可。發布採用 `pages` 並發群組，不中途取消正在發布的執行。

## 4. Node、依賴與子路徑

- `.nvmrc` 為 `22.22.1`；工作流透過 `node-version-file: .nvmrc` 讀取。
- `package.json` 要求 Node `>=22.12.0 <23`；Vite 8.3.0 支援 Node `^20.19.0 || >=22.12.0`，因此現有 Node 22.22.1 適用。
- GitHub Action 本身使用的 Node 24 runtime 與專案的 Node 22 建置環境是不同用途；GitHub 托管的 `ubuntu-latest` runner 提供 Actions runtime。
- `npm ci` 根據 `package-lock.json` 安裝；npm 快取也以該鎖檔為依據。修改套件後須一併更新鎖檔。
- 生產命令為 `npm run build`，即 `tsc --noEmit && vite build`。上傳 artifact 僅限 `dist`。
- `vite.config.ts` 的預設 base 與工作流的 `VITE_BASE_PATH` 均為 `/finance-risk-game/`。
- 網頁字體的 CSS URL 由 Vite 轉為此專案子路徑；PDF 字體使用 `import.meta.env.BASE_URL + 'assets/fonts/FinanceLabTC.ttf'`。
- favicon 使用 `%BASE_URL%`；程式碼分塊由 Vite 自動使用 base。遊戲採用頁面內狀態，不需要伺服器子路由重寫。
- 兩個字體檔已隨專案提供。正常安裝及建置不依賴本機 `tmp/`、Python、字體重建工具或外部字體下載。保留檔名大小寫。

## 5. 電郵可以暫不設定

在 **Settings → Secrets and variables → Actions → Variables → New repository variable**，日後可設定以下兩個**公開**變數：

| 變數 | 用途 |
| --- | --- |
| `VITE_EMAIL_API_URL` | 已部署的 HTTPS Worker origin，例如 `https://your-worker.your-subdomain.workers.dev`；不加 `/api/send-report`，程式會自動附加。 |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile 公開 site key。 |

工作流已把 `vars.VITE_EMAIL_API_URL`、`vars.VITE_TURNSTILE_SITE_KEY` 傳入前端建置。未建立這兩個變數時值為空，建置仍會成功；十二關、結果頁與本地 PDF 下載照常運作。電郵區域會顯示「電郵服務暫未啟用，請先下載PDF」。這不是成功寄送提示。

**不要**把 `RESEND_API_KEY`、`TURNSTILE_SECRET_KEY`、`HASH_SECRET` 或任何服務端密鑰放入 `VITE_*`、此工作流或公開倉庫。Worker 是独立服務，Pages 不執行 `worker/` 程式；此工作流也不會部署 Worker。本次沒有呼叫真實寄送接口。

## 6. 查看錯誤與正式發布後的驗收

在 **Actions → 某次執行 → build／deploy → 失敗的步驟** 展開日誌：

- 找不到 `.nvmrc`／`package.json`：檢查隱藏檔與倉庫根目錄層級。
- `npm ci` 失敗：確認 `package-lock.json` 已上傳，並與 `package.json` 同步。
- TypeScript 找不到模組：確認 `src`、`shared`、`tests`、`scripts`、`worker` 等源碼沒有漏傳，並檢查檔名大小寫。
- configure/deploy Pages 失敗：確認 Source 是 GitHub Actions、倉庫的 Actions 沒有被停用、`github-pages` environment 允許 `main`。
- 網站 CSS／字體 404：確認倉庫名稱是 `finance-risk-game`，不要刪除工作流中的 base，且兩個本地字體檔均已上傳。
- PDF 失敗：在瀏覽器 Network 檢查 `/finance-risk-game/assets/fonts/FinanceLabTC.ttf` 是否回傳 200。

GitHub Actions 成功後，仍需用登出／私人瀏覽視窗開啟實際 Pages 網址，試玩十二關、查看手機排版並下載 PDF。**本地建置通過與工作流語法通過，不代表遠端 Actions 已執行或正式網站已驗證。**

## 核實的官方 Actions（2026-09-18）

- [actions/checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)
- [actions/setup-node v7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0)
- [actions/configure-pages v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0)
- [actions/upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0)
- [actions/deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1)
- [GitHub 官方 Pages 自訂工作流說明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

權限分配：build 僅使用 `contents: read`；deploy 使用 `pages: write` 與 `id-token: write`。configure-pages 放在 deploy job，以免給建置步驟 Pages 寫入權限。
