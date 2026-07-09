import { supabase, COVERS_BUCKET, hasSupabaseConfig } from '../lib/supabaseClient.js'
import * as localStore from '../lib/localStore.js'

export async function fetchBooks() {
  if (!hasSupabaseConfig) return localStore.fetchBooks()

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchBookById(bookId) {
  if (!hasSupabaseConfig) return localStore.fetchBookById(bookId)

  const { data, error } = await supabase.from('books').select('*').eq('id', bookId).single()

  if (error) throw error
  return data
}

/**
 * 新增書籍。coverFile 是使用者手動上傳的封面（File 物件，可省略）；
 * coverUrl 是從 Google Books 取得的封面網址（可省略）。
 * 若兩者都有，優先使用手動上傳的檔案。
 */
export async function createBook({ title, author, coverFile, coverUrl, googleBooksId, status, category }) {
  if (!hasSupabaseConfig) {
    return localStore.createBook({ title, author, coverFile, coverUrl, googleBooksId, status, category })
  }

  let finalCoverUrl = coverUrl || null

  if (coverFile) {
    finalCoverUrl = await uploadCoverFile(coverFile)
  }

  const { data, error } = await supabase
    .from('books')
    .insert({
      title,
      author: author || null,
      cover_url: finalCoverUrl,
      google_books_id: googleBooksId || null,
      status: status || 'to_read',
      category: category || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBook(bookId) {
  if (!hasSupabaseConfig) return localStore.deleteBook(bookId)

  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) throw error
}

async function uploadCoverFile(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(COVERS_BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
