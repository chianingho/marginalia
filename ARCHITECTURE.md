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
- **返回鍵（導航鐵則，2026-07-12 定案）**：
  1. 預設：全 app 返回一律 `‹` chevron、無外框、無底色；深色底反白 `#FDFCFA`，
     淺色底 `#111`；熱區以透明 padding 撐到 ≥44×44。
  2. 例外（fixed 浮動鍵）：跟著螢幕捲動、會浮在不同底色內容上的返回鍵，用
     `.btn-frosted` 圓形變體（墨綠磨砂圓底）+ 白 `‹`——綠帶上、白底上都可見。
     目前僅筆記頁（`/book/:id`）適用。
  3. 標注畫面（`ImageAnnotator`）：無 `‹` 也無 X，離開一律走 Cancel／Done 膠囊。

## 新增畫面時的規則

1. **顏色一律用 `tokens.css` 的變數**，沒有合用的才新增，不要寫死 hex 值。
2. **時間顯示一律以 `created_at` 為準**，不要另外設計時間欄位；格式化函式放
   `src/lib/format.js`。
3. **圖片一律走 `src/lib/imageStore.js`**，不要直接 import `idb-keyval`。
4. **Modal 一律重用 `.add-modal-backdrop`/`.add-modal` 殼層 + `useScrollLock()`**，
   不要重寫容器或滾動鎖定邏輯。
5. 新增筆記相關欄位時，確認 `getOriginalImageKey`／`getNoteDisplayBlob`
   （`src/lib/noteAnnotation.js`）的 fallback 邏輯是否要跟著調整，維持舊資料相容。
