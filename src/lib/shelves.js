// 三排書架的共用定義：Bookshelf 首頁與 /shelf/:status 詳細頁都靠這份資料對齊
// key（book.status 存的值）與 slug（網址用）分開，因為網址習慣用連字號、資料庫欄位習慣用底線。
export const SHELF_DEFS = [
  { key: 'to_read', slug: 'to-read', label: 'To Read' },
  { key: 'reading', slug: 'reading', label: 'Reading' },
  { key: 'finished', slug: 'finished', label: 'Finished' },
]

const VALID_KEYS = new Set(SHELF_DEFS.map((def) => def.key))

// 舊資料沒有 status 欄位、或值不是三個合法選項之一時，一律當作 Reading，避免掛掉。
export function resolveShelfKey(book) {
  return VALID_KEYS.has(book.status) ? book.status : 'reading'
}

export function shelfDefForSlug(slug) {
  return SHELF_DEFS.find((def) => def.slug === slug)
}
