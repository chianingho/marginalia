// 筆記截圖存 IndexedDB（用 idb-keyval），不進 localStorage —— notes 記錄只存 image_key 參照，
// 避免圖片把 localStorage 的容量上限（通常 5~10MB）塞爆。
import { get, set, del } from 'idb-keyval'

// 標注非破壞性改版：一則筆記的截圖現在有兩把 IndexedDB key——
// 原圖（noteOriginalImageKey，標注前，永不覆寫）跟顯示快取
// （noteDisplayImageKey，原圖+筆畫合成後的結果，每次 Done 覆寫）。
// 兩把 key 都是純粹從 noteId 算出來的固定值，不用另外存在 note 記錄裡。
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
