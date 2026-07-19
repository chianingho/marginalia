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
      <Link to="/" className="book-page-back btn-frosted btn-frosted--circle" aria-label="回首頁">
        <span>‹</span>
      </Link>

      {/* book-detail-redesign-0719 項目 1：海報式書封區——底色 var(--poster-backdrop)、
          書封置中，取代原本綠帶/紙感卡片跨界浮出的版面。星芒是「閱讀痕跡層」手繪詞彙，
          跟返回鍵/New Note 等功能性 UI 分開，只出現在這種展示性色塊上。 */}
      <div className="book-page-poster">
        <svg className="book-page-poster-star" viewBox="0 0 30 30" fill="none" aria-hidden="true">
          <path
            d="M15 1l3.7 10.3L29 15l-10.3 3.7L15 29l-3.7-10.3L1 15l10.3-3.7z"
            stroke="var(--hand-drawn-stroke)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="book-page-cover">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} />
          ) : (
            <span className="book-page-cover-placeholder">{book.title.slice(0, 1)}</span>
          )}
        </div>
      </div>

      {/* 項目 2：書名 + meta 單行小字網格（作者｜狀態｜N notes｜Edit）。 */}
      <div className="book-page-titleblock">
        <h1 className="book-page-title">{book.title}</h1>
        <div className="book-page-title-hairline" aria-hidden="true" />
        <div className="book-page-meta-grid">
          {book.author && <span className="book-page-meta-item book-page-author meta-text">{book.author}</span>}
          <span className="book-page-meta-item meta-text">{statusLabel(book)}</span>
          <span className="book-page-meta-item meta-text">{notes.length} notes</span>
          <button
            type="button"
            className="book-page-meta-item book-page-edit-btn meta-text"
            onClick={() => setShowEditBook(true)}
          >
            Edit
          </button>
        </div>
      </div>

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
