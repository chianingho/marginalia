# Marginalia 架構備忘

技術交接用的精簡附件。更新原則：每次大改版（新增畫面、資料模型變動、共用機制變動）
順手更新這份文件，不用鉅細靡遺，抓「新接手的人要先知道的事」就好。

## 資料夾職責

| 資料夾 | 職責 |
| --- | --- |
| `src/pages/` | 路由頁面（`App.jsx` 的 `<Route>` 直接對應的元件），一頁一個檔案 |
| `src/components/` | 頁面之間共用的可重用元件（modal、列表、標注畫面等），不直接掛路由 |
| `src/lib/` | 純資料／工具邏輯：localStorage 讀寫、IndexedDB 圖片存取、格式化、共用 hook，不含路由概念 |
| `src/api/` | 資料存取的對外介面：本機模式（`hasSupabaseConfig` 為 false）落到 `lib/localStore.js`，
  之後接 Supabase 就是這層改打真的資料庫；也放外部第三方 API（`googleBooks.js`） |
| `src/styles/` | 全站設計常數（`tokens.css`），`index.css` 在檔案最上面 `@import` 進來 |

## 資料流

### localStorage（`src/lib/localStore.js`）
- `reading-notes:books`：書籍清單（`id/title/author/cover_url/status/category/
  started_at/finished_at/created_at`）
- `reading-notes:notes`：筆記清單（`id/book_id/content/image_original/image_display/
  strokes/note_date/page/created_at/updated_at`）
- `reading-notes:seeded`：是否已塞過範例書籍的旗標，只用一次

筆記排序、時間顯示全部以 `created_at` 為單一事實來源，`note_date` 只是新增時自動衍生、
不再是使用者輸入欄位，也不用來排序或顯示。

### IndexedDB（`idb-keyval`，唯一入口 `src/lib/imageStore.js`）
筆記截圖不進 localStorage（容量有限，圖片會塞爆），一律存 IndexedDB，note 記錄只存 key
參照：

- `note-img-{noteId}`：`image_original`，標注前原圖，**永不覆寫**
- `note-img-display-{noteId}`：`image_display`，原圖 + `strokes` 合成後的顯示快取，
  每次標注 Done 覆寫

`strokes`（正規化 0–1 座標的筆畫資料）存在 note 記錄本身，不在 IndexedDB。

**舊資料相容**：改版前建立的筆記只有 `image_key`（當時的破壞性合成結果），沒有上面三個
新欄位。全部用「讀取時 fallback」處理（見 `src/lib/noteAnnotation.js` 的
`getOriginalImageKey`／`getNoteDisplayBlob`），不做一次性改寫遷移：`image_key` 直接當
`image_original`，`strokes` 視為空陣列。

之後要加新的圖片種類（例如封面圖存 IndexedDB），比照這個模式在 `imageStore.js` 加一個
`xxxImageKey(id)` 函式即可，get/set/delete 這幾個通用讀寫函式不用動，呼叫端也不用改。

### 訪客模式（登入體驗批次，2026-07-23 定案）
訪客是獨立於「已登入（Supabase）」「未登入本機預覽（無 env）」之外的**第三種**資料層狀態，
不是 `hasActiveSupabaseSession()` 回傳 false 的隱含推論：

- 旗標：`lib/guestMode.js` 的 `marginalia_guest_mode`（localStorage），獨立且明確，`App.jsx`
  跟 `api/books.js`／`api/notes.js` 都靠這支旗標判斷，不是猜的。
- 命名空間：`lib/localStore.js` 把原本寫死的 `BOOKS_KEY`/`NOTES_KEY`/`SEEDED_FLAG_KEY` 抽成
  `createLocalStore(keys)` 工廠，`lib/guestStore.js` 用另一組 key
  （`reading-notes:guest:books`/`notes`/`seeded`）呼叫同一個工廠，不重寫邏輯。訪客不 seed
  範例書。
- **這個命名空間隔離是第 2 階段一次性遷移函式能不能安全上線的前提**：遷移函式只讀
  `reading-notes:books`/`notes`，永遠不會掃到訪客資料，訪客隨手加的書不會污染使用者本人
  登入後的雲端書櫃。之後若要改動 `localStore.js`/`guestStore.js` 的 key 命名，務必同步確認
  遷移函式（尚未實作）沒有寫死引用舊 key。
- 訪客中途登入：`App.jsx` 監看 `session`，一旦變真就呼叫 `exitGuestMode()`——旗標清掉，
  訪客資料留著當無害殘留（不上傳、不清除），避免之後單純登出被誤判成訪客而跳過登入頁。

## 全站共用機制

- **Modal 容器**：`.add-modal-backdrop` / `.add-modal`（見 `index.css`），
  `AddBookModal`／`NoteModal` 共用這一份外殼（尺寸、`85dvh` 上限、內部自捲）。
  `EditBookModal` 目前用的是更早的 `.modal-backdrop` / `.modal`，兩套殼層並存，
  是已知的技術債，不在這批處理範圍內。
- **scrollLock**：`src/lib/scrollLock.js` 的 `useScrollLock()`，body
  `position:fixed` + `scrollY` 記錄/還原，所有全螢幕 modal／標注畫面共用。
- **tokens.css**：`src/styles/tokens.css`，全站色彩／關鍵佈局值的唯一定義。
- **imageStore.js**：`src/lib/imageStore.js`，IndexedDB 圖片存取的唯一入口。
- **format.js**：`src/lib/format.js`，`created_at` 的日期/時間顯示格式化。
- **meta-text（設計系統修訂，2026-07-13 定案，B-5 擴大範圍）**：Cormorant
  自「日期標頭與頁碼」退場，metadata 類文字統一改用跟時間戳同一份
  font-family（`var(--font-sans)`）、無斜體，共用 class `.meta-text`
  （`index.css`，只給 font-family/font-style，字級/顏色留給各自的 class）。
  範圍：筆記頁日期標頭、筆記頁/詳情頁 p.{n}、兩處時間戳、**{n} books**
  （`.wrap-shelf-count`）、**{Status} · {n} notes**（`.book-page-meta`）。
  Cormorant（`var(--font-brand)`）剩下的用途：排標題、See All 大標、chips、
  Status 標籤——這些不是「metadata 數字/時間」性質，不受影響。
- **返回鍵（導航鐵則，2026-07-12 定案）**：
  1. 預設：全 app 返回一律 `‹` chevron、無外框、無底色；深色底反白 `#FDFCFA`，
     淺色底 `#111`；熱區以透明 padding 撐到 ≥44×44。
  2. 例外（fixed 浮動鍵）：跟著螢幕捲動、會浮在不同底色內容上的返回鍵，用
     `.btn-frosted` 圓形變體（墨綠磨砂圓底）+ 白 `‹`——綠帶上、白底上都可見。
     目前僅筆記頁（`/book/:id`）適用。
  3. 標注畫面（`ImageAnnotator`）：無 `‹` 也無 X，離開一律走 Cancel／Done 膠囊。
- **頭像不納入導覽按鈕 tier 系統（登入體驗批次，2026-07-23 定案）**：前一批次
  （Supabase 上雲第 1 階段）遺留的爭議項——登出鈕 spec 文字寫「chevron tier」、
  實作是 `.pill-btn` 圓形圖示——因本批次改成頭像 + 登出下拉而失效，不再追認
  亦不退回。頭像（`AvatarMenu.jsx`）是身分識別元件，只是視覺上跟 `.pill-btn`
  對齊高度（`getBoundingClientRect()` 量測，不寫死尺寸），不屬於上面的返回鍵
  tier 系統，也不比照 `.pill-btn`/`.btn-frosted` 的材質規則。
- **首頁橫幅（2026-07-13 定案，取代 0712 總規格第 1 項「沿用頁面邊距」）**：
  `BrandBanner` 改 full-bleed 貼齊螢幕邊（不再吃 `.bookshelf-header` 左右
  padding）——原本的 Group by 疊字機制（absolute 疊在圖上顯示模式名/選中值）
  整組廢除，**chips 是分組狀態唯一的視覺指示**。`BrandBanner` 吃一個
  `children` prop，讓 Bookshelf 把搜尋/篩選 icons 疊在橫幅內部，因為所有
  「相對橫幅寬高的百分比定位」（icons 對齊 Marginalia/書脊、subtitle 等）
  都必須以 `.brand-banner` 自己的滿版寬度（390px）當基準，外面若再包一層
  會吃 `.bookshelf-header` padding 的 wrap div，百分比會算錯（曾經踩過一次，
  B-2 修正）。已知限制：banner.png 圖檔本身烙有**不透明**（無 alpha）
  的白色羽化圓角，滿版後四角仍會露出白色缺口，`.brand-banner` 補的
  `background: var(--color-green)` 只對「半透明邊緣造成的色差縫」有效，
  對完全不透明的色塊沒有效果——要徹底解決得重出圖檔（拿掉圓角或轉真正的
  透明背景）。
  Year/Category 分組模式下（chips 顯示時）：All chip（或還沒選任何 chip）
  ＝全館所有書籍的換行書架（跟「所有書籍」篩選選項重用同一個 `WrapShelf`
  元件，不是「各組一排橫滑」了）；選中特定 chip＝該組換行書架。「各組
  一排橫滑」的多排視圖現在**只存在於 Status 模式**（`ShelfRow`）。所有
  書架區塊標頭一律只留右側 `{n} books`（`.wrap-shelf-count`，
  margin-left:auto 確保沒有組名陪襯時仍貼右），組名文字不顯示；Status
  模式排標題與 See all 完全不受影響、照舊顯示。
- **筆記放大／標注唯一入口**：`/note/:id`（`NoteDetail.jsx`）是筆記圖片
  放大檢視與標注的唯一入口。舊的「點縮圖→整頁黑底 lightbox→中央白色
  Edit annotation 膠囊」入口（原 `NoteImageLightbox` 的一般檢視分支）已
  整組移除；`NoteImageLightbox.jsx` 現在單純是「撈原圖→進
  `ImageAnnotator`→存檔」的 wrapper，不再有檢視/標注兩態切換。
  `NoteList.jsx` 的縮圖不再有獨立 `onClick`，點卡片任何位置一律導頁進
  `/note/:id`。
- **海報底色 token（book-detail-redesign-0719 定案）**：`--poster-backdrop`
  （`tokens.css`，`#EFEBE2`），固定用在書籍詳細頁的書封展示色塊
  （`.book-page-poster`）。跟 `--paper`/`--cream` 是各自獨立的值，不要互相
  取代——三者視覺相近但語意不同（`--cream` 全站背景、`--paper` 卡片底、
  `--poster-backdrop` 只給海報式展示色塊）。
- **書籍詳細頁結構（book-detail-redesign-0719 改版，取代舊版綠帶/紙感卡片
  header）**：`BookDetail.jsx` 由上而下＝固定返回鍵（`.btn-frosted--circle`，
  樣式/邏輯沒變）→ 海報式書封色塊（`.book-page-poster`，`--poster-backdrop`
  底、書封置中）→ 書名/meta 區（`.book-page-titleblock`，書名 Noto Serif TC
  700、髮絲線、四欄 meta 網格：作者｜狀態｜N notes｜Edit，皆套 `.meta-text`）
  → `NoteList` 日期分組時間流（每則筆記是白底海報感方卡 `.note-timeline-card`：
  縮圖滿寬貼頂→頁碼（純文字小字，`--font-serif`）→內文→髮絲線→時間｜類型
  meta 一行）。本批次明訂不含手繪/插畫元素。已知落差：筆記資料目前沒有
  獨立的「標題」欄位（`NoteModal` 只有 `content`/`page`），時間流卡片因此
  沒有標題列，頁碼也沒有標題可對齊，只顯示 `content` 當內文——之後真的要加
  標題需要先擴充資料模型。

## 新增畫面時的規則

1. **顏色一律用 `tokens.css` 的變數**，沒有合用的才新增，不要寫死 hex 值。
2. **時間顯示一律以 `created_at` 為準**，不要另外設計時間欄位；格式化函式放
   `src/lib/format.js`。
3. **圖片一律走 `src/lib/imageStore.js`**，不要直接 import `idb-keyval`。
4. **Modal 一律重用 `.add-modal-backdrop`/`.add-modal` 殼層 + `useScrollLock()`**，
   不要重寫容器或滾動鎖定邏輯。
5. 新增筆記相關欄位時，確認 `getOriginalImageKey`／`getNoteDisplayBlob`
   （`src/lib/noteAnnotation.js`）的 fallback 邏輯是否要跟著調整，維持舊資料相容。
