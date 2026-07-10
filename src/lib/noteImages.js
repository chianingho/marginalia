// 筆記截圖存 IndexedDB（用 idb-keyval），不進 localStorage —— notes 記錄只存 image_key 參照，
// 避免圖片把 localStorage 的容量上限（通常 5~10MB）塞爆。
import { get, set, del } from 'idb-keyval'

export function noteImageKey(noteId) {
  return `note-img-${noteId}`
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
