import { supabase, COVERS_BUCKET, getSupabaseSession, isExternalUrl, resolveStoragePaths } from '../lib/supabaseClient.js'
import * as localStore from '../lib/localStore.js'
import { compressImage } from '../lib/imageStore.js'
import { deriveStatusDates } from '../lib/bookStatus.js'

// cover_url 在 DB 存的是「Google Books 外部 URL」或「book-covers bucket 內的路徑」，
// 兩種值混在同一欄位，靠 isExternalUrl 分流。私有 bucket 的路徑要在讀取當下換成
// 短效期 signed URL 才能直接當 <img src> 用；signed URL 只留在這裡回傳的物件上（記憶體
// view model），不寫回 DB、也不快取進 localStorage——避免把「路徑」和「臨時憑證」
// 混進同一欄位（跟 diff 報告點出的 screenshot_url vs image_path 是同一種語意錯誤）。
async function withResolvedCovers(books) {
  const urlMap = await resolveStoragePaths(COVERS_BUCKET, books.map((b) => b.cover_url))
  return books.map((b) => ({
    ...b,
    cover_url: b.cover_url && !isExternalUrl(b.cover_url) ? urlMap[b.cover_url] || null : b.cover_url,
  }))
}

export async function fetchBooks() {
  const session = await getSupabaseSession()
  if (!session) return localStore.fetchBooks()

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return withResolvedCovers(data)
}

export async function fetchBookById(bookId) {
  const session = await getSupabaseSession()
  if (!session) return localStore.fetchBookById(bookId)

  const { data, error } = await supabase.from('books').select('*').eq('id', bookId).single()

  if (error) throw error
  const [resolved] = await withResolvedCovers([data])
  return resolved
}

/**
 * 新增書籍。coverFile 是使用者手動上傳的封面（File 物件，可省略）；
 * coverUrl 是從 Google Books 取得的封面網址（可省略）。
 * 若兩者都有，優先使用手動上傳的檔案。
 */
export async function createBook({ title, author, coverFile, coverUrl, googleBooksId, status, category }) {
  const session = await getSupabaseSession()
  if (!session) {
    return localStore.createBook({ title, author, coverFile, coverUrl, googleBooksId, status, category })
  }

  // id 先在本機產生（不吃 DB default），因為使用者上傳封面的 Storage 路徑需要
  // 用到 bookId，插入資料列前就要知道這個值。
  const bookId = crypto.randomUUID()
  let coverPath = coverUrl || null // Google Books 外部 URL，原樣存，不進 Storage

  if (coverFile) {
    coverPath = await uploadCoverFile(session.user.id, bookId, coverFile)
  }

  const finalStatus = status || 'to_read'
  const { started_at, finished_at } = deriveStatusDates(finalStatus, {})
  const addedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('books')
    .insert({
      id: bookId,
      user_id: session.user.id,
      title,
      author: author || null,
      cover_url: coverPath,
      google_books_id: googleBooksId || null,
      status: finalStatus,
      category: category || null,
      started_at,
      finished_at,
      added_at: addedAt,
    })
    .select()
    .single()

  if (error) throw error
  const [resolved] = await withResolvedCovers([data])
  return resolved
}

/**
 * 編輯既有書籍。status 變更時的 started_at / finished_at 自動記錄邏輯與 createBook 共用同一份規則，
 * 已經有值的日期不會被清除（例如手動把 Finished 改回 Reading）。
 */
export async function updateBook(bookId, { title, author, coverFile, coverUrl, googleBooksId, status, category }) {
  const session = await getSupabaseSession()
  if (!session) {
    return localStore.updateBook(bookId, { title, author, coverFile, coverUrl, googleBooksId, status, category })
  }

  // 刻意不透過 fetchBookById 撈舊資料——那支函式會把 cover_url 換成簽名 URL，
  // 拿來當「沒改封面就沿用舊值」的 fallback 會把簽名 URL 寫回 DB，跟 image_path
  // 存路徑的原則衝突。這裡直接查原始列，cover_url 拿到的是路徑或外部 URL 原值。
  const { data: existingRow, error: fetchError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()
  if (fetchError) throw fetchError

  let coverPath = existingRow.cover_url
  if (coverFile) {
    coverPath = await uploadCoverFile(session.user.id, bookId, coverFile)
  } else if (coverUrl) {
    coverPath = coverUrl
  }

  const finalStatus = status || existingRow.status
  const { started_at, finished_at } = deriveStatusDates(finalStatus, existingRow)

  const { data, error } = await supabase
    .from('books')
    .update({
      title: title ?? existingRow.title,
      author: author !== undefined ? author || null : existingRow.author,
      cover_url: coverPath,
      google_books_id: googleBooksId || existingRow.google_books_id,
      status: finalStatus,
      category: category !== undefined ? category || null : existingRow.category,
      started_at,
      finished_at,
    })
    .eq('id', bookId)
    .select()
    .single()

  if (error) throw error
  const [resolved] = await withResolvedCovers([data])
  return resolved
}

export async function deleteBook(bookId) {
  const session = await getSupabaseSession()
  if (!session) return localStore.deleteBook(bookId)

  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) throw error
}

// 比照 imageStore.js 的 compressImage 規則（長邊 ≤1200px、JPEG quality 0.8）壓縮後
// 上傳到 book-covers/{user_id}/{bookId}.jpg，固定副檔名 .jpg（壓縮輸出一律是 JPEG，
// 不看原始檔案的副檔名）。回傳的是 bucket 內路徑，不是可直接渲染的 URL。
async function uploadCoverFile(userId, bookId, file) {
  const compressed = await compressImage(file)
  const path = `${userId}/${bookId}.jpg`

  const { error: uploadError } = await supabase.storage.from(COVERS_BUCKET).upload(path, compressed, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (uploadError) throw uploadError

  return path
}
