# localStorage 現況盤點報告

只讀清點，未修改任何程式碼或檔案。範圍：`/Users/chianiny/Desktop/jessica_agent`，目前跑在本機模式（沒設定 Supabase 環境變數，`hasSupabaseConfig` 為 false）。

盤點日期：2026-07-21。目的：準備 Supabase 上雲前，確認 localStorage 目前實際存了哪些資料與欄位。

---

## 1. 所有 localStorage key

| Key | 定義位置 | 用途 |
|---|---|---|
| `reading-notes:books` | `localStore.js:11`（`BOOKS_KEY`） | 所有書籍記錄（JSON 陣列） |
| `reading-notes:notes` | `localStore.js:12`（`NOTES_KEY`） | 所有筆記記錄（JSON 陣列） |
| `reading-notes:seeded` | `localStore.js:13`（`SEEDED_FLAG_KEY`） | 一次性旗標，避免使用者刪掉範例書後又被重新塞回 5 本範例書 |
| `marginalia_splash_seen` | `Splash.jsx:14` | 是否已看過開場動畫 |
| `marginalia_onboarded` | `useOnboarding.js:8` | 是否已完成/略過導覽 |

注意：**沒有任何 localStorage key 存圖片位元**。截圖走 IndexedDB（見第 5 節）。這兩個 flag 分散在元件/hook 檔案裡，沒有跟 `localStore.js` 集中管理。

---

## 2. 完整欄位盤點

### 書（Book）— `createBook`/`updateBook`，`localStore.js:102-167`

| 欄位 | 型別 | 範例 | 是否可為空 |
|---|---|---|---|
| `id` | string (UUID) | `"3fa1..."` | 一定有 |
| `title` | string | `"小王子"` | 一定有 |
| `author` | string \| null | `"聖修伯里"` | 可空 |
| `cover_url` | string（data URL 或外部 URL）\| null | | 可空 |
| `google_books_id` | string \| null | | 可空 |
| `status` | string enum | `"reading"` | 建立時一定寫入（預設 `to_read`）；**但範例種子書完全沒有這欄位**（連 null 都沒有，直接不存在） |
| `category` | string \| null | `"小說"` | 未選則 null；種子書同樣沒有這欄位 |
| `started_at` | ISO 字串 \| null | | status 第一次變 `reading` 才會有值；種子書沒有這欄位 |
| `finished_at` | ISO 字串 \| null | | status 第一次變 `finished` 才會有值；種子書沒有這欄位 |
| `created_at` | ISO 字串 | | 一定有，建立後**不會**被 update 覆寫 |
| `added_at` | ISO 字串 | | **只在 createBook 時寫入**（`localStore.js:126`），updateBook 完全不碰它；舊書（這個欄位加入之前建立的）跟種子書都沒有 |

**特別確認的欄位**：
- `status`／`category`：確實叫這兩個名字，一般建立/編輯路徑都有（category 可能是 null），**種子資料完全沒有這兩個 key**。
- `added_at`：確實叫這個名字，只在新增時寫入完整 ISO 時間戳，年/月篩選（`shelves.js`）唯一依據，編輯不更新它。
- `started_at`／`finished_at`：確實叫這兩個名字，由 `bookStatus.js` 的 `deriveStatusDates` 依 status 轉換自動衍生，一旦寫入就不會因狀態改回去而被清掉。

### 筆記（Note）— `addNote`/`updateNote`，`localStore.js:211-259`

| 欄位 | 型別 | 範例 | 是否可為空 |
|---|---|---|---|
| `id` | string (UUID) | | 一定有 |
| `book_id` | string (UUID, FK) | | 一定有 |
| `content` | string \| null | | 可空 |
| `image_original` | string（IndexedDB key）\| null | `"note-img-9c21..."` | 沒截圖就 null |
| `image_display` | string（IndexedDB key）\| null | | 沒標注過就 null，圖片換了會被清空重算 |
| `strokes` | array | `[]` | 沒標注過是空陣列 |
| `note_date` | string `YYYY-MM-DD` | `"2026-07-21"` | 建立時自動從 `created_at` 衍生，**現在沒有任何 UI 讀它/顯示它**，是為了未來 Supabase schema 對齊保留的欄位 |
| `page` | number \| null | `12` | 可空，從輸入框文字 `Number()` 轉出來 |
| `created_at` | ISO 字串 | | 一定有，不變 |
| `updated_at` | ISO 字串 | | 建立=created_at，每次 update 重算 |

舊資料相容欄位：`image_key`（改版前的破壞性合成截圖，只在讀取時當 fallback，現在的寫入路徑完全不會再產生這個欄位）。

**特別確認的欄位**：
- `created_at`：確實叫這個名字，一定有，不可變。
- `page`：確實叫這個名字，存成 JS number（不是字串）。
- **截圖存法**：Note 記錄本身**只存兩把字串 key**（`image_original`/`image_display`），不存圖片位元本身——完整機制在第 5 節。

---

## 3. 命名/型別不一致

- **snake_case（存進去的欄位）vs camelCase（JS 參數）**：例如 `google_books_id`（存）↔ `googleBooksId`（傳進 `createBook` 的參數名）。這是一致的慣例，不是 bug，但 migration script 需要一份明確的對照表。
- **`created_at` 跟 `added_at` 容易被誤認為同一件事**：新書建立當下兩者數值相同，但語意不同——`created_at` 一定有、`added_at` 可能沒有（舊資料、種子資料）。migration 時不能假設兩者可互換。
- **時間戳格式不統一**：`created_at`/`updated_at`/`started_at`/`finished_at`/`added_at` 都是完整 ISO 時間戳，但 `note_date` 是**只有日期**的 `YYYY-MM-DD`，同一筆 Note 記錄裡兩種粒度並存。
- **`image_key`（舊）vs `image_original`（現行）**：同一個概念（筆記截圖）依建立時間不同叫不同名字。
- **種子書的欄位「形狀」跟正常書不一樣**：不是欄位值為 null，是欄位**完全不存在**（少了 `status`/`category`/`started_at`/`finished_at`/`added_at` 五個 key）。

---

## 4. 舊資料相容性 fallback 清單

| 位置 | 函式 | 行為 |
|---|---|---|
| `shelves.js:17-19` | `resolveShelfKey` | 沒有 `status` 或值不合法 → 一律當 `reading` |
| `shelves.js:29-34` | `resolveAddedAtParts` | 沒有 `added_at` 或日期無效 → 回傳 `null`，該書**完全不進**任何年/月篩選桶（刻意不做「無日期」桶） |
| `shelves.js:78` | `buildShelfRows('category')` | 沒有 `category` → 歸進 `Uncategorized` |
| `bookStatus.js:5-9` | `deriveStatusDates` | 已有值的 `started_at`/`finished_at` 永不清除，即使狀態改回去 |
| `noteAnnotation.js:11-13` | `getOriginalImageKey` | 沒有 `image_original` → 退回讀舊欄位 `image_key`；都沒有 → `null` |
| `noteAnnotation.js:15-17` | `getNoteStrokes` | 沒有 `strokes` → 回傳 `[]` |
| `noteAnnotation.js:23-30` | `getNoteDisplayBlob` | 沒有顯示快取 → 退回讀原圖 |
| `localStore.js:93` | `fetchBooks()` 排序 | **例外**：直接對 `created_at` 呼叫 `.localeCompare`，沒有像其他地方做 `\|\| ''` 防呆——理論上所有書都一定有這欄位，但這是唯一沒防呆的排序點 |

---

## 5. 截圖／圖片存法

- **機制**：IndexedDB（透過 `idb-keyval`），唯一入口是 `imageStore.js`，檔頭註解明講「不進 localStorage」，就是為了閃開 localStorage 5–10MB 的容量上限。
- **存的是什麼**：直接存 **Blob（JPEG）**，不是 base64、不是檔名。
- **每則筆記兩把 key**（都是從 `noteId` 算出來的固定字串，不存在 Note 記錄裡）：
  - `note-img-${noteId}`：標注前原圖，永不覆寫
  - `note-img-display-${noteId}`：原圖+筆畫合成後的顯示快取，每次標注完成就覆寫
- **上傳前有壓縮**：長邊縮到 ≤1200px，輸出 JPEG quality 0.8（`compressImage`，`imageStore.js`），所以透過正常新增筆記流程進來的截圖都有做過大小控制。
- **書封是另一套機制**：`cover_url` 存在 Book 記錄本身（進 localStorage），使用者手動上傳的封面是**未壓縮的 base64 data URL**（`fileToDataUrl`，`readAsDataURL`）——這塊沒有走跟截圖一樣的壓縮/IndexedDB 路線，是目前 `reading-notes:books` 這個 key 真正有容量風險的地方。

---

## 6. 其他觀察（只記錄，未動手修）

- **`added_at` 沒有寫進 Supabase 路徑**：`api/books.js` 的 `createBook` 送進 Supabase 的欄位是 `title/author/cover_url/google_books_id/status/category/started_at/finished_at`，**完全沒有 `added_at`**。如果 Supabase 那邊的 `books` 表沒有獨立補上這個欄位（+ 適當 default），上雲當下年/月篩選會直接全部變成「無日期」。這是為上雲要特別處理的一點。
- 種子書的欄位「形狀」跟一般書不同（見第 3 節），migration script 不能假設所有 Book row 都是同一個 shape。
- `note_date` 目前是死欄位——一直在寫，但沒有任何畫面讀它/顯示它，純粹是為了跟未來 Supabase schema 對齊而保留。
- `fetchBooks()` 的排序沒有跟其他排序點一樣防呆（見第 4 節表格最後一行）。
