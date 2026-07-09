// 書架分組邏輯：首頁（Bookshelf）跟 See all 詳細頁（ShelfDetail）共用同一套規則，
// 確保「首頁怎麼分排」跟「點進某一排看到什麼書」永遠一致。

export const SHELF_DEFS = [
  { key: 'to_read', slug: 'to-read', label: 'To Read' },
  { key: 'reading', slug: 'reading', label: 'Reading' },
  { key: 'finished', slug: 'finished', label: 'Finished' },
]

const VALID_STATUS_KEYS = new Set(SHELF_DEFS.map((def) => def.key))

// 舊資料沒有 status 欄位、或值不是三個合法選項之一時，一律當作 Reading，避免掛掉。
export function resolveShelfKey(book) {
  return VALID_STATUS_KEYS.has(book.status) ? book.status : 'reading'
}

export const GROUP_BY_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'year', label: 'Year' },
  { value: 'category', label: 'Category' },
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

// 依目前分組模式把書分成一排一排，每排附上該排的網址 slug，供首頁跟 See all 共用
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
      .map(([year, list]) => ({ key: year, slug: encodeURIComponent(year), label: year, books: list }))
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
        slug: category === UNCATEGORIZED_LABEL ? UNCATEGORIZED_SLUG : encodeURIComponent(category),
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

// /shelf/:groupBy/:slug 詳細頁用來反查該排的書跟標題
export function resolveShelfRow(books, groupBy, slug) {
  const rows = buildShelfRows(books, groupBy)
  return rows.find((row) => row.slug === slug) || null
}
