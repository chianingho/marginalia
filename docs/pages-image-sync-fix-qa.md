# Pages 圖片還原修補與 QA

2026-10-12。僅修改 Pages；未更動 schema、Storage 路徑、原有圖片 key、驗證流程或其他專案。既有產品更名、README 變更、未追蹤檔案與影片刪除紀錄均保留。未 commit、push、deploy。

## 確認原因

`api/notes.js` 只將遠端 `image_path` 對應到 `note-img-${id}`，沒有下載圖片。列表、詳情、編輯預覽及標註器只讀本機 Blob。`getNoteDisplayBlob` 沒有從原圖與遠端正規化 strokes 重建顯示圖，導致新裝置空白，舊合成快取也可能遮住新筆畫。

`ImageAnnotator.handleDone` 現有流程只保存筆畫座標，並未保存色票；這是既有資料限制，不可能從遠端座標推回舊顏色。修補使用既有黃色 fallback，若已有帶 color 的物件筆畫亦可讀取，未改寫任何 strokes。

## 修補

- `src/lib/noteAnnotation.js`：共用原圖讀取，核對登入帳號與路徑、缺圖時 authenticated Storage download、解碼驗證、合併同時下載、下載後再次核對帳號；缺少合成快取時依原圖與目前 row 的 strokes 合成；所有模式保留原有合成快取，避免改變 A 既有色票。
- `src/lib/imageStore.js`：以 IndexedDB 原子 update 補入缺圖；若下載期間有新圖片寫入則保留既有圖片。寫入失敗仍可顯示已下載的 Blob。
- `src/api/notes.js`：找不到待上傳 Blob 時明確失敗，避免 resetAnnotation 更新誤清空 image_path／strokes。
- `src/components/ImageAnnotator.jsx`：沿用相同筆寬、multiply 與圓角，抽出原繪圖函式與還原共用；未變更儲存格式或工具操作。
- `src/components/NoteList.jsx`、`NoteImageLightbox.jsx`、`NoteModal.jsx` 與 `src/pages/NoteDetail.jsx`：共用還原流程；筆記資料更新時重新讀圖並清除舊顯示 URL。
- `tests/image-sync.html`、`tests/image-sync.mjs`：可重跑的隔離瀏覽器／模擬雲端回歸測試。

讀圖錯誤回傳 null 並記錄錯誤，文字仍可顯示；沒有批次資料讀取失敗或未處理的圖片 Promise rejection。失敗後重新開啟頁面可重試。未新增資料遷移或刪除快取。

## 已通過

- `npm run build`、`git diff --check`。
- 原專案沒有 typecheck、lint 或測試指令；新增測試以 `node tests/image-sync.mjs` 執行。
- A 使用實際 addNote／updateNote API 上傳圖片與儲存 strokes；兩個獨立 Chromium contexts 各自持有 localStorage／IndexedDB，共用模擬遠端。
- B 空 IndexedDB 下載正確圖片、列表與詳情顯示；canvas 像素比對確認正規化筆畫與標註器還原。
- B 重新整理後讀取持久原圖，不需重複下載。
- B 沒有合成快取時，改變遠端 strokes 後可重新合成。
- Storage 404、網路失敗、無法解碼的 Blob：失敗圖片與正常圖片同時出現在列表，四筆文字仍顯示，零 pageerror。
- 非所屬帳號不能讀取遠端筆記的本機原圖。
- 待上傳 Blob 缺失時不能清空遠端圖片與筆畫；只改文字保留 image_path 與 strokes。
- A 原圖與合成快取的 bytes、模擬遠端原圖、文字及筆畫在還原前後一致。
- insert-only 快取不覆寫既有 Blob；舊 image_key／本機顯示快取仍相容。

測試前啟動專用環境（此 URL 只是 mock，沒有真實 Supabase）：

```sh
VITE_SUPABASE_URL=http://127.0.0.1:5186 VITE_SUPABASE_ANON_KEY=public-test-key npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
node tests/image-sync.mjs
```

不要使用正式網址作為測試的 Supabase URL。測試 fixture 僅供 Vite 開發伺服器，未加入 production build 入口。

## 人工驗證與範圍限制

- 以上不等同於兩台實體裝置或真實 Google OAuth／Supabase／Storage 驗證。需以測試帳號在 A 建立圖片與標註、B 登入確認列表／詳情／標註器及重新整理，再比對 A 資料。
- 實際 Storage RLS、權限失效、瀏覽器儲存配額、Safari 圖片解碼與裝置差異尚待驗證。
- 原圖與合成快取採保留策略。其他裝置替換圖片或修改筆畫後，已有舊原圖／合成圖的裝置仍可能顯示既有 Blob；本次不自動覆寫或清除它。這不是完整的圖片版本同步方案。
- 舊筆畫缺少色票，雲端重建只能依原有規則顯示黃色；A 既有多色合成 Blob 保留並繼續顯示。
- 圖片載入失敗時保留文字，尚未新增專用錯誤提示與重試按鈕。

部署判斷：本機測試通過，可作為待驗證候選；建議先完成兩台真實裝置的測試，並確認接受上述既有色票與原圖版本限制，再部署正式環境。
