// 書架分組邏輯：首頁（Bookshelf）分組/篩選共用這一套規則。
// Patch 03：篩選改成跨三組（Status/Category/Year）多選，不再有單一 groupBy
// 模式，GROUP_BY_OPTIONS/loadGroupBy/saveGroupBy 已移除（沒有呼叫端了）；
// buildShelfRows 的分組結果現在同時拿來畫「未篩選時的預設三排」跟算「篩選
// 面板裡某個 facet 選中值涵蓋哪些書」，兩種用途共用同一份邏輯。

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
