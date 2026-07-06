# Marginalia · 我的閱讀筆記

個人用的閱讀筆記 web app：書庫首頁瀏覽所有書、新增書籍時自動用 Google Books API 抓封面與資訊、針對每一頁可以記錄截圖、日期、心得。

技術：React (Vite) + Supabase（資料庫 + 圖片儲存）+ Vercel 部署。單人使用，沒有登入機制。

## 1. 安裝與本機開發

```bash
npm install
cp .env.example .env.local   # 再填入下方 Supabase 的 URL 與 anon key
npm run dev
```

### 1.1 先預覽畫面（不設定 Supabase 也可以）

如果還沒設定 Supabase，**不需要建立 `.env.local`**，直接 `npm run dev` 就能跑：
app 偵測不到 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 時，會自動改用瀏覽器的
`localStorage` 暫存書籍與筆記資料（畫面上方會出現黃色提示列說明目前是「本機預覽模式」）。

這個模式只是方便你先看畫面、測試操作流程：
- 資料只存在目前這個瀏覽器裡，清除瀏覽器資料或換瀏覽器就會不見
- 圖片是直接轉成 base64 存進 `localStorage`，瀏覽器容量有限（通常 5–10MB），放幾張大圖就可能爆掉

之後只要照著下面「2. 設定 Supabase」建好專案、把 `VITE_SUPABASE_URL` 與
`VITE_SUPABASE_ANON_KEY` 填進 `.env.local`，**完全不用改任何程式碼**，重新整理頁面就會自動切換成
Supabase 雲端儲存（黃色提示列也會消失）。

> 注意：本機預覽模式的資料不會自動搬到 Supabase，兩邊是分開的儲存空間。

## 2. 設定 Supabase

### 2.1 建立專案

到 https://supabase.com 建立一個新專案，記下：
- Project URL（`Settings → API → Project URL`）
- anon public key（`Settings → API → Project API keys → anon public`）

把這兩個值填入 `.env.local`：

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

### 2.2 建立資料表

打開 Supabase Dashboard 的 **SQL Editor**，貼上 `supabase/schema.sql` 整段內容並執行。

它會建立兩張表：

**`books`（書籍）**
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid | 主鍵，自動產生 |
| title | text | 書名 |
| author | text | 作者（可空） |
| cover_url | text | 封面圖片網址 |
| google_books_id | text | Google Books 的書籍 ID（可空，方便日後比對） |
| created_at | timestamptz | 建立時間 |

**`notes`（筆記）**
| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | uuid | 主鍵，自動產生 |
| book_id | uuid | 對應 `books.id`，刪除書籍時連同筆記一起刪除 |
| read_date | date | 閱讀日期 |
| content | text | 心得文字（可空） |
| screenshot_url | text | 該頁截圖網址（可空） |
| created_at | timestamptz | 建立時間 |

因為是單人使用、不需要登入，schema 已經把這兩張表的 **Row Level Security 關閉**，讓前端可以用 anon key 直接讀寫。如果之後想加登入機制，記得改回啟用 RLS 並加上對應的 policy。

### 2.3 建立 Storage Buckets（圖片儲存）

到 **Storage** 頁面，建立兩個 bucket：

1. `covers`（書籍封面，手動上傳時使用）
2. `screenshots`（筆記頁面截圖）

兩個 bucket 都設成 **Public bucket**（建立時勾選 Public，或之後在 bucket 設定中開啟），這樣存進去的圖片才能直接用公開網址顯示在頁面上。

> 如果你想更嚴謹一點，也可以不開公開存取，改用 signed URL，但那樣程式碼要再調整成呼叫 `createSignedUrl`。對個人工具來說，Public bucket 最簡單。

完成後就不需要再做其他設定 — 程式碼裡 `src/lib/supabaseClient.js` 已經對應 `covers` 與 `screenshots` 這兩個 bucket 名稱。

## 3. 部署到 Vercel

1. 把專案推到 GitHub
2. 到 https://vercel.com 用該 repo 建立新專案，框架會自動偵測為 Vite
3. 在 Vercel 專案的 **Settings → Environment Variables** 新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy 即可

## 4. 專案結構

```
├── supabase/schema.sql        # Supabase 資料表 SQL
├── src/
│   ├── lib/supabaseClient.js  # Supabase client 初始化
│   ├── api/
│   │   ├── books.js           # 書籍的 CRUD（含封面上傳）
│   │   ├── notes.js           # 筆記的 CRUD（含截圖上傳）
│   │   └── googleBooks.js     # 呼叫 Google Books API 搜尋封面/資訊
│   ├── components/
│   │   ├── BookCard.jsx       # 書庫卡片
│   │   ├── AddBookModal.jsx   # 新增書籍的彈窗（搜尋 + 手動填寫/上傳）
│   │   ├── NoteForm.jsx       # 新增筆記表單
│   │   └── NoteCard.jsx       # 單則筆記卡片
│   └── pages/
│       ├── Bookshelf.jsx      # 書庫首頁
│       └── BookNotes.jsx      # 單本書的筆記頁
```

## 5. 關於 Google Books API

搜尋功能呼叫的是公開端點 `https://www.googleapis.com/books/v1/volumes`。沒有設定 API Key 時，會用 Google 提供的「共用額度」查詢——這個額度是全世界沒帶 Key 的請求一起共用的，尖峰時段很容易被用完，出現如下錯誤：

```
Google Books 搜尋失敗（HTTP 429：Quota exceeded for quota metric 'Queries' ...）
```

解法是申請一組你自己的 API Key，改用個人配額：

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 建立（或選擇既有）專案
2. 在「APIs & Services → Library」搜尋 **Books API** 並啟用
3. 到「APIs & Services → Credentials」點選 **Create Credentials → API key**，複製產生的 Key
4. （建議）編輯這把 Key，在 **API restrictions** 限制成只能呼叫 Books API，避免外洩後被濫用
5. 把 Key 填入 `.env.local`：

```
VITE_GOOGLE_BOOKS_API_KEY=你的key
```

填好後重新啟動 `npm run dev`，程式會自動在搜尋請求帶上這把 Key（見 `src/api/googleBooks.js`），改用你個人的每日額度。
