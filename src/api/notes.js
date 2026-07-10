import { supabase, hasSupabaseConfig } from '../lib/supabaseClient.js'
import * as localStore from '../lib/localStore.js'

export async function getNotesByBook(bookId) {
  if (!hasSupabaseConfig) return localStore.getNotesByBook(bookId)

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('book_id', bookId)
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false })

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
      note_date: noteDate,
      page: page ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(noteId, { content, imageKey, noteDate, page }) {
  if (!hasSupabaseConfig) return localStore.updateNote(noteId, { content, imageKey, noteDate, page })

  const { data, error } = await supabase
    .from('notes')
    .update({
      content: content || null,
      image_key: imageKey || null,
      note_date: noteDate,
      page: page ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteNote(noteId) {
  if (!hasSupabaseConfig) return localStore.deleteNote(noteId)

  const { error } = await supabase.from('notes').delete().eq('id', noteId)
  if (error) throw error
}
