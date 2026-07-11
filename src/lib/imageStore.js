// IndexedDB（用 idb-keyval）圖片存取的唯一入口：全 app 需要讀/寫/刪圖片 blob，
// 一律走這裡，不要直接 import idb-keyval。不進 localStorage —— notes 記錄只存
// key 參照，避免圖片把 localStorage 的容量上限（通常 5~10MB）塞爆。
import { get, set, del } from 'idb-keyval'

// 標注非破壞性改版：一則筆記的截圖現在有兩把 IndexedDB key——
// 原圖（noteOriginalImageKey，標注前，永不覆寫）跟顯示快取
// （noteDisplayImageKey，原圖+筆畫合成後的結果，每次 Done 覆寫）。
// 兩把 key 都是純粹從 noteId 算出來的固定值，不用另外存在 note 記錄裡。
// 之後要加新的 key 種類（例如封面圖），比照這個模式加一個 xxxImageKey(id) 函式即可，
// 不用動 get/set/delete 這幾個通用讀寫函式、呼叫端也不用改。
export function noteOriginalImageKey(noteId) {
  return `note-img-${noteId}`
}

export function noteDisplayImageKey(noteId) {
  return `note-img-display-${noteId}`
}

export async function saveNoteImage(key, blob) {
  await set(key, blob)
}

export async function getNoteImage(key) {
  return get(key)
}

export async function deleteNoteImage(key) {
  await del(key)
}

// 上傳後先壓縮：長邊縮到 ≤1200px、輸出 JPEG quality 0.8，控制單張圖片的儲存體積
export async function compressImage(file, { maxSize = 1200, quality = 0.8 } = {}) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('圖片壓縮失敗'))),
      'image/jpeg',
      quality,
    )
  })
}
