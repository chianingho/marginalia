import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NoteForm from '../components/NoteForm.jsx'
import NoteCard from '../components/NoteCard.jsx'
import { fetchBookById } from '../api/books.js'
import { fetchNotesByBook, deleteNote } from '../api/notes.js'

export default function BookNotes() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [notes, setNotes] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [bookId])

  async function load() {
    setStatus('loading')
    try {
      const [bookData, notesData] = await Promise.all([
        fetchBookById(bookId),
        fetchNotesByBook(bookId),
      ])
      setBook(bookData)
      setNotes(notesData)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function handleNoteCreated(note) {
    setNotes((prev) => [note, ...prev])
  }

  async function handleNoteDelete(noteId) {
    if (!confirm('確定要刪除這則筆記嗎？')) return
    try {
      await deleteNote(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    } catch (err) {
      alert(`刪除失敗：${err.message}`)
    }
  }

  if (status === 'loading') return <p>載入中…</p>
  if (status === 'error') return <p className="form-error">載入失敗：{error}</p>

  return (
    <section>
      <Link to="/" className="back-link">
        ← 回到書庫
      </Link>

      <div className="book-detail-header">
        {book.cover_url && <img src={book.cover_url} alt={book.title} className="book-detail-cover" />}
        <div>
          <h1>{book.title}</h1>
          {book.author && <p className="book-detail-author">{book.author}</p>}
        </div>
      </div>

      <NoteForm bookId={bookId} onCreated={handleNoteCreated} />

      <h2 className="notes-heading">筆記紀錄（{notes.length}）</h2>
      {notes.length === 0 ? (
        <p className="empty-hint">還沒有筆記，開始寫下你讀到這本書的想法吧！</p>
      ) : (
        <div className="note-list">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={handleNoteDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
