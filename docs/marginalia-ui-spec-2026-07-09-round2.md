# Marginalia · UI 調整規格(2026-07-09 第二輪)

> 交給 Claude Code 實作。專案路徑 `~/Desktop/jessica_agent`。
> 涉及範圍:首頁底部 scrim、書架排標題 See all、新增書籍(modal → 整頁)。
> **除本文件列出的項目外,其他既有元素一律不動**(書架 3D 造型、標題 lockup、書卡樣式維持現狀)。

---

## 任務一:底部 Add Book scrim 改為「滾動時才出現 + 液態淡出」

### 現況問題
1. 霧化區塊太大片,常駐顯示
2. 霧化區上緣有一條明顯的「線」(backdrop-filter 硬邊界造成)

### 規格

**A. 消除硬邊界(液態感)**

scrim 元素(含 backdrop-filter 的那層)加上漸層遮罩,讓模糊效果本身由下往上淡出:

```css
.bottom-scrim {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;               /* 從現在的高度縮小,約 120px */
  pointer-events: none;         /* 不擋點擊 */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: linear-gradient(to top, rgba(253,252,250,0.9), rgba(253,252,250,0));
  /* 關鍵:mask 讓 blur 也漸層淡出,消除那條線 */
  mask-image: linear-gradient(to top, black 40%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 40%, transparent 100%);
  transition: opacity 0.35s ease;
}
```

> 重點:那條線的成因是 backdrop-filter 區塊邊界太硬。`mask-image` 讓模糊強度隨高度漸弱,邊界自然消失。`background` 的白色漸層與 mask 同時保留,兩者疊加才夠柔。

**B. 滾動時才出現**

- 預設狀態:scrim `opacity: 0`
- 使用者滾動中:`opacity: 1`(淡入)
- 停止滾動 600ms 後:淡出回 0
- 已滾到頁面最底部時:保持隱藏(底下沒有內容,不需暗示)
- **Add Book 黑色膠囊按鈕不受影響,永遠顯示**(按鈕與 scrim 必須是兩個獨立元素,z-index 按鈕在上)

```js
// 實作示意(React):
let scrollTimer;
window.addEventListener('scroll', () => {
  const atBottom =
    window.innerHeight + window.scrollY >= document.body.scrollHeight - 8;
  setScrimVisible(!atBottom);
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => setScrimVisible(false), 600);
}, { passive: true });
```

---

## 任務二:排標題右側加「See all」跳轉

### 規格
- 三排(To Read / Reading / Finished)標題列右側,原本的數字改為:`See all ›`(或 `4 · See all ›`,以視覺不擁擠為準,先做 `See all ›` 純文字版)
- 樣式:與排標題同字級(13–14px)、細字重、黑色、無底線;`›` 用字元即可
- 點擊跳轉:`/shelf/to-read`、`/shelf/reading`、`/shelf/finished`(React Router 新增路由)

### 新頁面 `/shelf/:status` 規格(先做基本版)
- 白底 #FDFCFA,延續首頁視覺語言
- 頂部:左側返回箭頭 `‹`(回首頁),置中該排名稱(To Read / Reading / Finished,黑色 Serif,字級小於首頁 Books)
- 內容:書封 grid,一行 3 本,gutter 約 12–16px,封面比例與首頁書卡一致
- 無封面 fallback 沿用現有樣式
- 點書卡 → 進該書筆記頁(與首頁點書行為一致)
- 此頁不需要書架 3D 造型,平面 grid 即可
- 預留:8 月 Supabase 之後的排序/篩選會放在這頁,結構上留頂部空間即可,現在不用做

---

## 任務三:新增書籍 modal → 改為整頁 `/add`

### 現況問題
1. 搜尋欄位過長、左右 padding 不對稱
2. 需改為白底黑字、欄位黑框、全英文
3. 主按鈕與取消按鈕位置要交換
4. 寬度超出手機 viewport,下滑時左右晃動

### 決策:放棄 modal,改為整頁路由 `/add`
理由:對稱、晃動、寬度三個問題的根源都是 modal 自身的 margin 與圓角;整頁在手機上也是更好的表單體驗(7/9 交接文件檢查清單第 1 點已有此結論)。Add Book 按鈕點擊後 `navigate('/add')`。

### 版面規格
- 頁面寬度 `width: 100%`(**禁用 `100vw`**,會含捲軸寬度導致橫向溢出)
- 統一內距 `padding: 0 20px`,所有欄位 `width: 100%; box-sizing: border-box` → 左右自動對稱
- `html, body` 與頁面容器加 `overflow-x: hidden`(晃動保險)
- 高度用 `100dvh`(既有鐵則)
- 頂部:左上 `‹` 返回(回首頁),置中頁面標題

### 視覺規格
- 背景:白 #FDFCFA
- 文字:黑 #1A1A1A;標籤(label)可用 #555 細字
- 輸入欄位:白底、`border: 1px solid #1A1A1A`、圓角 10px、內距 12px 14px
- 欄位文字 `font-size: 16px` 以上(iOS 鐵則,含 select)
- 主按鈕(Add Book):黑底白字膠囊,與首頁 Add Book 按鈕同語言
- 次按鈕(Cancel):白底黑字黑框膠囊
- **按鈕排列:Cancel 在左,Add Book 在右**(與現況交換)

### 文案全英文(對照表)

| 現況(中文) | 改為(英文) |
|---|---|
| 新增書籍 | Add Book |
| 輸入書名搜尋封面與資訊 | Search by title… |
| 確認 / 手動填寫資訊 | Details |
| 書名 | Title |
| 作者(選填) | Author (optional) |
| 狀態 | Status |
| 類別(選填) | Category (optional) |
| 不指定 | None |
| 手動上傳封面(選填,會覆蓋搜尋到的封面) | Upload cover (optional, replaces search result) |
| 選擇檔案 / 尚未選取檔案 | Choose file / No file chosen(原生控件文字若無法改,自訂樣式按鈕包一層) |
| 取消 | Cancel |
| 新增 / 新增書籍(送出鈕) | Add Book |

> 類別下拉的選項值(小說/散文/心理/設計/商業/歷史/其他)維持中文——那是使用者資料層,不是介面文案。

### 功能不動
- Google Books 搜尋(300ms debounce、封面 https 替換、fallback)、點選帶入、手動輸入備援、loading / 找不到狀態,全部維持現有邏輯,只改版面與樣式。

---

## 驗收清單(iPhone Safari @ 正式網址)
- [ ] 首頁靜止時底部無霧化;滾動時淡入、停止後淡出;看不到任何硬邊界線
- [ ] Add Book 按鈕全程可見可點
- [ ] 三排 See all 皆可點,新頁 grid 正常、返回正常、空排顯示空狀態不壞版
- [ ] /add 頁左右內距完全對稱,下滑時無左右晃動
- [ ] /add 全英文、白底黑字黑框;Cancel 左、Add Book 右
- [ ] 所有 input / select 字級 ≥16px,聚焦時不觸發 iOS 自動縮放
