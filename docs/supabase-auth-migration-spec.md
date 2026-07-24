# Marginalia · 接 Supabase(Google 登入 + 資料上雲)實作 spec

> 前置文件(先讀):
> - schema.sql(定案 schema,含 books / notes / RLS / Storage policy)
> - supabase-migration-plan-2026-07-21.md(三決策 + 必修 bug + 遷移步驟)
>
> ⚠️ 開工前第一步:回報現有 `supabase/schema.sql` 的實際內容,
> 跟定案 schema.sql 做 diff,列出差異給我確認後才套用。不要直接覆蓋。

---

## 0. 必修 bug(在寫任何遷移邏輯之前先修)

`api/books.js` 的 `createBook` 送進 Supabase 的欄位漏了 `added_at`。
修正:寫入時把 `added_at` 一併帶入(現有 localStorage 版 createBook 已經有這個值,只是沒送出去)。

---

## 1. Supabase 專案設定

- 建立 Supabase 專案(若尚未建立)
- 套用 schema.sql:books 表、notes 表、RLS policy、trigger
- 建立兩個 Storage bucket(private):`note-images`、`book-covers`
- 套用 schema.sql 內的 Storage policy(以 user_id 資料夾隔離)
- 在 Google Cloud Console 設定 OAuth 用戶端(比照 Google Books API 金鑰的建立經驗),
  於 Supabase Dashboard → Authentication → Providers 啟用 Google,填入 client id/secret
- 環境變數(比照 Google Books API 的雙軌配置慣例):
  - 本機 `.env`:VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY
  - Vercel Project Settings → Environment Variables:同兩把 key
  - 兩處都要填,Vite 變數是 build 時打包,部署前設定完成

---

## 2. 登入頁 / 登入流程

- 新增登入頁(沿用現有視覺語言:米色底 #FDFCFA、Cormorant/Noto Serif TC、墨綠系統)
- 單一按鈕:「使用 Google 繼續」→ 觸發 Supabase Auth 的 Google OAuth
- 未登入狀態:導向登入頁,不可見書櫃內容
- 已登入狀態:直接進書櫃頁
- 登入頁按鈕材質沿用全站統一按鈕規範(不得自訂新樣式)

---

## 3. 資料層改造(localStorage/IndexedDB → Supabase)

- `lib/supabaseClient.js` 的既有防呆模式維持:未設定環境變數 → supabase 為 null → app 落回 localStorage 模式(開發/離線可用,此行為不可移除)
- 已登入時,books/notes 的讀寫改走 Supabase(對應 api/books.js、api/notes.js)
- `strokes` 存 jsonb;筆記截圖原圖上傳至 `note-images/{user_id}/{noteId}.jpg`,
  `notes.image_path` 存路徑;合成顯示圖不上雲,登入後由「原圖 + strokes」在本機重算並快取於 IndexedDB
- 使用者上傳的書封:壓縮(長邊 ≤1200px、JPEG quality 0.8,比照現有 imageStore.js 的 compressImage)
  後上傳至 `book-covers/{user_id}/{bookId}.jpg`,`cover_url` 存路徑;
  Google Books 封面維持外部 URL,不動

---

## 4. 一次性遷移函式(首次登入觸發)

> ⚠️ **本節已作廢(2026-07-23)**:實機確認 iOS Safari 已將 localStorage 資料
> 自動清除(七天未造訪機制),無資料可遷移,第 2 階段(一次性遷移函式)取消。
> 以下原文保留供歷史參考,不再實作。

觸發時機:Google 登入成功後,檢查本機 flag `marginalia_migrated` 不存在時執行一次。

步驟:
1. 取得 `user_id = auth.uid()`
2. 讀 `reading-notes:books`、`reading-notes:notes`(localStorage)與 IndexedDB 圖片
3. **書資料正規化**(種子書/舊書可能缺 5 個欄位):
   - 缺 `status` → 補 `'reading'`(⚠️ 比照現行 `resolveShelfKey` 的顯示行為,
     不是資料庫 default 的 `'to_read'` —— 這點务必照此規則,否则舊書上雲後會跳分類)
   - 缺 `category` → null
   - 缺 `added_at` → 回填成該書的 `created_at`
   - 缺 `started_at` / `finished_at` → **留 null**(不依 status 反推假日期)
4. **筆記圖片搬家**:
   - 若有舊欄位 `image_key` 但無 `image_original` → 視為 `image_original` 讀取(沿用現有 fallback 邏輯)
   - 逐則把 IndexedDB 原圖 Blob 上傳到 `note-images/{user_id}/{noteId}.jpg`,寫入 `notes.image_path`
   - `strokes` 直接搬進 jsonb;沒有標注過的維持 `[]`
   - 顯示快取(`image_display`)不搬,不上雲
5. **書封搬家**:`cover_url` 若為 base64 data URL → 壓縮後上傳 `book-covers`,替換成 Storage URL;
   若已是 http(s) 外部網址(Google Books)→ 不動
6. 欄位命名對照:JS 端 camelCase 參數(如 googleBooksId)對應 DB snake_case(google_books_id),
   其餘欄位多數同名,寫入前逐一核對
7. 批次 insert books,成功取得新 id 後,再用該 id 批次 insert notes(notes 依賴 book_id,順序不可反)
8. 全部成功 → 寫入 localStorage flag `marginalia_migrated = '1'`
9. **localStorage 暫不清除**,作為雲端資料異常時的救援備份;
   待你本人於 iPhone Safari 實機驗證雲端資料無誤後,再另外手動決定是否清除(不在本次自動流程內)

---

## 5. 保留在本機、不上雲(維持現狀,不要動)

- `marginalia_splash_seen`、`marginalia_onboarded`:裝置級 UX 狀態
- IndexedDB 顯示快取:可隨時由原圖+strokes 重算,不必同步

---

## 限制

- 不要改動本次未列出的任何元件、樣式、資料邏輯
- 不要在確認 diff 前覆蓋現有 supabase/schema.sql
- 遷移函式只跑一次(靠 flag 擋),不得每次登入重複執行
- 金鑰(Supabase URL/anon key、Google OAuth client secret)一律走環境變數,不寫死進程式碼、不進 commit

---

## 驗收(iPhone Safari 實機,附截圖)

1) 未登入 → 進站導向登入頁;點「使用 Google 繼續」可完成登入
2) 首次登入 → 自動觸發遷移;原本 8 本書、含截圖筆記都出現在雲端(於 Supabase Dashboard 或重新整理後確認)
3) 種子書/舊書上雲後,狀態分類(Reading/To Read/Finished)與遷移前一致,沒有跳分類
4) 年/月篩選:遷移後的舊書仍可被篩到(added_at 有回填),新加的書 added_at 正常寫入(必修 bug 已修)
5) 登出後在同帳號、換一台裝置(或清 localStorage 後)重新登入 → 資料還在
6) 筆記截圖:原圖與已標注筆畫在雲端資料下仍能正確顯示/重算合成圖
7) 未設定 Supabase 環境變數時(本機防呆情境)→ app 仍可退回 localStorage 模式運作
8) 遷移只跑一次:重新整理或重新登入不會重複 insert 造成資料重複
