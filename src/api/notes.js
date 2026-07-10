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

export async function addNote({ bookId, content }) {
  if (!hasSupabaseConfig) return localStore.addNote({ bookId, content })

  const { data, error } = await supabase
    .from('notes')
    .insert({ book_id: bookId, content })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(noteId, { content }) {
  if (!hasSupabaseConfig) return localStore.updateNote(noteId, { content })

  const { data, error } = await supabase
    .from('notes')
    .update({ content, updated_at: new Date().toISOString() })
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
