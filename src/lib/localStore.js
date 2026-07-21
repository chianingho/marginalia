// 本機預覽用的暫存資料層：把 books / notes 存在瀏覽器 localStorage，
// 圖片則轉成 data URL 直接存進記錄裡。
//
// 注意：這只適合「先看畫面」的暫時測試，localStorage 容量有限（通常 5~10MB），
// 圖片放多了可能會超出容量。正式使用請改回 Supabase（見 README）。

import { deriveStatusDates } from './bookStatus.js'
import { deleteNoteImage, noteDisplayImageKey } from './imageStore.js'
import { getOriginalImageKey } from './noteAnnotation.js'

const BOOKS_KEY = 'reading-notes:books'
const NOTES_KEY = 'reading-notes:notes'
const SEEDED_FLAG_KEY = 'reading-notes:seeded'

const SAMPLE_BOOKS = [
  { title: '小王子', author: 'Antoine de Saint-Exupéry' },
  { title: '挪威的森林', author: '村上春樹' },
  { title: '百年孤寂', author: 'Gabriel García Márquez' },
  { title: '風之影', author: 'Carlos Ruiz Zafón' },
  { title: '房思琪的初戀樂園', author: '林奕含' },
]

const COVER_PALETTES = [
  ['#F1E4D3', '#D8C3A5'],
  ['#E8D8C3', '#C6A77D'],
  ['#EFE3D0', '#CBB89D'],
  ['#E3D5CA', '#B8A398'],
  ['#F4E9DD', '#D9C7B8'],
]

// 產生暖色調漸層的書封面佔位圖（SVG data URI），純粹用來預覽卡片版型，
// 不依賴外部圖片來源。
function placeholderCover(seed) {
  const [from, to] = COVER_PALETTES[seed % COVER_PALETTES.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="450" fill="url(#g)"/>
    <rect x="18" y="18" width="264" height="414" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// 第一次在本機預覽模式開啟時，自動塞幾本範例書籍方便預覽卡片版型。
// 用 SEEDED_FLAG_KEY 確保只會發生一次，之後使用者刪除書籍也不會被重新加回來。
function seedSampleBooksIfNeeded() {
  if (localStorage.getItem(SEEDED_FLAG_KEY)) return
  localStorage.setItem(SEEDED_FLAG_KEY, '1')
  if (readAll(BOOKS_KEY).length > 0) return

  const now = Date.now()
  const books = SAMPLE_BOOKS.map((sample, index) => ({
    id: crypto.randomUUID(),
    title: sample.title,
    author: sample.author,
    cover_url: placeholderCover(index),
    google_books_id: null,
    created_at: new Date(now - index * 1000).toISOString(),
  }))

  writeAll(BOOKS_KEY, books)
}

function readAll(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function writeAll(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('讀取圖片檔案失敗'))
    reader.readAsDataURL(file)
  })
}

// ---- books ----

export async function fetchBooks() {
  seedSampleBooksIfNeeded()
  return [...readAll(BOOKS_KEY)].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function fetchBookById(bookId) {
  const book = readAll(BOOKS_KEY).find((b) => b.id === bookId)
  if (!book) throw new Error('找不到這本書')
  return book
}

export async function createBook({ title, author, coverFile, coverUrl, googleBooksId, status, category }) {
  let finalCoverUrl = coverUrl || null
  if (coverFile) {
    finalCoverUrl = await fileToDataUrl(coverFile)
  }

  const finalStatus = status || 'to_read'
  const { started_at, finished_at } = deriveStatusDates(finalStatus, {})
  const now = new Date().toISOString()

  const book = {
    id: crypto.randomUUID(),
    title,
    author: author || null,
    cover_url: finalCoverUrl,
    google_books_id: googleBooksId || null,
    status: finalStatus,
    category: category || null,
    started_at,
    finished_at,
    created_at: now,
    // 修正批次（加入月份自動記錄）：新增書籍當下自動寫入，年/月篩選唯一依據
    // ——不提供手動輸入年份的欄位。只在「新增」寫入，編輯不會補寫/覆寫這個
    // 欄位，舊資料（這次改動之前建立的書）沒有這個值，讀取時當「無日期」。
    added_at: now,
  }

  const books = readAll(BOOKS_KEY)
  books.unshift(book)
  writeAll(BOOKS_KEY, books)
  return book
}

export async function updateBook(bookId, { title, author, coverFile, coverUrl, googleBooksId, status, category }) {
  const books = readAll(BOOKS_KEY)
  const index = books.findIndex((b) => b.id === bookId)
  if (index === -1) throw new Error('找不到這本書')

  const existing = books[index]

  let finalCoverUrl = existing.cover_url
  if (coverFile) {
    finalCoverUrl = await fileToDataUrl(coverFile)
  } else if (coverUrl) {
    finalCoverUrl = coverUrl
  }

  const finalStatus = status || existing.status
  const { started_at, finished_at } = deriveStatusDates(finalStatus, existing)

  const updated = {
    ...existing,
    title: title ?? existing.title,
    author: author !== undefined ? author || null : existing.author,
    cover_url: finalCoverUrl,
    google_books_id: googleBooksId || existing.google_books_id,
    status: finalStatus,
    category: category !== undefined ? category || null : existing.category,
    started_at,
    finished_at,
  }

  books[index] = updated
  writeAll(BOOKS_KEY, books)
  return updated
}

export async function deleteBook(bookId) {
  const notesToDelete = readAll(NOTES_KEY).filter((n) => n.book_id === bookId)
  await Promise.all(notesToDelete.map((n) => deleteNoteImages(n)))

  writeAll(BOOKS_KEY, readAll(BOOKS_KEY).filter((b) => b.id !== bookId))
  writeAll(NOTES_KEY, readAll(NOTES_KEY).filter((n) => n.book_id !== bookId))
}

// ---- notes ----
// 單書筆記流：id / book_id / content / image_original / image_display / strokes /
// note_date / page / created_at / updated_at。
// 圖片本體不在這裡：image_original／image_display 只是指到 IndexedDB（見 imageStore.js）
// 的參照。標注非破壞性改版：image_original 是標注前原圖、永不覆寫；strokes 是正規化
// 0-1 座標的筆畫資料；image_display 是 original+strokes 合成後的顯示快取，每次 Done
// 覆寫。舊資料（改版前建立）只有 image_key（當時的破壞性合成結果），沒有這三個新欄位
// ——讀取時用 getOriginalImageKey／getNoteDisplayBlob（見 noteAnnotation.js）fallback
// 處理，這裡不做一次性改寫遷移。
// note_date 不再是使用者輸入欄位：新增時自動 = created_at 的日期（8 月接 Supabase 時 schema
// 對齊照舊保留這個欄位，但寫入邏輯改成自動衍生）。全 app 排序／時間顯示一律以 created_at 為準；
// 舊筆記既有的 note_date 值不會被這次改動動到，只是不再拿來排序或顯示。

// 8 月接 Supabase 備忘：notes 表加 strokes (jsonb) 欄位；Storage 圖片兩把 key
// （original / display），結構跟這裡的 IndexedDB key 平移，不需要另外設計。

async function deleteNoteImages(note) {
  const originalKey = getOriginalImageKey(note)
  const displayKey = noteDisplayImageKey(note.id)
  if (originalKey) await deleteNoteImage(originalKey)
  await deleteNoteImage(displayKey) // 沒有的話 idb-keyval 刪不存在的 key 本來就是安全的 no-op
}

export async function getNotesByBook(bookId) {
  return readAll(NOTES_KEY)
    .filter((n) => n.book_id === bookId)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
}

// /note/:id 詳情頁用：單筆撈取，找不到回傳 null（不 throw，讓呼叫端決定要不要導回首頁）。
export async function getNoteById(noteId) {
  return readAll(NOTES_KEY).find((n) => n.id === noteId) || null
}

export async function addNote({ id, bookId, content, imageKey, noteDate, page }) {
  const now = new Date().toISOString()
  const note = {
    id: id || crypto.randomUUID(),
    book_id: bookId,
    content: content || null,
    image_original: imageKey || null,
    image_display: null,
    strokes: [],
    note_date: noteDate || now.slice(0, 10),
    page: page ?? null,
    created_at: now,
    updated_at: now,
  }

  const notes = readAll(NOTES_KEY)
  notes.unshift(note)
  writeAll(NOTES_KEY, notes)
  return note
}

// resetAnnotation：換了一張全新的原圖（或整張截圖被移除）才傳 true——這時候舊的顯示
// 快取跟舊圖的筆畫已經對不上了，要清掉 image_display／strokes，並把舊的顯示快取
// blob 一併刪除（deterministic key，不刪的話下次撈圖會撈到跟新原圖對不上的舊合成結果）。
// imageDisplay／strokes：標注畫面 Done 之後呼叫，只更新這兩個欄位，不動 content/page/原圖。
export async function updateNote(noteId, { content, imageKey, noteDate, page, imageDisplay, strokes, resetAnnotation }) {
  const notes = readAll(NOTES_KEY)
  const index = notes.findIndex((n) => n.id === noteId)
  if (index === -1) throw new Error('找不到這則筆記')

  const existing = notes[index]
  const updated = { ...existing, updated_at: new Date().toISOString() }
  if (content !== undefined) updated.content = content || null
  if (imageKey !== undefined) updated.image_original = imageKey || null
  if (noteDate !== undefined) updated.note_date = noteDate
  if (page !== undefined) updated.page = page ?? null

  if (resetAnnotation) {
    await deleteNoteImage(noteDisplayImageKey(noteId))
    updated.image_display = null
    updated.strokes = []
  }
  if (imageDisplay !== undefined) updated.image_display = imageDisplay
  if (strokes !== undefined) updated.strokes = strokes

  notes[index] = updated
  writeAll(NOTES_KEY, notes)
  return updated
}

export async function deleteNote(noteId) {
  const notes = readAll(NOTES_KEY)
  const target = notes.find((n) => n.id === noteId)
  if (target) {
    await deleteNoteImages(target)
  }
  writeAll(NOTES_KEY, notes.filter((n) => n.id !== noteId))
}
