// 本機預覽用的暫存資料層：把 books / notes 存在瀏覽器 localStorage，
// 圖片則轉成 data URL 直接存進記錄裡。
//
// 注意：這只適合「先看畫面」的暫時測試，localStorage 容量有限（通常 5~10MB），
// 圖片放多了可能會超出容量。正式使用請改回 Supabase（見 README）。
//
// 登入體驗批次（2026-07-23）：訪客模式需要一份完全獨立的 localStorage 命名空間
// （見 guestStore.js），避免訪客隨手新增的資料被日後的一次性遷移函式誤掃到、
// 污染正式登入後的雲端書櫃。這裡把原本寫死 BOOKS_KEY/NOTES_KEY 常數的邏輯抽成
// createLocalStore(keys) 工廠，本檔案預設匯出的函式（fetchBooks 等）都是用原本
// 那組 key 綁定出來的，行為跟改版前完全一樣；guestStore.js 用另一組 key 呼叫
// 同一個工廠，不重寫一份邏輯。

import { deriveStatusDates } from './bookStatus.js'
import { deleteNoteImage, noteDisplayImageKey } from './imageStore.js'
import { getOriginalImageKey } from './noteAnnotation.js'

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

async function deleteNoteImages(note) {
  const originalKey = getOriginalImageKey(note)
  const displayKey = noteDisplayImageKey(note.id)
  if (originalKey) await deleteNoteImage(originalKey)
  await deleteNoteImage(displayKey) // 沒有的話 idb-keyval 刪不存在的 key 本來就是安全的 no-op
}

// booksKey/notesKey/seededFlagKey 決定這個 store 實例讀寫哪一組 localStorage key；
// seedSamples 只有預設（非訪客）實例會是 true——訪客第一次進來應該是真的空書櫃，
// 不需要那 5 本示範書。
export function createLocalStore({ booksKey, notesKey, seededFlagKey, seedSamples }) {
  function seedSampleBooksIfNeeded() {
    if (!seedSamples) return
    if (localStorage.getItem(seededFlagKey)) return
    localStorage.setItem(seededFlagKey, '1')
    if (readAll(booksKey).length > 0) return

    const now = Date.now()
    const books = SAMPLE_BOOKS.map((sample, index) => ({
      id: crypto.randomUUID(),
      title: sample.title,
      author: sample.author,
      cover_url: placeholderCover(index),
      google_books_id: null,
      created_at: new Date(now - index * 1000).toISOString(),
    }))

    writeAll(booksKey, books)
  }

  // ---- books ----

  async function fetchBooks() {
    seedSampleBooksIfNeeded()
    return [...readAll(booksKey)].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  async function fetchBookById(bookId) {
    const book = readAll(booksKey).find((b) => b.id === bookId)
    if (!book) throw new Error('找不到這本書')
    return book
  }

  async function createBook({ title, author, coverFile, coverUrl, googleBooksId, status, category }) {
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

    const books = readAll(booksKey)
    books.unshift(book)
    writeAll(booksKey, books)
    return book
  }

  async function updateBook(bookId, { title, author, coverFile, coverUrl, googleBooksId, status, category }) {
    const books = readAll(booksKey)
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
    writeAll(booksKey, books)
    return updated
  }

  async function deleteBook(bookId) {
    const notesToDelete = readAll(notesKey).filter((n) => n.book_id === bookId)
    await Promise.all(notesToDelete.map((n) => deleteNoteImages(n)))

    writeAll(booksKey, readAll(booksKey).filter((b) => b.id !== bookId))
    writeAll(notesKey, readAll(notesKey).filter((n) => n.book_id !== bookId))
  }

  // ---- notes ----

  async function getNotesByBook(bookId) {
    return readAll(notesKey)
      .filter((n) => n.book_id === bookId)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  }

  // /note/:id 詳情頁用：單筆撈取，找不到回傳 null（不 throw，讓呼叫端決定要不要導回首頁）。
  async function getNoteById(noteId) {
    return readAll(notesKey).find((n) => n.id === noteId) || null
  }

  async function addNote({ id, bookId, content, imageKey, noteDate, page }) {
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

    const notes = readAll(notesKey)
    notes.unshift(note)
    writeAll(notesKey, notes)
    return note
  }

  async function updateNote(noteId, { content, imageKey, noteDate, page, imageDisplay, strokes, resetAnnotation }) {
    const notes = readAll(notesKey)
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
    writeAll(notesKey, notes)
    return updated
  }

  async function deleteNote(noteId) {
    const notes = readAll(notesKey)
    const target = notes.find((n) => n.id === noteId)
    if (target) {
      await deleteNoteImages(target)
    }
    writeAll(notesKey, notes.filter((n) => n.id !== noteId))
  }

  return {
    fetchBooks,
    fetchBookById,
    createBook,
    updateBook,
    deleteBook,
    getNotesByBook,
    getNoteById,
    addNote,
    updateNote,
    deleteNote,
  }
}

const defaultStore = createLocalStore({
  booksKey: 'reading-notes:books',
  notesKey: 'reading-notes:notes',
  seededFlagKey: 'reading-notes:seeded',
  seedSamples: true,
})

export const {
  fetchBooks,
  fetchBookById,
  createBook,
  updateBook,
  deleteBook,
  getNotesByBook,
  getNoteById,
  addNote,
  updateNote,
  deleteNote,
} = defaultStore
