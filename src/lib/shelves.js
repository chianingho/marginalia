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

// 修正批次（加入月份自動記錄）：年/月篩選一律以 added_at（新增書籍當下自動寫入
// 的完整 ISO 時間戳）為準，不是 finished_at/created_at。舊資料沒有 added_at
// 時回傳 null——呼叫端要把這種書當「無日期」處理，不能進任何年/月分組，
// 也不能生出一顆「Unknown」可選值（跟 category 的 Uncategorized 桶不同，
// 年/月這裡沒有「無日期」這個可篩選的選項，spec 明講「不進年/月篩選結果」）。
function resolveAddedAtParts(book) {
  if (!book.added_at) return null
  const date = new Date(book.added_at)
  if (Number.isNaN(date.getTime())) return null
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

// 依目前分組模式把書分成一排一排，每排附上該排的網址 slug，供首頁跟 See all 共用。
// 注意：slug 一律回傳「原始未編碼」的值（例如中文類別直接是「心理」，不是 encodeURIComponent 後的字串）。
// React Router 的 useParams() 會自動把網址的百分比編碼解碼回原始字串，
// 所以拿來跟這裡的 slug 比對時兩邊都要是「未編碼」狀態才會對上；
// 真正組網址（<Link to=...>）時才需要另外 encodeURIComponent。
export function buildShelfRows(books, groupBy) {
  if (groupBy === 'year') {
    // 只列資料中「實際存在」的年份（動態），沒有 added_at 的書直接跳過，
    // 不產生任何列可以選到它們。
    const map = new Map()
    for (const book of books) {
      const parts = resolveAddedAtParts(book)
      if (!parts) continue
      const year = String(parts.year)
      if (!map.has(year)) map.set(year, [])
      map.get(year).push(book)
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0])) // 新到舊
      .map(([year, list]) => ({ key: year, slug: year, label: year, books: list }))
  }

  if (groupBy === 'month') {
    // 月份固定 1–12 月，不管資料裡有沒有書一律列出全部 12 個選項
    // （跟 year 的「動態只列實際存在的值」不同，month 是行事曆式固定集合）。
    const buckets = new Map(Array.from({ length: 12 }, (_, i) => [i + 1, []]))
    for (const book of books) {
      const parts = resolveAddedAtParts(book)
      if (!parts) continue
      buckets.get(parts.month).push(book)
    }
    return [...buckets.entries()].map(([month, list]) => ({
      key: String(month),
      slug: String(month),
      label: `${month}月`,
      books: list,
    }))
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
