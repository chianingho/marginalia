// 全站日期／時間顯示格式化的唯一入口。來源一律是 created_at（單一事實來源），
// 不用 note_date。新增畫面需要顯示日期時間時，一律從這裡取用，不要各自寫 MONTHS 陣列。
const MONTHS_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const MONTHS_TITLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 時間軸日期標頭用，例如「JUL 10」（全大寫，配合日期標頭的小型大寫視覺）
export function formatTimelineDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS_UPPER[d.getMonth()]} ${d.getDate()}`
}

// 時間軸卡片左欄時間用，例如「8:15 PM」
export function formatTimelineTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hours24 = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${minutes} ${ampm}`
}

// 筆記詳情頁日期用，例如「Jul 10, 2026」
export function formatFullDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS_TITLE[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
