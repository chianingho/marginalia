import { Link } from 'react-router-dom'

export default function BookCard({ book, index = 0 }) {
  return (
    <Link
      to={`/books/${book.id}`}
      className="book-card"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="book-cover">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} loading="lazy" />
        ) : (
          <div className="book-cover-placeholder">{book.title.slice(0, 1)}</div>
        )}
      </div>
      <div className="book-info">
        <p className="book-title">{book.title}</p>
        {book.author && <p className="book-author">{book.author}</p>}
      </div>
    </Link>
  )
}
