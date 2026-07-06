import { supabase, SCREENSHOTS_BUCKET, hasSupabaseConfig } from '../lib/supabaseClient.js'
import * as localStore from '../lib/localStore.js'

export async function fetchNotesByBook(bookId) {
  if (!hasSupabaseConfig) return localStore.fetchNotesByBook(bookId)

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('book_id', bookId)
    .order('read_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * 新增筆記。screenshotFile 是該頁的截圖（File 物件，可省略）。
 */
export async function createNote({ bookId, readDate, content, screenshotFile }) {
  if (!hasSupabaseConfig) {
    return localStore.createNote({ bookId, readDate, content, screenshotFile })
  }

  let screenshotUrl = null

  if (screenshotFile) {
    screenshotUrl = await uploadScreenshot(screenshotFile)
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      book_id: bookId,
      read_date: readDate,
      content: content || null,
      screenshot_url: screenshotUrl,
    })
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

async function uploadScreenshot(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(SCREENSHOTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
