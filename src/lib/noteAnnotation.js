// 標注非破壞性改版共用邏輯：
// - image_original：標注前原圖 key，永不覆寫。
// - strokes：正規化 0-1 座標的筆畫資料，存在 note 記錄本身（不是 IndexedDB）。
// - image_display：original + strokes 合成後的顯示快取 key，每次 Done 覆寫。
// 舊資料（改版前建立的筆記）只有 image_key（當時的破壞性合成結果），沒有
// image_original / strokes / image_display 這三個欄位——完全用「讀取時」的
// fallback 處理，不用一次性改寫 localStorage：image_key 直接當 image_original，
// strokes 視為空陣列，image_display 視為沒有（回退讀 image_original）。
import { getNoteImage, noteDisplayImageKey } from './imageStore.js'

export function getOriginalImageKey(note) {
  return note?.image_original || note?.image_key || null
}

export function getNoteStrokes(note) {
  return note?.strokes || []
}

// 顯示用圖片 blob：顯示快取 key 是純粹從 noteId 算出來的固定值，直接試撈，
// 不依賴呼叫端手上的 note 物件是否為最新（例如剛標注完，父層 state 還沒同步
// 最新 image_display 也沒關係，因為 key 本身跟 note 欄位無關，撈到的內容一定
// 是最新的）。沒有顯示快取（從沒標注過）才 fallback 讀原圖。
export async function getNoteDisplayBlob(note) {
  if (!note?.id) return null
  const displayBlob = await getNoteImage(noteDisplayImageKey(note.id))
  if (displayBlob) return displayBlob
  const originalKey = getOriginalImageKey(note)
  if (!originalKey) return null
  return getNoteImage(originalKey)
}
