import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EditBookModal from '../components/EditBookModal.jsx'
import NoteModal from '../components/NoteModal.jsx'
import NoteList from '../components/NoteList.jsx'
import { fetchBookById } from '../api/books.js'
import { getNotesByBook } from '../api/notes.js'
import { SHELF_DEFS, resolveShelfKey } from '../lib/shelves.js'

function statusLabel(book) {
  return SHELF_DEFS.find((def) => def.key === resolveShelfKey(book))?.label ?? 'Reading'
}

// /book/:id — 點任何書封直達的筆記流頁面，沒有中間層「書籍詳情頁」。
export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [book, setBook] = useState(null)
  const [notes, setNotes] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [showEditBook, setShowEditBook] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    setStatus('loading')
    try {
      const [bookData, notesData] = await Promise.all([fetchBookById(id), getNotesByBook(id)])
      setBook(bookData)
      setNotes(notesData)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function openNewNote() {
    setEditingNote(null)
    setShowNoteModal(true)
  }

  function openEditNote(note) {
    setEditingNote(note)
    setShowNoteModal(true)
  }

  function closeNoteModal() {
    setShowNoteModal(false)
    setEditingNote(null)
  }

  function handleNoteSaved(saved) {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === saved.id)
      const next = exists ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev]
      return [...next].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    })
    closeNoteModal()
  }

  function handleNoteDeleted() {
    setNotes((prev) => prev.filter((n) => n.id !== editingNote?.id))
    closeNoteModal()
  }

  if (status === 'loading') return <p className="bookshelf-status">載入中…</p>
  if (status === 'error') return <p className="bookshelf-status form-error">載入失敗：{error}</p>

  return (
    <div className="book-page">
      <div className="book-page-band" aria-hidden="true">
        {/* Patch 02 P2-4：紅點/叉叉容易被誤讀成錯誤提示，改成四角星閃光記號。
            band 自己是 position:absolute，剛好當這兩個記號的定位基準（172px 卡片本身），
            不用另外量測跟捲動位置無關的絕對座標。 */}
        <svg className="book-page-doodle book-page-doodle--sparkle book-page-doodle--sparkle-tl" viewBox="0 0 12 12" fill="var(--color-ink)">
          <path d="M6 0l1.295 4.705L12 6l-4.705 1.295L6 12l-1.295-4.705L0 6l4.705-1.295z" />
        </svg>
        <svg className="book-page-doodle book-page-doodle--sparkle book-page-doodle--sparkle-br" viewBox="0 0 12 12" fill="var(--color-ink)">
          <path d="M6 0l1.295 4.705L12 6l-4.705 1.295L6 12l-1.295-4.705L0 6l4.705-1.295z" />
        </svg>
      </div>
      <Link to="/" className="book-page-back btn-frosted btn-frosted--circle" aria-label="回首頁">
        <span>‹</span>
      </Link>
      <header className="book-page-header">
        <div className="book-page-top">
          <div className="book-page-cover">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} />
            ) : (
              <span className="book-page-cover-placeholder">{book.title.slice(0, 1)}</span>
            )}
          </div>
          <div className="book-page-info">
            <h1 className="book-page-title">{book.title}</h1>
            <p className="book-page-author-row">
              {book.author && <span className="book-page-author">{book.author}</span>}
              <button type="button" className="book-page-edit-btn" onClick={() => setShowEditBook(true)}>
                Edit
              </button>
            </p>
            <p className="book-page-meta meta-text">
              {statusLabel(book)} · {notes.length} notes
            </p>
          </div>
        </div>
      </header>

      <NoteList notes={notes} onNoteClick={openEditNote} />

      <button type="button" className="add-book-btn btn-frosted" onClick={openNewNote}>
        <span className="add-book-btn-icon">＋</span>
        New Note
      </button>

      {showEditBook && (
        <EditBookModal
          book={book}
          onClose={() => setShowEditBook(false)}
          onSaved={(updated) => {
            setBook(updated)
            setShowEditBook(false)
          }}
          onDeleted={() => navigate('/')}
        />
      )}

      {showNoteModal && (
        <NoteModal
          bookId={id}
          note={editingNote}
          onClose={closeNoteModal}
          onSaved={handleNoteSaved}
          onDeleted={handleNoteDeleted}
        />
      )}
    </div>
  )
}
