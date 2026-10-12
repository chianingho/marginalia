# Pages · 私人閱讀筆記

Pages 將書籍、書頁照片、標註與想法放回同一段閱讀脈絡，方便收藏與重訪真正有感的內容。

[Live Demo](https://marginalia-ruddy.vercel.app/)

## 功能

- Google Books 搜尋帶入書籍資訊；搜尋不到時可手動新增與上傳封面。
- 書櫃、閱讀狀態、分類與時間篩選。
- 書頁照片、頁碼、文字筆記與非破壞性筆畫標註。
- Google 登入保存個人雲端資料；訪客模式可直接體驗，資料僅保存在目前瀏覽器。
- 繁體中文／英文介面及可加入主畫面的 Web App Manifest。

## 技術

React、Vite、React Router、Supabase Auth／Postgres／Storage、Google Books API、IndexedDB（idb-keyval）、localStorage、driver.js。

## 本機開發

```sh
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 填入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`；`VITE_GOOGLE_BOOKS_API_KEY` 為啟用書籍搜尋所需的設定；未設定時可使用手動新增。未設定 Supabase 時可使用本機／訪客資料模式。

```sh
npm run build
npm run preview
```

目前 package.json 沒有獨立 typecheck 或 lint 指令。

## 雲端設定

- Google OAuth 與回呼 URL 需對應 Supabase Auth 與本機／正式網址。
- `supabase/schema.sql` 描述新專案的資料表與 RLS，僅應用於新環境；既有環境請先檢視 schema 差異，勿直接當成遷移腳本。
- 圖片使用私有 `book-covers` 與 `note-images` buckets，路徑以使用者 ID 分隔，存取政策需與登入帳號一致。
- 書籍、筆記與筆畫資料由資料庫保存；筆記原圖與合成顯示圖由 IndexedDB 快取。

## 專案結構

- `src/pages/`：書櫃、書籍詳情、筆記詳情及登入頁。
- `src/components/`：新增／編輯彈窗、標註器與共用 UI。
- `src/api/`：書籍、筆記、Google Books 資料存取。
- `src/lib/`：Supabase、訪客／本機資料與圖片儲存。
- `src/i18n/`：中英文介面字串。
- `public/manifest.json`：安裝名稱與圖示。
- `docs/ARCHITECTURE.md`：架構備忘；其他日期文件記錄歷史決策，可能保留產品舊名 Marginalia。
- `ecom-scraper/`：獨立電商工具，非 Pages 核心執行路徑。

## 已知限制

- 筆記圖片的跨裝置還原尚未接上 Storage → IndexedDB 下載流程；文字同步不代表圖片／標註已完整恢復。
- 標註的合成顯示快取主要在原裝置保存，另一裝置仍需由原圖與 strokes 重建。
- 訪客資料不跨裝置同步；清除瀏覽器資料可能失去訪客文字與本機圖片，請勿以清除快取作為修補方式。
- Google Books 搜尋需要 API key，且受到資料涵蓋與 API 額度限制，可改用手動新增。
- 目前有 Web App Manifest，但未實作 service worker，不保證完整離線操作。

產品名稱已改為 Pages；儲存 key、repo／資料夾名稱及正式網域維持原名，以保留既有資料與連結。
