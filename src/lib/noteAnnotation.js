// 舊本機筆記仍使用 image_key；雲端筆記使用 image_path 與相同的 IndexedDB key。
import { getNoteImage, noteDisplayImageKey, restoreNoteImage } from './imageStore.js'
import { supabase, NOTE_IMAGES_BUCKET, getSupabaseSession } from './supabaseClient.js'

export function getOriginalImageKey(note) {
  return note?.image_original || note?.image_key || null
}

export function getNoteStrokes(note) {
  return note?.strokes || []
}

const pendingDownloads = new Map()

// 圖片失敗只影響這張圖，不讓整批筆記或頁面讀取失敗。
export async function getNoteOriginalBlob(note) {
  const key = getOriginalImageKey(note)
  if (!key) return null
  try {
    // 雲端 row 先核對帳號，即使本機有圖也不能跨帳號讀取。
    const session = note.image_path ? await getSupabaseSession() : null
    if (note.image_path && (!session || session.user.id !== note.user_id ||
      !note.image_path.startsWith(`${session.user.id}/`))) return null
    const local = await getNoteImage(key)
    if (local) return local
    if (!note.image_path) return null
    const requestKey = `${note.user_id}:${note.image_path}`
    if (!pendingDownloads.has(requestKey)) {
      const request = (async () => {
        const { data, error } = await supabase.storage.from(NOTE_IMAGES_BUCKET).download(note.image_path)
        if (error) throw error
        if (!data?.size) throw new Error('Storage 圖片為空')
        // 解碼成功才補進 IndexedDB，避免把錯誤回應當成原圖保存。
        const bitmap = await createImageBitmap(data)
        bitmap.close()
        const current = await getSupabaseSession()
        if (current?.user.id !== note.user_id) return null
        try {
          await restoreNoteImage(key, data)
          return await getNoteImage(key) || data
        } catch (cacheError) {
          console.warn('圖片快取寫入失敗，使用已下載的圖片', cacheError)
          return data
        }
      })()
      pendingDownloads.set(requestKey, request)
    }
    try {
      return await pendingDownloads.get(requestKey)
    } finally {
      pendingDownloads.delete(requestKey)
    }
  } catch (error) {
    console.warn('筆記圖片載入失敗', error)
    return null
  }
}

// 與標註器相同：multiply、圓角、原圖寬度的 4.5%、舊座標陣列為黃色。
export function drawNoteStroke(ctx, points, width, color = '#F2FF00') {
  if (!Array.isArray(points) || points.length < 2) return
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(4, width * 0.045)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.stroke()
  ctx.restore()
}

async function renderStrokes(original, strokes) {
  if (!strokes.length) return original
  const bitmap = await createImageBitmap(original)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    for (const stroke of strokes) {
      const points = Array.isArray(stroke) ? stroke : stroke?.points
      if (!Array.isArray(points) || points.some(p => !Number.isFinite(p?.x) || !Number.isFinite(p?.y))) continue
      drawNoteStroke(ctx, points.map(p => ({ x: p.x * canvas.width, y: p.y * canvas.height })), canvas.width,
        Array.isArray(stroke) ? undefined : stroke.color)
    }
    return await new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('筆畫圖片合成失敗'))
    }, 'image/png'))
  } finally {
    bitmap.close()
  }
}

export async function getNoteDisplayBlob(note) {
  if (!note?.id || !getOriginalImageKey(note)) return null
  try {
    // 保留既有合成快取，其中可能有遠端 strokes 未保存的色票。
    if (note.image_path) {
      const session = await getSupabaseSession()
      if (!session || session.user.id !== note.user_id ||
        !note.image_path.startsWith(`${session.user.id}/`)) return null
    }
    const display = await getNoteImage(noteDisplayImageKey(note.id))
    if (display) return display
    const original = await getNoteOriginalBlob(note)
    if (!original) return null
    // 新裝置沒有合成快取時，以目前 row 的 strokes 重建。
    // 合成結果僅用於顯示，不覆寫既有原圖或使用者的合成圖。
    return await renderStrokes(original, getNoteStrokes(note))
  } catch (error) {
    console.warn('筆記標註載入失敗', error)
    return null
  }
}
