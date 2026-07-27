# Marginalia · 全域 UI 現況盤點(2026-07-23)

> 只讀盤點,不做任何修改、不做設計裁決。發現的不一致只記錄在 7-5,不挑代表值、不建議採用哪一個。
> 來源一律是現行程式碼(`src/styles/tokens.css`、`src/index.css`),不是舊文件。
>
> **定位補記(2026-07-27):** 本檔原為 07-23 當日的純快照。自 07-27 起,7-1~7-5 的盤點本文中已有少數處反映了 07-24 之後的實作改動(例如 7-1 對照表已記入 `.splash-word` 改綠),因此本檔已非嚴格的單日快照,而是「盤點本文 + 已知改動標註」。所有**設計裁決**一律收在新增的 **7-6 裁決紀錄**,不寫入 7-1~7-5 本文;裁決的增補與推翻只動 7-6。盤點本文僅在事實過期時做最小更正。

---

## 7-1 色彩

### CSS 變數完整清單

來源:`src/styles/tokens.css:9-85`(07-23 稽核當時的全檔範圍;07-24 之後陸續有新增,現況見下方表格與 2026-07-27 註記,檔案本身已到 94 行)

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
| ~~`--color-tour-bg`~~ | ~~`#fdfcfa`~~ | **已移除(2026-07-27)**,原 tokens.css:62,併入 `--cream`,見 UI Token 統一化批次 |
| `--color-ink-accent` | `#3e4a3d` | tokens.css:67 **(2026-07-27 由 `--color-ink-soft` 更名,值不變,commit `cad1599`)** |
| `--ink-rgb` | `38, 51, 46` | tokens.css:72 |
| `--teal-rgb` | `30, 122, 109` | tokens.css:73 |
| `--paper-rgb` | `251, 248, 240` | tokens.css:74 |
| `--shadow-cover` | `0 6px 16px rgba(var(--ink-rgb), 0.14), 0 1px 3px rgba(var(--ink-rgb), 0.1)` | tokens.css:77 |
| `--shadow-float` | `0 10px 26px rgba(var(--ink-rgb), 0.28)` | tokens.css:78 |
| `--shadow-card-hover` | `0 16px 36px rgba(var(--ink-rgb), 0.14), 0 4px 10px rgba(var(--ink-rgb), 0.07)` | tokens.css:80 |
| `--content-left` | `20px` | tokens.css:83 |
| `--safe-top` | `env(safe-area-inset-top)` | tokens.css:84 |
| `--safe-bottom` | `env(safe-area-inset-bottom)` | tokens.css:85 |
| `--safe-right` | `env(safe-area-inset-right)` | **新增(2026-07-24)**,tokens.css:86,UI Token 統一化批次補上,當時只宣告未套用到任何元素 |
| `--size-circle-btn` | `36px` | **新增(2026-07-24)**,tokens.css:93,UI Token 統一化批次,見 7-5 第 1 條與 7-6 Ruling 2 |

另外 `src/index.css:3-11` 的 `:root` 區塊加了三個殼層專用別名:`--color-shell-bg: var(--cream)`、`--color-text: var(--color-ink)`、`--color-text-muted: var(--color-text-secondary)`。

~~**沒有 `--safe-left`/`--safe-right` token**——只有 top/bottom 兩個方向有變數。~~ **事實更正(2026-07-27):** `--safe-right` 已在 UI Token 統一化批次(2026-07-24)補上(tokens.css:86),當時只宣告未套用到任何元素。現況是**仍然沒有 `--safe-left`**,但 `--safe-right` 已存在。

### 每個變數的實際使用位置

逐一列出 40 個變數在 40+ 個元件裡的用法會過於冗長,以下列出**使用頻率高、跨頁面共用**的幾個,其餘變數多半只在 1-2 個 class 裡出現一次:

| 變數 | 主要使用位置(不窮舉) |
|---|---|
| `--color-green` | 全站 `button` 基礎樣式(index.css:41,43)、`.pill-btn`(1135)、`.brand-title-over`(988)、`.brand-title`(1000)、`.login-wordmark`(168)、`.avatar-trigger` 背景(300)、`.add-page-btn-secondary--green` 等(**2026-07-27 行號核對**:原表的 `873` 對應不到 brand-title 系列,已更正) |
| `--color-bg` | 全站 button hover 文字色、`.app-header` 系列背景、`.login-page` 背景 |
| `--color-ink`/`--color-text` | `body` 文字色、`.add-book-btn` 背景、多處次要文字 |
| `--color-hairline` | 分隔線、input 邊框、`.avatar-dropdown-divider`、`.login-divider-line` |
| `--color-surface` | input/textarea/select 背景、`.avatar-dropdown` 背景 |
| `--ink-rgb`/`--teal-rgb`/`--paper-rgb` | 全站陰影、`.btn-frosted` 系列毛玻璃、hover 光暈 |
| ~~`--color-tour-bg`~~/`--color-ink-soft`→`--color-ink-accent` | 07-23 稽核當時:僅 `.splash-overlay`、`.splash-word`、`.marginalia-tour` 系列。**事實更正(2026-07-27):** `--color-tour-bg` 已移除,`.splash-overlay` 背景改用 `--cream`;`.splash-word` 也已改用 `--color-green`(見 7-6 Ruling 1)。此列的 `--color-ink-soft` 已於 07-27 更名為 `--color-ink-accent`(值不變,見 7-6 Ruling 4),現況只剩 `.splash-caret`、`.splash-book-line`、`.marginalia-tour` 系列三處,詳見下方 07-27 補充的對照表。 |

### 硬編碼的顏色值(檔案:行號:色碼)

| 位置 | 色碼 | 說明 |
|---|---|---|
| `src/index.css:221`(2026-07-27 核對,原文誤植 217) | `#fff` | `.login-google-icon { background: #fff; }`——Google 品牌規範要求 G 圖標必須置於白底,這是硬性規範不是可調整的設計選擇 |
| `src/index.css:930`(2026-07-27 核對,原文誤植 923) | `#000` | `.note-timeline-content.is-multiline` 的 `mask-image` 漸層起訖色 |
| `src/index.css:931`(2026-07-27 核對,原文誤植 924) | `#000` | 同上,`-webkit-mask-image` 版本 |

以下三處是**註解裡提到色碼**,不是實際 CSS 宣告,不算硬編碼:
- `src/index.css:140`(我自己這次寫的登入頁註解,說明 `--color-green` 實際值跟規格文字給的 `#3C786D` 不同)
- `src/index.css:391`(2026-07-27 核對,原文誤植 387;註解說明 `#f4ebd9`/`#6b5410` 是已移除的舊值)
- `src/index.css:2047-2048`(07-23 稽核當時的內容:註解說明 `--color-tour-bg`/`--color-ink-soft` 對應原型的 `#FDFCFA`/`#3E4A3D`。**事實更正(2026-07-27):** 這段註解本身已在 UI Token 統一化批次改寫,現在只剩 `#3E4A3D` 一處提及,`#FDFCFA` 的字面提及已經連同 `--color-tour-bg` 一起從註解裡拿掉,原內容見 `src/index.css:2064` 附近)

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

### 補充(2026-07-27):`--color-green` / `--color-ink-accent` 現況對照表

盤點兩顆綠在全專案的實際用法,供「新元件照最接近的類比走」查表用(不是新訂門檻值,是把現況如實列出):

**`--color-green`(`#1e7a6d`)**:

| 類別 | 元件 |
|---|---|
| 互動元件(按鈕/連結,含所有 hover/active/focus 態) | 全站 `button` 基礎樣式、`.pill-btn`、`.filter-pill`、`.avatar-dropdown-logout`、`.guest-signin-btn`、`.note-detail-edit-btn`、`.add-modal-file-btn`、`.add-page-btn-secondary--green`、`.action-sheet-cancel`、`.marginalia-tour .tour-skip-btn`、input/select/textarea 的 focus 邊框 |
| 品牌大字(首頁橫幅、登入頁、開場動畫) | `.brand-title`、`.brand-title-over`(首頁「Marginalia / Books」)、`.login-wordmark`(登入頁)、`.splash-word`(開場動畫,2026-07-27 品牌綠統一批次改過來的,原本是 `--color-ink-soft`) |
| 裝飾插畫填色 | `.shelf-plank-top`(書架層板頂面) |
| Modal 內部標題文字 | `.add-modal-section-title`、`.add-modal-title` |

**`--color-ink-accent`(`#3e4a3d`,2026-07-27 前名為 `--color-ink-soft`)**:只出現在兩個語境,沒有例外:

| 類別 | 元件 |
|---|---|
| 首次導覽 popover(driver.js) | `.driver-popover.marginalia-tour` 背景/文字、`.driver-popover-title`、`.driver-popover-description` |
| 開場動畫(Splash)手繪線條/游標 | `.splash-caret`(游標)、`.splash-book-line`(手繪墨線)——注意 `.splash-word` 本身已改用 `--color-green`,同一個開場動畫裡文字跟線條現在是兩種不同的綠 |

**可歸納的規則**(從現況反推,不是訂門檻值):`--color-ink-accent` 目前的適用範圍精準對應「splash 開場動畫的手繪線條/游標」跟「首次導覽 popover」這兩個特定語境,除此之外(所有一般互動元件、品牌大字、裝飾填色)一律是 `--color-green`。

### 同一用途出現多個不同色值的情況

- **「品牌綠」**:`--color-green`(`#1e7a6d`,用在按鈕/標題等大多數地方)跟 `--color-ink-accent`(`#3e4a3d`,前名 `--color-ink-soft`,只用在 splash 動畫線條/游標跟導覽 popover 文字)是兩個不同的綠,都可以被稱為「品牌綠」但數值不同,使用範圍不重疊。
- ~~**「米色背景」**:`--cream`(`#f6f1e6`,全站殼層/登入頁背景)跟 `--color-tour-bg`(`#fdfcfa`,只用在 splash 遮罩跟導覽 popover 背景)是兩個不同的米色,都可能被稱為「頁面背景」但數值不同。~~ **(2026-07-27 事實更正:此不一致已消失。`--color-tour-bg` 已移除併入 `--cream`,現況全站只有一種「頁面背景米色」,不再有兩種寫法並存。)**
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

**事實更正(2026-07-27):** 原本這裡記錄的「3 處不透過變數、直接寫死 `'Noto Serif TC', serif`」已經過時。`.login-subtitle`(index.css:173,未偏移)、`.login-google-btn`(index.css:203,2026-07-27 核對原文誤植 199)、`.book-page-title`(index.css:606,2026-07-27 核對原文誤植 599)三處後續都已裁定改成 `var(--font-serif)`(接受拉丁字元落到 Fraunces、中文字落到 Noto Serif TC 這個結果,不再要求中英文字重視覺一致)。`.book-page-title` 原本「刻意跳過 Fraunces」那條註解也已經被推翻改寫,不是現況了。全專案 grep `'Noto Serif TC'` 現在只剩 `tokens.css:37` 的 `--font-serif` 定義本身一處,沒有任何獨立寫死的宣告。

`index.css:1463`(2026-07-27 核對,原文誤植 1449)有一處 `font-family: inherit`(繼承父層,不是獨立宣告)。

### 各層級字級/字重/letter-spacing/line-height 實際值

字級(來源:`grep -n "font-size:" index.css`,共 66 處,**2026-07-27 重新計數確認**;原文寫 65 為 07-23 舊計數,已過時):沒有任何字級 token/變數,每個 class 各自寫字面值,單位混用 `px`/`rem`/`clamp()`。數值範圍從 `11px` 到 `clamp(50px, 15.5vw, 68px)` 都有,不重複列出全部 66 筆(見檔案本身),僅舉幾個跨頁共用的:

| Class | font-size |
|---|---|
| 全站 `button` 基礎 | `0.92rem`(index.css:45) |
| `.login-wordmark` | `46px`(166,未偏移) |
| `.brand-title` | `clamp(50px, 15.5vw, 68px)`(998,2026-07-27 核對,原文誤植 991) |
| `.splash-word` | `clamp(48px, 15vw, 88px)`(2113,2026-07-27 核對,原文誤植 2092) |

字重(來源:`grep -n "font-weight:" index.css`,共 30 處):同樣沒有 token,字面值涵蓋 `300/400/500/600/700` 五種,無語意命名。

letter-spacing(來源:`grep -n "letter-spacing:" index.css`,共 13 處):字面值,常見的是 `0.02em`(按鈕文字)、`0.22em`(大寫追蹤字距,如 `.app-subtitle`/`.add-book-btn.btn-frosted`)、`-0.045em`(`.brand-title`/`.brand-title-over`/`.splash-word`,Fraunces 大字級專用負值)。`index.css:176` 是本批次新增的 `letter-spacing: normal`(`.login-subtitle`,明確蓋掉繼承值)。

line-height(來源:`grep -n "line-height:" index.css`,共 13 處):字面值,`1`(圖示/單行文字)、`1.1`(大標題)、`1.6`/`1.75`(內文段落)最常見。

### font-variation-settings(Fraunces opsz 軸)使用位置

來源:`grep -n "font-variation-settings:" index.css`

| 位置 | opsz 值 | 對應元素 |
|---|---|---|
| index.css:164 | `144` | `.login-wordmark`(未偏移) |
| index.css:261 | `24` | `.login-guest-btn`(2026-07-27 核對,原文誤植 257) |
| index.css:992 | `40` | `.brand-title-over`(2026-07-27 核對,原文誤植 985) |
| index.css:1004 | `40` | `.brand-title`(2026-07-27 核對,原文誤植 997) |
| index.css:2118 | `40` | `.splash-word`(2026-07-27 核對,原文誤植 2097) |

每處都搭配 `font-optical-sizing: none`(index.css:163,260,991,1003,2117——2026-07-27 核對,原文為 163,256,984,996,2096)一起出現。

---

## 7-3 間距與圓角

### 有變數的

只有一個跟「內容左邊界」相關的間距變數:`--content-left: 20px`(tokens.css:83),用在 `index.css:546,557,601,683,836,946,973,1175,1221` 共 9 處 `padding`/`left`(2026-07-27 核對,原文行號 542,553,594,676,829,939,966,1161,1207 已偏移)。

Safe-area 相關:`--safe-top`/`--safe-bottom`(tokens.css:84-85),用在 `index.css:545,557,683,1306,1616,1840` 共 6 處(2026-07-27 核對,原文行號 541,553,676,1292,1602,1826 已偏移)。`.avatar-dropdown`(index.css:332)直接用 `env(safe-area-inset-right)`,**沒有**透過變數。**事實更正(2026-07-27):** 當時沒有 `--safe-right` 可用這件事已經不成立——`--safe-right` 已在 UI Token 統一化批次補上(tokens.css:86),但 `.avatar-dropdown` 這處寫法本身**沒有跟著改**,現況是「token 存在、但這個既有消費者還沒採用」,不是「token 不存在」。

**沒有其他間距/圓角變數**——找不到任何 `--radius-*`、`--space-*`、`--gap-*` 這類命名的 token。**事實更正(2026-07-27):** 圓角部分已改變——border-radius 已於 07-27 收斂成 5 個 token(`--radius-sm/md/lg/pill/full`,tokens.css:99-103),見 7-6 Ruling 5。間距(`--space-*`/`--gap-*`)仍無 token,維持原狀。

### 沒變數的(硬編碼位置)

border-radius(來源:`grep -n "border-radius:" index.css`):**以下為 07-23 稽核當時的字面值現況;07-27 已全面 token 化,見文末事實更正與 7-6 Ruling 5。** 常見值(**2026-07-27 全面核對**,原文行號多數已偏移):
- `999px`(pill 形狀):index.css:40,1105,1132,1168,1315,1343,1407,1625,1729,1788,1816,2027 共 12 處
- `50%`(正圓形):index.css:220,293,1392,1584,1664,1690 共 6 處,包含 `.avatar-trigger`(293)、`.login-google-icon`(220)、`.btn-frosted--circle`(1392)——三處各自獨立宣告 `50%`,沒有共用
- 其餘 `4px/6px/8px/10px/12px/14px/18px/20px` 分散在各卡片/modal 圓角,及兩處複合值 `4px 8px 8px 4px`(1264)、`20px 20px 0 0`(1839)
- **2026-07-27 重新計數確認:實際共 39 處**(`grep -cE "^\s*border-radius:" index.css` = 39);原文統計「共 38 處」為 07-23 舊計數,已過時。位置與總數量皆已於 07-27 核對更正
- **⚠️ 現況已改變(2026-07-27,Ruling 5):** 上述 39 處字面值中,35 處已收斂為 5 個 token 引用(`--radius-sm:6px`×6、`--radius-md:10px`×8、`--radius-lg:18px`×3、`--radius-pill:999px`×12、`--radius-full:50%`×6),其中 11 處數值有微調(收斂到最近的階梯);其餘 4 處為刻意保留的特例造型(`.login-google-btn` 26px、`.wrap-shelf-book-cover` 不對稱、`.action-sheet` 20px 20px 0 0、`.action-sheet-option` 0),維持字面值。完整變更藍圖與逐處對照見 7-6 Ruling 5

padding/margin/gap:數量龐大(index.css 全檔超過 150 處宣告 padding/margin/gap),絕大多數是字面 px 值,只有前述 `--content-left`/`--safe-top`/`--safe-bottom` 這幾處走變數,其餘沒有例外整理逐條列出(檔案本身可查)。

---

## 7-4 按鈕階層

### 目前實際存在的按鈕 class 清單

來源:`grep` 全 `index.css` 的按鈕相關 selector,對照 `grep -rl` 各 `.jsx` 檔案的實際使用:

> **行號已於 2026-07-27 全面重新核對**(原表為 07-23 稽核時的行號,後續多個批次陸續在 `index.css` 中間插入程式碼,原行號大多已偏移,偏移量因插入點位置不同而不一致,非等比例平移)。下表為重新核對後的現況行號,範圍一律指類別本身的宣告區塊(不含 `:hover`/`:active` 等偽類狀態,除非另外註明)。

| Class | 定義位置(2026-07-27 核對) | 使用頁面/元件 | 共用或單頁 |
|---|---|---|---|
| `button`(全站基礎) | index.css:37-63(含 hover/active/disabled,未偏移) | 全站(未加任何 class 的 `<button>` 都吃這份) | 共用 |
| `.icon-btn` | index.css:65-78(含 hover,未偏移) | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.pill-btn` | index.css:1127-1137 | Bookshelf(搜尋/篩選/頭像旁的量測基準) | 單頁 |
| `.btn-frosted` | index.css:1362-1373 | AddBookModal、EditBookModal、NoteModal、BookDetail、Bookshelf、NoteDetail | 共用(6 個檔案) |
| `.btn-frosted--circle` | index.css:1388-1398 | BookDetail、NoteDetail(返回鍵浮動變體) | 共用(2 頁) |
| `.btn-frosted--glass` | index.css:708 附近 | NoteDetail | 單頁 |
| `.btn-frosted--sm` | index.css:1400-1408 | NoteDetail(Edit annotation) | 單頁 |
| `.add-book-btn` | index.css:1303-1322(另加 hover 1324-1328、active 1330-1332、`.add-book-btn-icon` 1334-1337) | BookDetail、Bookshelf(共用結構,New Note/Add Book 共用) | 共用(2 頁) |
| `.add-page-btn` | index.css:1787-1794 | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.add-page-btn-secondary--green` | index.css:1800 附近 | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.filter-pill` | index.css:1100 附近 | Bookshelf | 單頁 |
| `.action-sheet-option`/`.action-sheet-suboption`/`.action-sheet-cancel` | index.css:1854,1892,1917 | Bookshelf(篩選面板) | 單頁 |
| `.note-detail-edit-btn` | index.css:813-823(另加 hover 825-829) | NoteDetail | 單頁 |
| `.book-page-edit-btn` | index.css:646-651 | BookDetail | 單頁 |
| `.note-timeline-card` | index.css:873 附近 | NoteList | 單頁(元件) |
| `.annotator-*`(cancel/done/clear/undo/swatch) | index.css:1621-1734 附近 | ImageAnnotator | 單頁(元件) |
| `.note-image-annotate-link` | index.css:1559-1569 附近 | NoteModal | 單頁 |
| `.note-image-remove-sm` | index.css:1577-1590 附近 | NoteModal | 單頁 |
| `.add-modal-file-btn` | index.css:1761 附近 | AddBookModal、EditBookModal、NoteModal | 共用(3 個 modal) |
| `.login-google-btn` | index.css:192-207(另加 hover 209 附近) | Login | 單頁 |
| `.login-guest-btn` | index.css:255-265 | Login | 單頁 |
| `.guest-signin-btn` | index.css:374-380(另加 hover 381 附近) | Bookshelf | 單頁 |
| `.avatar-dropdown-logout` | index.css:354-362 | AvatarMenu | 單頁(元件) |
| `.avatar-trigger` | index.css:290-302 | AvatarMenu(嚴格說是按鈕但語意是身分識別,見 ARCHITECTURE.md 5-3 裁示) | 單頁(元件) |

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
>
> **更新(2026-07-27):** `.pill-btn` 的尺寸處置**已裁決**,不再是「待下一批次的設計決策」。
> 結論為維持 padding 驅動、不綁任何固定尺寸 token。完整裁決見本檔 **7-6 · Ruling 2**。
>
> **原文以下保留,不刪除,僅標記歸類錯誤。**

1. **圓形 icon 按鈕直徑,三處各自獨立宣告 `36px`,沒有共用 token**(07-23 稽核當時的原始狀況,行號已於 2026-07-27 核對:原文 287-288/1375-1376/1113-1123 現況分別是 291-292/1389-1390/1127-1137):`.avatar-trigger` 與 `.btn-frosted--circle`(當時都是 `width/height: 36px`)字面值相同但各自寫死;`.pill-btn` 則完全沒有固定 width/height,靠 `padding: 7px 18px` 撐開,實測渲染出來是 58×36(見下方第 2 點),高度剛好也是 36,但這是 padding 加總的結果,不是宣告值。三者「看起來對齊」純屬巧合疊加,不是共用同一個尺寸來源。此條目前狀態見上方警示框與 7-6 Ruling 2——`.avatar-trigger`/`.btn-frosted--circle` 已改用 `var(--size-circle-btn)`,`.pill-btn` 裁定維持不變。

2. **「品牌綠」有兩種寫法**:`--color-green`(`#1e7a6d`,tokens.css:43,用在 `.brand-title`/`.brand-title-over`/`.login-wordmark`/全站按鈕等大多數地方)與 `--color-ink-accent`(`#3e4a3d`,tokens.css:67,2026-07-27 由 `--color-ink-soft` 更名、值不變,見 7-6 Ruling 4;原文行號誤植 66 亦一併更正),兩者差異為:數值不同(前者偏亮綠、後者偏暗墨綠),使用範圍不重疊。**事實更正(2026-07-27):** 原文舉例「只用在 `.splash-word`/`.marginalia-tour` 系列」已過時——`.splash-word` 已改用 `--color-green`(見 7-6 Ruling 1),此暗墨綠現況範圍是 `.splash-caret`/`.splash-book-line`/`.marginalia-tour` 系列,見上方 07-27 補充的完整對照表。這條「兩種寫法並存」的核心觀察本身沒有消失,只是其中一個舉例過時。

3. ~~**「頁面/遮罩背景米色」有兩種寫法**:`--cream`(`#f6f1e6`,tokens.css:11,全站殼層背景、登入頁背景)與 `--color-tour-bg`(`#fdfcfa`,tokens.css:62,只用在 splash 遮罩跟導覽 popover 背景),兩者差異為:數值不同(後者略白略亮),使用範圍不重疊。~~ **(2026-07-27 事實更正:此不一致已消失,見 7-6 · UI Token 統一化批次,`--color-tour-bg` 已移除併入 `--cream`。)**

4. ~~**「Noto Serif TC 字體」的宣告方式有兩種寫法**:一種是透過 `var(--font-serif)`(值是 `'Fraunces', 'Noto Serif TC', serif`,Fraunces 優先,中文才 fallback 到 Noto Serif TC),用在絕大多數標題類元素;另一種是直接寫死 `'Noto Serif TC', serif`(不含 Fraunces),分別在 `.login-subtitle`(index.css:173)、`.login-google-btn`(index.css:199)、`.book-page-title`(index.css:599)三處,差異為:後者略過 Fraunces、強制全部文字(含英數)都用 Noto Serif TC 渲染,前者則是英數優先用 Fraunces、只有中文字才落到 Noto Serif TC。~~ **(2026-07-27 事實更正:此不一致已消失。三處已全部裁定改成 `var(--font-serif)`,現況只剩單一寫法,不再有兩種寫法並存。詳見 7-2 節同日更正。)**

5. **Safe-area 的「變數引用」跟「直接呼叫 env()」兩種寫法並存**:`--safe-top`/`--safe-bottom`(tokens.css:84-85)這 6 處既有用法都透過變數間接引用;`.avatar-dropdown`(index.css:332)則直接寫 `env(safe-area-inset-right)`,沒有透過變數。**事實更正(2026-07-27):** 原文說「沒有 `--safe-left`/`--safe-right`」已經過時——`--safe-right` 已在 UI Token 統一化批次補上(tokens.css:86)。但這條不一致本身**沒有消失**:`--safe-right` 這個 token 現在存在了,`.avatar-dropdown` 卻沒有跟著改用它,所以「變數引用 vs 直接呼叫 env()」這兩種寫法並存的情況依然成立,只是原因從「當時沒有 token 可用」變成「token 已存在但既有程式碼沒有採用」。仍然沒有 `--safe-left`。

6. **登入體驗批次規格文字給的色碼,跟專案現行 token 都對不上**(已在前一份報告記錄,這裡重複列出湊齊 7-5):規格文字給的「頁面背景 `#F5F1E7`」不等於現行 `--cream`(`#f6f1e6`);規格文字給的「品牌綠 `#3C786D`」不等於現行 `--color-green`(`#1e7a6d`),也不等於 `--color-ink-accent`(`#3e4a3d`,前名 `--color-ink-soft`)。三者兩兩都不同值,差異純粹是數值不同,不是同一色的不同寫法。

---

## 7-6 裁決紀錄

> 本章節收設計/token 治理裁決,與 7-1~7-5 的現況盤點分離。盤點記錄「現況曾是什麼」,本章記錄「決定改成什麼、為什麼」。裁決的增補、覆蓋、作廢一律只動本章,不回頭改盤點本文(維持盤點作為時間快照的性質)。
>
> **⚠️ Token 更名對照(2026-07-27):** 下方各 Ruling 內文中出現的 `--color-ink-soft`,是記錄裁決當下的原貌,**刻意保留舊名不竄改**(治理原則:歷史敘述保留原貌)。該 token 已於 2026-07-27 的 rename 批次(commit `cad1599`)全站更名為 **`--color-ink-accent`**,值不變(`#3e4a3d`)。因此凡本章讀到 `--color-ink-soft`,現行程式碼中對應的即是 `--color-ink-accent`。改名批次的完整紀錄見 Ruling 4。

### Ruling 1 · 品牌字綠色統一(2026-07-27)

**裁決:** 品牌字「Marginalia」的大字呈現,一律使用 `--font-serif`(Fraunces)+ `--color-green`(`#1e7a6d`),不分出現位置。此規則收掉現況中唯一的例外——開場動畫 `.splash-word` 原用 `--color-ink-soft`,改齊到 `--color-green`。

**動到的元件(唯一一處):** `.splash-word` — color 由 `--color-ink-soft` → `--color-green`;font 統一為 `--font-serif`。

**明確不動:**
- `.splash-caret`、`.splash-book-line` 維持 `--color-ink-soft`(子決定:留 ink-soft)。
- `.brand-title`、`.brand-title-over`、`.login-wordmark` 本來就是目標規格,不動。

**對 `--color-ink-soft` 的意義(誠實記錄,非新訂門檻):** 改完後 ink-soft 的適用範圍收斂為一張明確白名單,不硬套語意標籤,就是三個元件——`.splash-caret`、`.splash-book-line`、`.driver-popover.marginalia-tour`(含 title/description)。規則寫成「預設 `--color-green`;`--color-ink-soft` 僅限此白名單」,比硬給它「手寫墨痕質感」的標籤更誠實(tour popover 其實不算墨痕質感,勉強套會失真)。

**連帶:** 品牌字規則從此無例外,可一句話寫死。ink-soft 少了 `.splash-word` 這個破例者,白名單更乾淨。

**實作狀態:** ✅ **已完成並驗收(2026-07-27)。** CC 已實作(batch `marginalia-brand-green-unify-batch-0727`),`.splash-word` 現況為 `color: var(--color-green)` + `font-family: var(--font-serif)`(已於 `index.css:2110` 附近核對原始碼確認)。iPhone Safari 實機驗收通過:開場動畫「Marginalia」字已與首頁橫幅同色(品牌綠),游標(`.splash-caret`)與手繪墨線(`.splash-book-line`)維持 `--color-ink-soft` 墨色不變。

---

### Ruling 2 · `.pill-btn` 維持 padding 驅動,不綁固定尺寸(2026-07-27)

**裁決:** `.pill-btn` 維持 padding 驅動,不綁任何固定尺寸 token;圓按鈕/膠囊「各自一版」的差異由「圓吃直徑 token、膠囊吃 padding」體現,不透過共用高度 token 耦合。等高需求(若有)屬個別版面責任,不入 token 規格。

**理由:** 圓與膠囊有時同排、有時不同排,「等高」不該是規格層級的鐵律;硬立全域高度規則會在不同排時製造無謂耦合,日後想單獨調膠囊還得繞過該規則。

**與先前修正案的關係:** 此裁決收掉先前 `.pill-btn` 修正案(見 7-5 第 1 條警示框)的完整結論——當初發現不能把 `--size-circle-btn` 套上 `.pill-btn`(會把橢圓硬改成正圓),完整結論是:不套,也不替它另立任何固定尺寸。

**實作狀態:** 純裁決,無實作項,不進 CC batch(明確不立規則,而非待辦)。

---

### Ruling 3 · 綠色門檻值 — 作廢(2026-07-27)

**裁決:** 原「綠色尺寸門檻」構想(從 Google 登入按鈕雙色並列推出「多大面積用 `--color-ink-soft`、多小用 `--color-green`」的門檻值)予以作廢,不再進行雙色並列校準。

**理由:** Ruling 1 已將 `--color-ink-soft` 的定義從「尺寸/語意門檻」改為明確白名單(見 Ruling 1)。白名單成立後,ink-soft 用在哪不再由面積決定,門檻規則的存在理由已被抽除。全站規則簡化為:**預設 `--color-green`;`--color-ink-soft` 僅限白名單。**

**連帶:** 先前作為門檻校準參考錨點的「全寬 Google 登入按鈕」不再承擔校準用途,回歸為一般 `--color-green` 元件。

**實作狀態:** 純裁決,無實作項,不進 CC batch。

---

### Ruling 4 · `--color-ink-soft` 更名為 `--color-ink-accent`(2026-07-27)

**裁決:** token `--color-ink-soft` 全站更名為 `--color-ink-accent`,值維持不變(`#3e4a3d`)。純改名,不重定色。

**新名由來:** Ruling 1 把此 token 的適用範圍收斂為固定白名單(`.splash-caret`、`.splash-book-line`、`.driver-popover.marginalia-tour` 系列)後,舊名 `ink-soft`(「較柔的墨色」)已不能反映它的真實角色。命名討論中曾考慮 `--color-ink-deco`(裝飾墨色),但因白名單裡的 tour popover 屬功能性 UI、不是裝飾,`deco` 會對其中一個使用點語意失真;最終取 `--color-ink-accent`(墨色點綴),此名同時容得下「splash 裝飾筆觸」與「tour 功能提示框」而不對任何一處說謊。

**實作範圍(commit `cad1599`,僅 `src/index.css`、`src/styles/tokens.css` 兩檔):**
- `tokens.css:67` 定義行:`--color-ink-soft: #3e4a3d;` → `--color-ink-accent: #3e4a3d;`(值零變化)。
- `index.css` 5 處實際宣告改名:`1976`/`1987`/`1993`(tour popover 的 color)、`2149`(`.splash-caret` background)、`2188`(`.splash-book-line` stroke)。
- `index.css` 3 處註解提及(`1966`、`2063`、`2108-2109`)裡的舊 token 名一併更新。

**一致性檢查:** 全專案(含 `.jsx`)grep 舊名 `color-ink-soft` 回傳 0 筆;grep 新名 `color-ink-accent` 回傳 11 筆(tokens.css 2 + index.css 9),與改名前舊名總數一致,無漏改、無錯字。

**實作狀態:** ✅ **已完成並驗收(2026-07-27)。** iPhone Safari 實機驗收通過:首次導覽 popover 與開場動畫游標/墨線顏色與改名前肉眼無差別(純改名的驗收標準即「畫面零變化」)。

**治理註記:** 本章 Ruling 1~3 內文保留舊名 `--color-ink-soft` 不改(記錄裁決當下原貌);7-6 開頭的更名對照說明負責把舊名指向現行的 `--color-ink-accent`。

---

### Ruling 5 · border-radius 收斂為 5 個 token(2026-07-27)

**裁決:** 全站 border-radius 收斂為 5 個 token,取代原本 39 處散落的字面值。定位為「規格統一 + 精簡」,接受不破壞造型的視覺微調(非純重構)。

- `--radius-sm: 6px`（原 4px/6px 併入,4px→6px）
- `--radius-md: 10px`（原 8px/10px/12px 併入,8px→10px、12px→10px）
- `--radius-lg: 18px`（原 14px/18px 併入,14px→18px）
- `--radius-pill: 999px`（膠囊全圓,值不變）
- `--radius-full: 50%`（正圓,值不變）

**pill 與 full 分開的理由:** 兩者都是「全圓」但套用對象不同——`999px` 給膠囊/長條,`50%` 給正方形元件;混用會壞形狀。此區分與 Ruling 2(`.pill-btn` 形狀邏輯)一脈相承:形狀邏輯不同就分開,不強行合併。

**近值合併的裁決依據:** sm(4/6)、md(8/10/12)、lg(14/18)三組原為「差 2-4px 的鄰近值」。經確認這些差異多屬非刻意的雜訊而非設計意圖,故各組收斂為單一階梯值;產品負責人已接受「±2px(單一處 +4px)的視覺微調不破壞畫面」為本批前提。

**實作範圍(commit:radius tokens 收斂,tokens.css:99-103 新增 5 token):**
- **數值會變的 11 處(A 類):** `.icon-btn`/`select`/`.book-page-cover`/`.note-image-thumb-sm`(8→10)、`.avatar-dropdown`/`.search-results`(12→10)、`.local-mode-banner code`/`.note-timeline-card`/`.annotator-canvas`/`.edit-modal-delete`(4→6)、`.action-sheet-cancel`(14→18,唯一 +4px)。
- **值不變、純引用化 24 處(B 類):** 全圓 18 處(pill 12 + full 6)+ 原本已在階梯上的 6/10/18px 共 6 處。
- **特例保留、完全不動 4 處(C 類):** `.login-google-btn`(26px)、`.wrap-shelf-book-cover`(4px 8px 8px 4px)、`.action-sheet`(20px 20px 0 0)、`.action-sheet-option`(0)。

**一致性檢查:** grep 確認 index.css 除 4 個特例外,其餘 35 處全為 `var(--radius-*)`,無殘留字面值;token 出現次數 pill×12/full×6/md×8/sm×6/lg×3 = 35,與收斂前總數一致,無漏改無錯字。

**實作狀態:** ✅ **已完成並驗收(2026-07-27)。** iPhone Safari 實機驗收通過,重點確認 A 類 11 處微調觀感自然、尤其 `.action-sheet-cancel`(+4px)不突兀;C 類特例造型完全未變。
