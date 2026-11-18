# Pages 目前狀態與分支差異

**目前由誰作業**：無（開工時改為 Codex／CC 與日期，收工改回「無」）
**工具交接**：Codex 已暫停訂閱（2026-11-18 起），目前由 CC 負責。

| 工作樹 | 文件整理前狀態 | 獨有提交 |
|---|---|---|
| `/Users/chianiny/Projects/pages-release` | `release/pages-sync` 乾淨，與遠端一致 | `924521d` 更名 Pages、更新 README、修補跨裝置圖片、加入隔離 QA 測試 |
| `/Users/chianiny/Projects/pages` | `main` 領先遠端一筆，已有未提交工作 | `e6c060f` 統一新增／編輯書籍的分類選項，使用語意鍵與 i18n 顯示，並更新書架過濾與 UI 文件 |

兩者共用同一個 Git repository，分支共同基準及遠端預設分支為 `main` 的 `bd7f4ab`。盤點時兩邊均無未解 Git 衝突。

### `pages/main` 未提交內容（原 `jessica_agent`）

- 已追蹤的 16 個修改檔含 `README.md`、`index.html`、`public/manifest.json`、`src/App.jsx`、`src/api/notes.js`、`src/components/` 的 BrandBanner、ImageAnnotator、NoteImageLightbox、NoteList、NoteModal、Splash，另有 `src/i18n/strings.js`、`src/lib/imageStore.js`、`src/lib/noteAnnotation.js`、`src/pages/Login.jsx`、`src/pages/NoteDetail.jsx`。另有一筆 MP4 的本機刪除紀錄。
- 未追蹤項含 `.cache/`、案例草稿、`docs/pages-image-sync-fix-qa.md`、`ecom-scraper/`、兩份 i18n 草稿、`jessica-portfolio.html`、影片分鏡、`scrape-store-skill.zip` 與 `tests/`。
- 逐檔對照候選提交的 19 項變更，主工作樹有 18 項內容相同（含 README、圖片修補、測試與 QA），`src/i18n/strings.js` 不同。CC 於 2026-11-18 核對：差異僅為 `e6c060f` 新增的 `categories.essay`（英文 Essay、中文「散文」）兩行，無品牌文字差異，整合時納入 `e6c060f` 即可對齊。影片刪除、草稿與快取留待原工作目錄處理。

### 驗證與後續

- **本次通過**：公開首頁回 200；兩個工作樹均在隔離副本使用既有依賴建置成功。
- **歷史通過**：模擬 Supabase 及兩個獨立 Chromium contexts 的圖片還原、錯誤和快取測試。舊筆畫缺色時回退黃色；已有快取的裝置可能繼續顯示舊圖。
- **待驗**：真實 Google 登入、兩台裝置出現同一張圖與標註、正式 RLS／Storage、線上部署來源。
- **整合提案**：取得授權後，在獨立工作樹以候選分支為基準，比對並納入 `e6c060f`，人工核對 `strings.js`。逐項確認主工作樹未提交內容，僅挑入經核准且候選分支尚缺的修改。先跑 build 和現有模擬測試，再以專用帳號做雙裝置驗收，完成後再決定是否開 PR。

[測試及限制](pages-image-sync-fix-qa.md)

## 待辦（記錄於 2026-11-18，尚未執行）

- [ ] `release/pages-sync` 與 `pages/main` 尚未整合（含 `e6c060f`），整合需另行授權。
- [x] `ecom-scraper/` 已遷至 `~/Projects/ecom-scraper`，scrape-store skill 路徑、CC／Codex 捷徑與 CC 記憶檔已更新，虛擬環境已重建（2026-11-18）。`jessica-portfolio.html`、`scrape-store-skill.zip` 移至 `~/Projects/_archive/`。
