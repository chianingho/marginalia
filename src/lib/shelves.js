// 書架分組邏輯：首頁（Bookshelf）分組/篩選共用這一套規則。
// Patch 02 P2-3：See all 詳細頁（ShelfDetail）已移除，不再需要跟它同步。

// v2-E：Reading 排主角化，順序改成 Reading → To Read → Finished（原本 To Read 排最前）。
export const SHELF_DEFS = [
  { key: 'reading', slug: 'reading', label: 'Reading' },
  { key: 'to_read', slug: 'to-read', label: 'To Read' },
  { key: 'finished', slug: 'finished', label: 'Finished' },
]

const VALID_STATUS_KEYS = new Set(SHELF_DEFS.map((def) => def.key))

// 舊資料沒有 status 欄位、或值不是三個合法選項之一時，一律當作 Reading，避免掛掉。
export function resolveShelfKey(book) {
  return VALID_STATUS_KEYS.has(book.status) ? book.status : 'reading'
}

// Patch 02 P2-3：Status 加回明列選項（跟增補項 8-7 的決定相反）。順序把
// Category 放在 Year 前面，讓 Year 維持是清單最後一個純按鈕項目——Category
// 在 Bookshelf.jsx 裡改成可展開子清單的複合元件，不再是單純的
// .action-sheet-option，混在清單最後會讓「最後一項不畫底線」的 CSS
// （:last-of-type）誤判到別的元素上。
export const GROUP_BY_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'all', label: 'All Books' },
  { value: 'category', label: 'Category' },
  { value: 'year', label: 'Year' },
]

const GROUP_BY_STORAGE_KEY = 'reading-notes:group-by'

export function loadGroupBy() {
  try {
    const value = localStorage.getItem(GROUP_BY_STORAGE_KEY)
    return GROUP_BY_OPTIONS.some((option) => option.value === value) ? value : 'status'
  } catch {
    return 'status'
  }
}

export function saveGroupBy(value) {
  try {
    localStorage.setItem(GROUP_BY_STORAGE_KEY, value)
  } catch {
    // 存不進去（例如無痕模式）不影響功能，分組偏好本來就只是體驗優化
  }
}

const UNCATEGORIZED_SLUG = 'uncategorized'
const UNCATEGORIZED_LABEL = 'Uncategorized'

function resolveYear(book) {
  const source = book.finished_at || book.created_at
  const year = source ? new Date(source).getFullYear() : NaN
  return Number.isFinite(year) ? String(year) : 'Unknown'
}

// 依目前分組模式把書分成一排一排，每排附上該排的網址 slug，供首頁跟 See all 共用。
// 注意：slug 一律回傳「原始未編碼」的值（例如中文類別直接是「心理」，不是 encodeURIComponent 後的字串）。
// React Router 的 useParams() 會自動把網址的百分比編碼解碼回原始字串，
// 所以拿來跟這裡的 slug 比對時兩邊都要是「未編碼」狀態才會對上；
// 真正組網址（<Link to=...>）時才需要另外 encodeURIComponent。
export function buildShelfRows(books, groupBy) {
  if (groupBy === 'year') {
    const map = new Map()
    for (const book of books) {
      const year = resolveYear(book)
      if (!map.has(year)) map.set(year, [])
      map.get(year).push(book)
    }
    return [...map.entries()]
      .sort((a, b) => {
        if (a[0] === 'Unknown') return 1
        if (b[0] === 'Unknown') return -1
        return b[0].localeCompare(a[0]) // 新到舊
      })
      .map(([year, list]) => ({ key: year, slug: year, label: year, books: list }))
  }

  if (groupBy === 'category') {
    const map = new Map()
    for (const book of books) {
      const category = book.category || UNCATEGORIZED_LABEL
      if (!map.has(category)) map.set(category, [])
      map.get(category).push(book)
    }
    return [...map.entries()]
      .sort((a, b) => {
        if (a[0] === UNCATEGORIZED_LABEL) return 1
        if (b[0] === UNCATEGORIZED_LABEL) return -1
        return a[0].localeCompare(b[0], 'zh-Hant')
      })
      .map(([category, list]) => ({
        key: category,
        slug: category === UNCATEGORIZED_LABEL ? UNCATEGORIZED_SLUG : category,
        label: category,
        books: list,
      }))
  }

  // status（預設）：固定三排、固定順序
  return SHELF_DEFS.map((def) => ({
    key: def.key,
    slug: def.slug,
    label: def.label,
    books: books.filter((book) => resolveShelfKey(book) === def.key),
  }))
}
