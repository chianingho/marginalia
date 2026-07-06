export default function NoteCard({ note, onDelete }) {
  return (
    <article className="note-card">
      <header className="note-card-header">
        <span className="note-date">{note.read_date}</span>
        <button className="icon-btn" onClick={() => onDelete(note.id)} aria-label="刪除筆記">
          🗑
        </button>
      </header>

      {note.screenshot_url && (
        <img className="note-screenshot" src={note.screenshot_url} alt="頁面截圖" loading="lazy" />
      )}

      {note.content && <p className="note-content">{note.content}</p>}
    </article>
  )
}
