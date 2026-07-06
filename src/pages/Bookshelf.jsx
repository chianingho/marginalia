import { useEffect, useState } from 'react'
import BookCard from '../components/BookCard.jsx'
import AddBookModal from '../components/AddBookModal.jsx'
import { fetchBooks } from '../api/books.js'

export default function Bookshelf() {
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setStatus('loading')
    try {
      const data = await fetchBooks()
      setBooks(data)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function handleCreated(book) {
    setBooks((prev) => [book, ...prev])
    setShowModal(false)
  }

  return (
    <section>
      <div className="page-header">
        <h1>
          <span className="highlight-text">Bookshelf</span>
        </h1>
        <button onClick={() => setShowModal(true)}>＋ 新增書籍</button>
      </div>

      {status === 'loading' && <p>載入中…</p>}
      {status === 'error' && <p className="form-error">載入失敗：{error}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="empty-hint">書庫還是空的，點擊「新增書籍」開始紀錄你的閱讀吧！</p>
      )}

      {status === 'ready' && books.length > 0 && (
        <div className="book-grid">
          {books.map((book, index) => (
            <div className="shelf-slot" key={book.id}>
              <BookCard book={book} index={index} />
            </div>
          ))}
        </div>
      )}

      {showModal && <AddBookModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </section>
  )
}
