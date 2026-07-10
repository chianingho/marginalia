function formatNoteDate(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 純渲染元件：吃 notes 陣列畫時間流。showBookTitle 給未來「全部筆記時間牆」用
// （單書頁不需要，時間牆會把 note.bookTitle 一起塞進 notes 陣列再傳進來）。
export default function NoteList({ notes, showBookTitle = false, onNoteClick }) {
  if (notes.length === 0) {
    return <p className="book-page-notes-empty">No notes yet</p>
  }

  return (
    <div className="book-page-note-list">
      {notes.map((note) => (
        <button
          key={note.id}
          type="button"
          className="book-page-note"
          onClick={() => onNoteClick?.(note)}
        >
          {showBookTitle && note.bookTitle && <p className="book-page-note-book">{note.bookTitle}</p>}
          <p className="book-page-note-content">{note.content}</p>
          <p className="book-page-note-date">{formatNoteDate(note.created_at)}</p>
        </button>
      ))}
    </div>
  )
}
