import { supabase, hasSupabaseConfig } from '../lib/supabaseClient.js'
import * as localStore from '../lib/localStore.js'

export async function getNotesByBook(bookId) {
  if (!hasSupabaseConfig) return localStore.getNotesByBook(bookId)

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getNoteById(noteId) {
  if (!hasSupabaseConfig) return localStore.getNoteById(noteId)

  const { data, error } = await supabase.from('notes').select('*').eq('id', noteId).maybeSingle()

  if (error) throw error
  return data
}

// 8 月接 Supabase 備忘（標注非破壞性改版）：notes 表要加 strokes (jsonb) 欄位；
// 圖片 Storage 用兩把 key（original / display），結構跟 localStore 那邊的 IndexedDB
// key 平移，這裡先保留參數介面對齊，實際 insert/update 欄位等真的啟用時再對到
// Storage path 命名規則。
export async function addNote({ id, bookId, content, imageKey, noteDate, page }) {
  if (!hasSupabaseConfig) return localStore.addNote({ id, bookId, content, imageKey, noteDate, page })

  const { data, error } = await supabase
    .from('notes')
    .insert({
      id,
      book_id: bookId,
      content: content || null,
      image_original: imageKey || null,
      image_display: null,
      strokes: [],
      note_date: noteDate || new Date().toISOString().slice(0, 10),
      page: page ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(noteId, { content, imageKey, noteDate, page, imageDisplay, strokes, resetAnnotation }) {
  if (!hasSupabaseConfig) {
    return localStore.updateNote(noteId, { content, imageKey, noteDate, page, imageDisplay, strokes, resetAnnotation })
  }

  const patch = { updated_at: new Date().toISOString() }
  if (content !== undefined) patch.content = content || null
  if (imageKey !== undefined) patch.image_original = imageKey || null
  if (page !== undefined) patch.page = page ?? null
  // noteDate 沒帶就不動這個欄位，保留既有值（跟 localStore 的行為一致）
  if (noteDate !== undefined) patch.note_date = noteDate
  if (resetAnnotation) {
    patch.image_display = null
    patch.strokes = []
  }
  if (imageDisplay !== undefined) patch.image_display = imageDisplay
  if (strokes !== undefined) patch.strokes = strokes

  const { data, error } = await supabase.from('notes').update(patch).eq('id', noteId).select().single()

  if (error) throw error
  return data
}

export async function deleteNote(noteId) {
  if (!hasSupabaseConfig) return localStore.deleteNote(noteId)

  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error
}
