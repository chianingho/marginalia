# Marginalia · Supabase 上雲交接(2026-07-21 → 明日待續)

> 用途:接續對話的上下文交接。新對話請先讀完本檔,連同 schema.sql、
> supabase-auth-migration-spec.md 一起看。

---

## 一、今天完成的事

1. UI/動畫批次全數驗收通過(iPhone Safari):
   - 書櫃頁預設 All 選中平鋪、篩選膠囊改版、年/月自動記錄 filter
   - 切換書單 auto-animate、首次導覽(driver.js)+ empty state
   - 筆記詳情頁膠囊/返回鈕玻璃化、截圖滿版
   - 開場動畫改版:打字機 Marginalia → 綠墨手繪畫書 → 眨眼小鳥(沿用首頁原始綠邊潦草鳥),
     spec 已交付,尚待 CC 實作(此項與 Supabase 無關,可平行推進)
2. 請 CC 做完 localStorage 完整盤點(localStorage-audit-2026-07-21.md),發現：
   - **必修 bug**:`api/books.js` createBook 漏送 `added_at` 給 Supabase,不修的話上雲後年/月篩選全壞
   - 種子書/舊書缺 5 個欄位(status/category/started_at/finished_at/added_at),形狀跟一般書不同
   - 截圖走 IndexedDB(Blob JPEG,已壓縮),書封走 localStorage(使用者上傳的是未壓縮 base64，唯一容量風險點)
3. 完成三份文件(已存於本機,待 commit):
   - `schema.sql` — 定案 Supabase schema(books/notes/RLS/Storage policy)
   - `supabase-migration-plan-2026-07-21.md` — 三項設計決策 + 必修 bug + 遷移步驟 + checklist
   - `supabase-auth-migration-spec.md` — 給 Claude Code 的完整實作 spec

---

## 二、三個已拍板的設計決策(不用重新討論)

- **A 截圖**:原圖上 Supabase Storage bucket `note-images`;strokes 存 jsonb;合成顯示圖不上雲,留本機 IndexedDB 重算
- **B 書封**:使用者上傳的封面比照截圖壓縮(長邊≤1200、JPEG 0.8)後上 bucket `book-covers`;Google Books 封面維持外部 URL 不動
- **C note_date**:不入庫,8 月時間流頁改用 `created_at` 在查詢端依 Asia/Taipei 現算分日
- **遷移時舊書缺 started_at/finished_at → 留 null**(不依 status 反推假日期,今天已確認)
- **遷移時舊書缺 status → 補 'reading'**(比照現行畫面顯示邏輯 resolveShelfKey,不是 DB default 的 to_read,這條容易做錯要特別注意)

---

## 三、明天開工順序(建議,可依實際狀況調整)

### 你要先做的(人工操作,CC 不能代勞)
1. Google Cloud Console 申請 OAuth Client ID(步驟見下方附錄,同一個專案、跟 Books API key 那個)
2. Supabase 建專案(若未建)→ Authentication → Providers → Google,填入 Client ID/Secret
3. 拿到 Supabase 的 redirect URI 後回填進 Google Cloud 的 Authorized redirect URIs

### 交給 Claude Code 的(可與你上面的步驟平行進行)
1. **第一步只做這件事**:回報現有 `supabase/schema.sql` 實際內容,跟 schema.sql(定案版)做 diff,列出差異回報,等你確認才套用 —— 不要直接覆蓋
2. 修必修 bug:createBook 補送 `added_at`
3. 套用定案 schema.sql(RLS + 兩個 Storage bucket + policy)
4. 做登入頁 + Google OAuth 串接(spec 第 2 節)
5. 資料層改造:books/notes 讀寫改走 Supabase(spec 第 3 節)
6. **遷移函式可以晚一點做**(spec 第 4 節),先確認登入 + 新資料存取正常,再做舊資料搬家,避免一次做太多難除錯

### 預估時間
- 你的人工申請部分:20–40 分鐘
- CC 實作:抓 2–4 小時,但建議拆成「登入+資料層」「舊資料遷移」兩個階段分開驗收,不用一次衝完

---

## 四、環境備忘(比照 Google Books API 雙軌配置慣例)

- 本機 `.env`:新增 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY
- Vercel Project Settings → Environment Variables:同兩把 key 也要填
- 兩處都要設定完成才 build/部署;Vite 變數是 build 時打包
- Google OAuth Client 的 Authorized JavaScript origins:記得加 `http://localhost:5173` 與正式網域 `https://marginalia-ruddy.vercel.app`

---

## 附錄:Google OAuth Client ID 申請步驟

1. Google Cloud Console → 選 Google Books API 那個同一專案
2. APIs & Services → OAuth consent screen → External,填應用資訊,Test users 先加自己帳號
3. Credentials → + Create Credentials → OAuth client ID → Web application
4. Authorized redirect URIs 貼 Supabase Dashboard → Authentication → Providers → Google 頁面列出的回呼網址
   (格式類似 https://<專案ref>.supabase.co/auth/v1/callback)
5. 拿到 Client ID / Client Secret → 貼回 Supabase Providers → Google,啟用
6. Authorized JavaScript origins 補上 localhost:5173 與正式網域

---

## 五、驗收清單(完整版見 supabase-auth-migration-spec.md 最末節)

- 登入頁可用、Google 登入成功
- 首次登入自動遷移,8 本書 + 筆記 + 截圖都上雲
- 種子書/舊書狀態分類遷移後不跳分類
- 年/月篩選遷移後仍正確(added_at 已回填)
- 換裝置/清本機資料後登入同帳號,資料還在
- 未設定 Supabase 環境變數時,app 仍可退回 localStorage 模式(防呆不可移除)
