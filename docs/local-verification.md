# 本次本地 Pages 配置驗證

日期：2026-09-18。實際專案：`/Users/michael/Desktop/finance-risk-game`。

## 範圍與結果

已依更新後的指示，只完成本地檔案、工作流及部署說明；沒有執行 GitHub 登入、建立遠端倉庫、推送程式碼、遠端 Pages 發布或 Cloudflare 部署，也沒有呼叫真實寄送接口。

| 檢查 | 實際結果 |
| --- | --- |
| 適用 AGENTS.md | 檢查了專案及上層路徑；沒有找到適用檔案。 |
| Node／鎖檔 | Node 22.22.1，符合 `.nvmrc`、package engines 與 Vite 要求；package 與 lockfile 一致，含 Linux runner 需要的 optional binding。 |
| `npm ci` | 通過；此次安裝 audit 回報 0 vulnerabilities。 |
| 生產建置 | 在兩個電郵公開變數為空、base 為 `/finance-risk-game/` 時執行 `npm run build`，通過 TypeScript 與 Vite 建置。 |
| 現有單元測試 | `npm test`：35/35 通過，涵蓋計分邊界、缺失資料、輸入拒絕及電郵服務狀態；寄送測試使用合成資料與測試替身，沒有真實發信。 |
| 瀏覽器流程 | `npm run test:e2e`：8/8 通過；使用本機 Chrome 的無登入測試瀏覽器。 |
| 螢幕大小 | 桌面 1440×1000、手機 390×844；低／中／高三組均走完十二關，未發現頁面橫向溢出。 |
| 主要互動 | 語言切換、結果數值、十二項發現、缺失核心關卡、分頁恢復、重新開始及清除前一位資料均通過現有流程測試。 |
| Pages 專案子路徑 | 本地 production preview 的 `/finance-risk-game/` 可載入；favicon、TTF 和 WOFF2 以此子路徑回傳 HTTP 200。 |
| 字體與下載 | 網頁字體載入檢查通過；每組瀏覽器流程均成功取得真實 `.pdf` 下載。 |
| 電郵未配置 | 顯示「電郵服務暫未啟用，請先下載PDF」，遊戲與 PDF 仍可使用；沒有發送網絡請求至真實寄送服務。 |
| YAML | actionlint 1.7.12 通過；另解析結構並檢查觸發條件、job 依賴、環境 URL、並發、最小權限與公開變數。只有一份 Pages 工作流。 |
| 公開產物 | `dist/index.html` 與必要靜態資源存在；未含 Worker 源碼、服務端密鑰名稱、私密設定或測試收件地址。 |
| PDF 視覺及結構 | 低／中／高三份均為 3 頁 A4、約 298 KB。逐頁渲染無字體警告；文字可選取，學院署名、官方連結及兩個 QR code 通過檢查。 |

## 本次順帶修正的本地驗證問題

- PDF 版面原先有內容超出三頁的情況，已調整間距及換行，不刪除十二關摘要、雙語內容或機構署名。
- CFF／OTF 字體在 PDF 閱讀器有嵌入警告及字寬不一致。改為有授權、已改名及子集化的 `FinanceLabTC.ttf`，同步更新前端 fetch、共用 PDF、Worker 字體 import、樣例生成及上傳說明；WOFF2 仍供網頁使用。
- 修正手機完整頁面截圖中隱藏的「跳至內容」連結與首頁小標章遮擋。鍵盤聚焦時仍可使用跳至內容。
- `.gitignore` 新增 `output/`，避免意外把測試報告／截圖加入程式碼；網頁上傳仍須手動排除，不能依賴 gitignore。

## 尚未驗證

- GitHub Actions 在新倉庫的實際執行與 GitHub Pages 公開網址。
- 正式網址上的無登入瀏覽器、真機手機及 PDF 下載。應在網頁上傳並發布後再驗證。
- 電郵服務的正式憑據、域名、Turnstile、Worker 部署及真實收件。本次沒有配置或測試這些外部服務。

本機預覽不等於正式發布。操作步驟見 `docs/github-pages-deployment.md`。
