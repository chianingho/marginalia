import { supabase, NOTE_IMAGES_BUCKET, getSupabaseSession } from '../lib/supabaseClient.js'
import * as localStore from '../lib/localStore.js'
import * as guestStore from '../lib/guestStore.js'
import { isGuestMode } from '../lib/guestMode.js'
import { getNoteImage, noteOriginalImageKey } from '../lib/imageStore.js'

// 見 api/books.js 的同名函式：訪客跟「單純沒登入」要走不同命名空間。
function localModeStore() {
  return isGuestMode() ? guestStore : localStore
}

// DB 保存 Storage 路徑；顯示元件使用既有 IndexedDB key。
// 缺少本機圖片時，noteAnnotation.js 會讀取私有 Storage 並補入快取。
function toClientNote(row) {
  return {
    ...row,
    image_original: row.image_path ? noteOriginalImageKey(row.id) : null,
  }
}

export async function getNotesByBook(bookId) {
  const session = await getSupabaseSession()
  if (!session) return localModeStore().getNotesByBook(bookId)

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(toClientNote)
}

export async function getNoteById(noteId) {
  const session = await getSupabaseSession()
  if (!session) return localModeStore().getNoteById(noteId)

  const { data, error } = await supabase.from('notes').select('*').eq('id', noteId).maybeSingle()

  if (error) throw error
  return data ? toClientNote(data) : null
}

export async function addNote({ id, bookId, content, imageKey, noteDate, page }) {
  const session = await getSupabaseSession()
  if (!session) return localModeStore().addNote({ id, bookId, content, imageKey, noteDate, page })

  const noteId = id || crypto.randomUUID()
  // imageKey 是呼叫端（NoteModal）已經存進本機 IndexedDB 的 key，這裡撈回 blob
  // 上傳到 note-images/{user_id}/{noteId}.jpg，DB 只存路徑。noteDate 不寫入
  // （決策 C：查詢端改用 created_at 現算）。
  const imagePath = imageKey ? await uploadNoteImage(session.user.id, noteId, imageKey) : null

  const { data, error } = await supabase
    .from('notes')
    .insert({
      id: noteId,
      user_id: session.user.id,
      book_id: bookId,
      content: content || null,
      page: page ?? null,
      image_path: imagePath,
      strokes: [],
    })
    .select()
    .single()

  if (error) throw error
  return toClientNote(data)
}

export async function updateNote(noteId, { content, imageKey, noteDate, page, imageDisplay, strokes, resetAnnotation }) {
  const session = await getSupabaseSession()
  if (!session) {
    return localModeStore().updateNote(noteId, { content, imageKey, noteDate, page, imageDisplay, strokes, resetAnnotation })
  }

  const patch = {}
  if (content !== undefined) patch.content = content || null
  if (page !== undefined) patch.page = page ?? null
  // updated_at 由 DB trigger（set_updated_at）自動維護，這裡不手動帶。
  // imageDisplay（合成顯示快取）不入庫，留在本機 IndexedDB，決策 A。

  if (resetAnnotation) {
    // 圖真的換了或被移除才重新上傳/清空，避免每次編輯內文都白白重傳同一張圖。
    patch.image_path = imageKey ? await uploadNoteImage(session.user.id, noteId, imageKey) : null
    patch.strokes = []
  } else if (strokes !== undefined) {
    patch.strokes = strokes
  }

  const { data, error } = await supabase.from('notes').update(patch).eq('id', noteId).select().single()

  if (error) throw error
  return toClientNote(data)
}

export async function deleteNote(noteId) {
  const session = await getSupabaseSession()
  if (!session) return localModeStore().deleteNote(noteId)

  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error
}

async function uploadNoteImage(userId, noteId, imageKey) {
  const blob = await getNoteImage(imageKey)
  if (!blob) throw new Error('找不到要上傳的圖片，請重新選擇照片。')

  const path = `${userId}/${noteId}.jpg`
  const { error } = await supabase.storage.from(NOTE_IMAGES_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw error

  return path
}
