// 單本書的狀態標籤邏輯。v6 改版移除了首頁的分組/書架系統
// （原本的 buildShelfRows/resolveShelfRow/GROUP_BY_OPTIONS/loadGroupBy/
// saveGroupBy 已刪除，無呼叫端），這裡只留 BookDetail.jsx 的 statusLabel()
// 跟 EditBookModal.jsx 還在用的狀態正規化邏輯。

// v2-E：Reading 排主角化留下的顯示順序，statusLabel 沿用同一份定義。
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
