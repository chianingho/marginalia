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

export async function addNote({ id, bookId, content, imageKey, noteDate, page }) {
  if (!hasSupabaseConfig) return localStore.addNote({ id, bookId, content, imageKey, noteDate, page })

  const { data, error } = await supabase
    .from('notes')
    .insert({
      id,
      book_id: bookId,
      content: content || null,
      image_key: imageKey || null,
      note_date: noteDate || new Date().toISOString().slice(0, 10),
      page: page ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(noteId, { content, imageKey, noteDate, page }) {
  if (!hasSupabaseConfig) return localStore.updateNote(noteId, { content, imageKey, noteDate, page })

  const patch = {
    content: content || null,
    image_key: imageKey || null,
    page: page ?? null,
    updated_at: new Date().toISOString(),
  }
  // noteDate 沒帶就不動這個欄位，保留既有值（跟 localStore 的行為一致）
  if (noteDate !== undefined) patch.note_date = noteDate

  const { data, error } = await supabase.from('notes').update(patch).eq('id', noteId).select().single()

  if (error) throw error
  return data
}

export async function deleteNote(noteId) {
  if (!hasSupabaseConfig) return localStore.deleteNote(noteId)

  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error
}
