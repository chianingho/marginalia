// 狀態變更時自動記錄日期的規則，createBook / updateBook（local 與 Supabase 兩條路徑）共用，
// 避免各自實作造成邏輯分岔。只會「補上」空白的日期，已經有值的一律保留（手動改回較早狀態不清除）。
export function deriveStatusDates(status, existing = {}) {
  const now = new Date().toISOString()
  let startedAt = existing.started_at || null
  let finishedAt = existing.finished_at || null

  if (status === 'reading' && !startedAt) startedAt = now
  if (status === 'finished' && !finishedAt) finishedAt = now

  return { started_at: startedAt, finished_at: finishedAt }
}
