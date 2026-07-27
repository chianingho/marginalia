# Marginalia · 全域 UI 現況盤點(2026-07-23)

> 只讀盤點,不做任何修改、不做設計裁決。發現的不一致只記錄在 7-5,不挑代表值、不建議採用哪一個。
> 來源一律是現行程式碼(`src/styles/tokens.css`、`src/index.css`),不是舊文件。

---

## 7-1 色彩

### CSS 變數完整清單

來源:`src/styles/tokens.css:9-85`(全檔,`:root` 區塊)

| 變數名 | 實際值 | 定義位置 |
|---|---|---|
| `--cream` | `#f6f1e6` | tokens.css:11 |
| `--paper` | `#fbf8f0` | tokens.css:12 |
| `--teal` | `#1e7a6d` | tokens.css:13 |
| `--ink` | `#26332e` | tokens.css:14 |
| `--red` | `#d8502c` | tokens.css:15 |
| `--plum` | `#a84e8c` | tokens.css:16 |
| `--mustard` | `#e3a63b` | tokens.css:17 |
| `--cobalt` | `#2c4ea8` | tokens.css:18 |
| `--forest` | `#254b3a` | tokens.css:19 |
| `--pink` | `#e9a0b6` | tokens.css:20 |
| `--hl` | `#f2ff00` | tokens.css:21 |
| `--grid` | `#e6e1d2` | tokens.css:22 |
| `--shelf-top` | `#1e7a6d` | tokens.css:25 |
| `--shelf-edge` | `#175e53` | tokens.css:26 |
| `--shelf-edge-highlight` | `#3d9486` | tokens.css:27 |
| `--poster-backdrop` | `#efebe2` | tokens.css:30 |
| `--color-cover-placeholder-bg` | `var(--poster-backdrop)` | tokens.css:33 |
| `--color-cover-placeholder-ink` | `#b8a78f` | tokens.css:34 |
| `--color-bg` | `var(--cream)` | tokens.css:42 |
| `--color-green` | `var(--teal)` | tokens.css:43 |
| `--color-green-edge` | `var(--shelf-edge)` | tokens.css:44 |
| `--color-ink` | `var(--ink)` | tokens.css:45 |
| `--color-highlight` | `var(--hl)` | tokens.css:46 |
| `--color-hairline` | `var(--grid)` | tokens.css:47 |
| `--color-text-secondary` | `#8a8a86` | tokens.css:48 |
| `--color-note-content` | `var(--ink)` | tokens.css:49 |
| `--color-darkroom` | `#16171a` | tokens.css:50 |
| `--color-ink-on-yellow` | `#1c231b` | tokens.css:51 |
| `--color-surface` | `var(--paper)` | tokens.css:55 |
| `--color-danger` | `var(--red)` | tokens.css:57 |
| `--color-tour-bg` | `#fdfcfa` | tokens.css:62 |
| `--color-ink-soft` | `#3e4a3d` | tokens.css:66 |
| `--ink-rgb` | `38, 51, 46` | tokens.css:71 |
| `--teal-rgb` | `30, 122, 109` | tokens.css:72 |
| `--paper-rgb` | `251, 248, 240` | tokens.css:73 |
| `--shadow-cover` | `0 6px 16px rgba(var(--ink-rgb), 0.14), 0 1px 3px rgba(var(--ink-rgb), 0.1)` | tokens.css:76 |
| `--shadow-float` | `0 10px 26px rgba(var(--ink-rgb), 0.28)` | tokens.css:77 |
| `--shadow-card-hover` | `0 16px 36px rgba(var(--ink-rgb), 0.14), 0 4px 10px rgba(var(--ink-rgb), 0.07)` | tokens.css:79 |
| `--content-left` | `20px` | tokens.css:82 |
| `--safe-top` | `env(safe-area-inset-top)` | tokens.css:83 |
| `--safe-bottom` | `env(safe-area-inset-bottom)` | tokens.css:84 |

另外 `src/index.css:3-11` 的 `:root` 區塊加了三個殼層專用別名:`--color-shell-bg: var(--cream)`、`--color-text: var(--color-ink)`、`--color-text-muted: var(--color-text-secondary)`。

**沒有 `--safe-left`/`--safe-right` token**——只有 top/bottom 兩個方向有變數。

### 每個變數的實際使用位置

逐一列出 40 個變數在 40+ 個元件裡的用法會過於冗長,以下列出**使用頻率高、跨頁面共用**的幾個,其餘變數多半只在 1-2 個 class 裡出現一次:

| 變數 | 主要使用位置(不窮舉) |
|---|---|
| `--color-green` | 全站 `button` 基礎樣式(index.css:41-53)、`.pill-btn`(1119-1121)、`.brand-title`/`.brand-title-over`(986,873)、`.login-wordmark`(170)、`.avatar-trigger` 背景(index.css:293)、`.add-page-btn-secondary--green` 等 |
| `--color-bg` | 全站 button hover 文字色、`.app-header` 系列背景、`.login-page` 背景 |
| `--color-ink`/`--color-text` | `body` 文字色、`.add-book-btn` 背景、多處次要文字 |
| `--color-hairline` | 分隔線、input 邊框、`.avatar-dropdown-divider`、`.login-divider-line` |
| `--color-surface` | input/textarea/select 背景、`.avatar-dropdown` 背景 |
| `--ink-rgb`/`--teal-rgb`/`--paper-rgb` | 全站陰影、`.btn-frosted` 系列毛玻璃、hover 光暈 |
| `--color-tour-bg`/`--color-ink-soft` | 僅 `.splash-overlay`(index.css:2062)、`.splash-word`(2098 附近)、`.marginalia-tour` 系列(1957-1996) |

### 硬編碼的顏色值(檔案:行號:色碼)

| 位置 | 色碼 | 說明 |
|---|---|---|
| `src/index.css:217` | `#fff` | `.login-google-icon { background: #fff; }`——Google 品牌規範要求 G 圖標必須置於白底,這是硬性規範不是可調整的設計選擇 |
| `src/index.css:923` | `#000` | `.note-timeline-content.is-multiline` 的 `mask-image` 漸層起訖色 |
| `src/index.css:924` | `#000` | 同上,`-webkit-mask-image` 版本 |

以下三處是**註解裡提到色碼**,不是實際 CSS 宣告,不算硬編碼:
- `src/index.css:140`(我自己這次寫的登入頁註解,說明 `--color-green` 實際值跟規格文字給的 `#3C786D` 不同)
- `src/index.css:387`(註解說明 `#f4ebd9`/`#6b5410` 是已移除的舊值)
- `src/index.css:2047-2048`(註解說明 `--color-tour-bg`/`--color-ink-soft` 對應原型的 `#FDFCFA`/`#3E4A3D`,實際宣告用的是 token,見上方 7-1 開頭清單)

全專案 `grep` 找不到任何 `rgb()`/`rgba()` 使用原始數字而非 `var(--xxx-rgb)` 的情況——陰影/毛玻璃全部透過 token 的 rgb 分量组出。

### 補充(2026-07-27):`BirdDoodle.jsx` 的硬編碼色碼,均已存在對應 token

App 圖示設計曾假設鳥的粉紅、喙的橘紅是「系統外例外色」,需要另外寫進 token 規範。
從原始碼(`src/components/BirdDoodle.jsx:19-26`)取得精確色碼後確認**這個假設不成立**:

| 位置 | 色碼(原始碼字面值) | 對應既有 token |
|---|---|---|
| `BirdDoodle.jsx:20`(鳥身,`fill`) | `#E9A0B6` | `--pink`(tokens.css:20) |
| `BirdDoodle.jsx:22`(鳥喙,`fill`) | `#D8502C` | `--red`(tokens.css:15) |
| `BirdDoodle.jsx:23,24`(眼睛/描邊,`fill`/`stroke`) | `#26332E` | `--ink`(tokens.css:14) |

三個色碼跟三個既有 token 逐位元組相同,不是「系統外」的新顏色,是 `BirdDoodle.jsx` 直接寫死 hex 字面值、沒有引用 `var(--pink)`/`var(--red)`/`var(--ink)`——跟本節上方 `.login-google-icon`/`.note-timeline-content` 是同一種「硬編碼而非引用 token」模式,不是需要新增例外的情況。**沒有修改 `BirdDoodle.jsx`**,這裡只記錄色碼比對結果。

### 同一用途出現多個不同色值的情況

- **「品牌綠」**:`--color-green`(`#1e7a6d`,用在按鈕/標題等大多數地方)跟 `--color-ink-soft`(`#3e4a3d`,只用在 splash 動畫文字跟導覽 popover 文字)是兩個不同的綠,都可以被稱為「品牌綠」但數值不同,使用範圍不重疊。
- **「米色背景」**:`--cream`(`#f6f1e6`,全站殼層/登入頁背景)跟 `--color-tour-bg`(`#fdfcfa`,只用在 splash 遮罩跟導覽 popover 背景)是兩個不同的米色,都可能被稱為「頁面背景」但數值不同。
- **本批次(登入體驗批次)規格文字給的色碼**(`#F5F1E7` 頁面背景、`#3C786D` 品牌綠)在專案裡都沒有對應的既有變數是這兩個精確值——這件事已在前一份報告(遷移前現況盤點外的另一份對話回報)記錄過,這裡只是重複列出以求 7-5 完整。

---

## 7-2 字體

### font-family 變數與實際值

來源:`src/styles/tokens.css:37-39`
```css
--font-serif: 'Fraunces', 'Noto Serif TC', serif;
--font-sans: 'Archivo', -apple-system, 'PingFang TC', 'Noto Sans TC', sans-serif;
--font-hand: 'Gloria Hallelujah', cursive;
```

`src/index.css` 裡有 3 處**不透過變數**、直接寫死 `'Noto Serif TC', serif`(不含 Fraunces fallback):
- `index.css:173`(`.login-subtitle`,本批次新增)
- `index.css:199`(`.login-google-btn`,本批次新增)
- `index.css:599`(`.book-page-title`,既有程式碼,註解寫明「刻意跳過 Fraunces」)

`index.css:1449` 有一處 `font-family: inherit`(繼承父層,不是獨立宣告)。

### 各層級字級/字重/letter-spacing/line-height 實際值

字級(來源:`grep -n "font-size:" index.css`,共 65 處):沒有任何字級 token/變數,每個 class 各自寫字面值,單位混用 `px`/`rem`/`clamp()`。數值範圍從 `11px` 到 `clamp(50px, 15.5vw, 68px)` 都有,不重複列出全部 65 筆(見檔案本身),僅舉幾個跨頁共用的:

| Class | font-size |
|---|---|
| 全站 `button` 基礎 | `0.92rem`(index.css:45) |
| `.login-wordmark` | `46px`(166) |
| `.brand-title` | `clamp(50px, 15.5vw, 68px)`(991) |
| `.splash-word` | `clamp(48px, 15vw, 88px)`(2092) |

字重(來源:`grep -n "font-weight:" index.css`,共 30 處):同樣沒有 token,字面值涵蓋 `300/400/500/600/700` 五種,無語意命名。

letter-spacing(來源:`grep -n "letter-spacing:" index.css`,共 13 處):字面值,常見的是 `0.02em`(按鈕文字)、`0.22em`(大寫追蹤字距,如 `.app-subtitle`/`.add-book-btn.btn-frosted`)、`-0.045em`(`.brand-title`/`.brand-title-over`/`.splash-word`,Fraunces 大字級專用負值)。`index.css:176` 是本批次新增的 `letter-spacing: normal`(`.login-subtitle`,明確蓋掉繼承值)。

line-height(來源:`grep -n "line-height:" index.css`,共 13 處):字面值,`1`(圖示/單行文字)、`1.1`(大標題)、`1.6`/`1.75`(內文段落)最常見。

### font-variation-settings(Fraunces opsz 軸)使用位置

來源:`grep -n "font-variation-settings:" index.css`

| 位置 | opsz 值 | 對應元素 |
|---|---|---|
| index.css:164 | `144` | `.login-wordmark`(本批次新增) |
| index.css:257 | `24` | `.login-guest-btn`(本批次新增) |
| index.css:985 | `40` | `.brand-title-over` |
| index.css:997 | `40` | `.brand-title` |
| index.css:2097 | `40` | `.splash-word` |

每處都搭配 `font-optical-sizing: none`(index.css:163,256,984,996,2096)一起出現。

---

## 7-3 間距與圓角

### 有變數的

只有一個跟「內容左邊界」相關的間距變數:`--content-left: 20px`(tokens.css:82),用在 `index.css:542,553,594,676,829,939,966,1161,1207` 共 9 處 `padding`/`left`。

Safe-area 相關:`--safe-top`/`--safe-bottom`(tokens.css:83-84),用在 `index.css:541,553,676,1292,1602,1826` 共 6 處。本批次新增的 `.avatar-dropdown`(index.css:328)直接用 `env(safe-area-inset-right)`,**沒有**透過變數(因為 tokens.css 沒有 `--safe-right` 可用)。

**沒有其他間距/圓角變數**——找不到任何 `--radius-*`、`--space-*`、`--gap-*` 這類命名的 token。

### 沒變數的(硬編碼位置)

border-radius(來源:`grep -n "border-radius:" index.css`,共 38 處):全部是字面值,常見值:
- `999px`(pill 形狀):index.css:40,1098,1118,1154,1301,1329,1393,1611,1715,1774,1802,2011 等 13 處
- `50%`(正圓形):index.css:216,289,1378,1570,1650,1676 等 7 處,包含 `.avatar-trigger`(289)、`.login-google-icon`(216)、`.btn-frosted--circle`(1378)——三處各自獨立宣告 `50%`,沒有共用
- 其餘 `4px/6px/8px/10px/12px/14px/18px/20px` 分散在各卡片/modal 圓角,及兩處複合值 `4px 8px 8px 4px`(1250)、`20px 20px 0 0`(1825)

padding/margin/gap:數量龐大(index.css 全檔超過 150 處宣告 padding/margin/gap),絕大多數是字面 px 值,只有前述 `--content-left`/`--safe-top`/`--safe-bottom` 這幾處走變數,其餘沒有例外整理逐條列出(檔案本身可查)。

---

## 7-4 按鈕階層

### 目前實際存在的按鈕 class 清單

來源:`grep` 全 `index.css` 的按鈕相關 selector,對照 `grep -rl` 各 `.jsx` 檔案的實際使用:

| Class | 定義位置 | 使用頁面/元件 | 共用或單頁 |
|---|---|---|---|
| `button`(全站基礎) | index.css:37-63 | 全站(未加任何 class 的 `<button>` 都吃這份) | 共用 |
| `.icon-btn` | index.css:65-78 | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.pill-btn` | index.css:1113-1123 | Bookshelf(搜尋/篩選/頭像旁的量測基準) | 單頁 |
| `.btn-frosted` | index.css:1348-1369 | AddBookModal、EditBookModal、NoteModal、BookDetail、Bookshelf、NoteDetail | 共用(6 個檔案) |
| `.btn-frosted--circle` | index.css:1374-1384 | BookDetail、NoteDetail(返回鍵浮動變體) | 共用(2 頁) |
| `.btn-frosted--glass` | index.css(701 附近) | NoteDetail | 單頁 |
| `.btn-frosted--sm` | index.css:1386-1394 | NoteDetail(Edit annotation) | 單頁 |
| `.add-book-btn` | index.css:1289-1323 | BookDetail、Bookshelf(共用結構,New Note/Add Book 共用) | 共用(2 頁) |
| `.add-page-btn` | index.css:1773-1780 | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.add-page-btn-secondary--green` | index.css(1786 附近) | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.filter-pill` | index.css:1101 附近 | Bookshelf | 單頁 |
| `.action-sheet-option`/`.action-sheet-suboption`/`.action-sheet-cancel` | index.css:1855,1897,1917 附近 | Bookshelf(篩選面板) | 單頁 |
| `.note-detail-edit-btn` | index.css:806-819 | NoteDetail | 單頁 |
| `.book-page-edit-btn` | index.css:639-646 | BookDetail | 單頁 |
| `.note-timeline-card` | index.css:881 附近 | NoteList | 單頁(元件) |
| `.annotator-*`(cancel/done/clear/undo/swatch) | index.css:1618-1722 附近 | ImageAnnotator | 單頁(元件) |
| `.note-image-annotate-link`/`.note-image-remove-sm` | index.css:1552-1578 附近 | NoteModal | 單頁 |
| `.add-modal-file-btn` | index.css:1747 附近 | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.login-google-btn` | index.css:188-208 | Login(本批次新增) | 單頁 |
| `.login-guest-btn` | index.css:251-266 | Login(本批次新增) | 單頁 |
| `.guest-signin-btn` | index.css:370-382 | Bookshelf(本批次新增) | 單頁 |
| `.avatar-dropdown-logout` | index.css:350-362 | AvatarMenu(本批次新增) | 單頁(元件) |
| `.avatar-trigger` | index.css:286-303 附近 | AvatarMenu(本批次新增,嚴格說是按鈕但語意是身分識別,見 ARCHITECTURE.md 5-3 裁示) | 單頁(元件) |

### 每個 class 的樣式

已在上表標明位置,逐一貼樣式內容會讓報告過長,樣式細節請直接看對應行號——這節重點是「有哪些 class、誰在用、共用還是單頁」,不重複貼 CSS 本體。

### 標明哪些是共用、哪些只有單一頁面在用

見上表最後一欄。**共用最廣的是 `.btn-frosted`**(6 個檔案)。本批次新增的按鈕(`.login-google-btn`/`.login-guest-btn`/`.guest-signin-btn`/`.avatar-dropdown-logout`/`.avatar-trigger`)全部都是單頁/單元件專用,沒有跟既有共用 class 重疊。

---

## 7-5 不一致清單

> ## ⚠️ 第 1 條的 `.pill-btn` 歸類已更正(2026-07-24)
>
> **第 1 條原文把 `.pill-btn` 跟 `.avatar-trigger`、`.btn-frosted--circle` 並列為
> 「三處各自寫死 `36px`」,這個歸類不正確。**
>
> `.pill-btn` 沒有 `width`/`height` 宣告,更沒有寫死 `36px`。它是靠
> `padding: 7px 18px` 撐開的橢圓形膠囊,實測渲染 58×36——高度剛好是
> 36 是 padding 加總的**結果**,不是宣告值,跟另外兩處「明確寫
> `width: 36px; height: 36px`」是完全不同性質的事。
>
> UI Token 統一化批次(2026-07-24)已將 `.avatar-trigger`、
> `.btn-frosted--circle` 連同另外發現的 `.annotator-clear`/`.annotator-undo`
> 收成共用變數 `--size-circle-btn: 36px`;`.pill-btn` **明確排除**於此變數
> 之外——若比照套用會把它從橢圓硬改成正圓,是形狀改變,不是變數收斂。
> `.pill-btn` 的尺寸處置留待下一批次當設計決策處理。
>
> **原文以下保留,不刪除,僅標記歸類錯誤。**

1. **圓形 icon 按鈕直徑,三處各自獨立宣告 `36px`,沒有共用 token**:`.avatar-trigger`(index.css:287-288,`width/height: 36px` 作為量測失敗時的 fallback 值)與 `.btn-frosted--circle`(index.css:1375-1376,`width/height: 36px`)兩者字面值相同但各自寫死;`.pill-btn`(index.css:1113-1123)則完全沒有固定 width/height,靠 `padding: 7px 18px` 撐開,實測渲染出來是 58×36(見下方第 2 點),高度剛好也是 36,但這是 padding 加總的結果,不是宣告值。三者「看起來對齊」純屬巧合疊加,不是共用同一個尺寸來源。

2. **「品牌綠」有兩種寫法**:`--color-green`(`#1e7a6d`,tokens.css:43,用在 `.brand-title`/`.brand-title-over`/`.login-wordmark`/全站按鈕等大多數地方)與 `--color-ink-soft`(`#3e4a3d`,tokens.css:66,只用在 `.splash-word`/`.marginalia-tour` 系列),兩者差異為:數值不同(前者偏亮綠、後者偏暗墨綠),使用範圍不重疊(前者是全站通用,後者只給 splash 開場動畫跟首次導覽 popover)。

3. **「頁面/遮罩背景米色」有兩種寫法**:`--cream`(`#f6f1e6`,tokens.css:11,全站殼層背景、登入頁背景)與 `--color-tour-bg`(`#fdfcfa`,tokens.css:62,只用在 splash 遮罩跟導覽 popover 背景),兩者差異為:數值不同(後者略白略亮),使用範圍不重疊。

4. **「Noto Serif TC 字體」的宣告方式有兩種寫法**:一種是透過 `var(--font-serif)`(值是 `'Fraunces', 'Noto Serif TC', serif`,Fraunces 優先,中文才 fallback 到 Noto Serif TC),用在絕大多數標題類元素;另一種是直接寫死 `'Noto Serif TC', serif`(不含 Fraunces),分別在 `.login-subtitle`(index.css:173)、`.login-google-btn`(index.css:199)、`.book-page-title`(index.css:599)三處,差異為:後者略過 Fraunces、強制全部文字(含英數)都用 Noto Serif TC 渲染,前者則是英數優先用 Fraunces、只有中文字才落到 Noto Serif TC。

5. **Safe-area 變數只覆蓋上下,沒有左右**:`--safe-top`/`--safe-bottom` 是既有 token(tokens.css:83-84),但沒有 `--safe-left`/`--safe-right`。本批次新增的 `.avatar-dropdown`(index.css:328)需要處理右側安全區時,只能直接寫 `env(safe-area-inset-right)`,跟其餘 6 處走 `--safe-top`/`--safe-bottom` 變數的寫法不是同一種模式,差異為:前者(既有 6 處)透過 tokens.css 的變數間接引用,後者(本批次新增這 1 處)直接呼叫 CSS 環境函式,沒有變數包一層。

6. **登入體驗批次規格文字給的色碼,跟專案現行 token 都對不上**(已在前一份報告記錄,這裡重複列出湊齊 7-5):規格文字給的「頁面背景 `#F5F1E7`」不等於現行 `--cream`(`#f6f1e6`);規格文字給的「品牌綠 `#3C786D`」不等於現行 `--color-green`(`#1e7a6d`),也不等於 `--color-ink-soft`(`#3e4a3d`)。三者兩兩都不同值,差異純粹是數值不同,不是同一色的不同寫法。
