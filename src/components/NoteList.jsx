import { useEffect, useState } from 'react'
import { getNoteImage } from '../lib/noteImages.js'

function formatNoteMeta(note) {
  const parts = []
  if (note.note_date) parts.push(note.note_date)
  if (note.page != null && note.page !== '') parts.push(`p.${note.page}`)
  return parts.join(' · ')
}

// 從 IndexedDB 撈截圖 blob 轉成縮圖，離開時自己 revoke object URL
function NoteThumbnail({ imageKey, onOpen }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let objectUrl
    let cancelled = false
    getNoteImage(imageKey).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageKey])

  if (!url) return null

  return (
    <img
      src={url}
      alt=""
      className="book-page-note-thumb"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(url)
      }}
    />
  )
}

// 純渲染元件：吃 notes 陣列畫時間流。showBookTitle 給未來「全部筆記時間牆」用
// （單書頁不需要，時間牆會把 note.bookTitle 一起塞進 notes 陣列再傳進來）。
export default function NoteList({ notes, showBookTitle = false, onNoteClick }) {
  const [lightboxUrl, setLightboxUrl] = useState(null)

  if (notes.length === 0) {
    return <p className="book-page-notes-empty">No notes yet</p>
  }

  return (
    <>
      <div className="book-page-note-list">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            className="book-page-note"
            onClick={() => onNoteClick?.(note)}
          >
            {showBookTitle && note.bookTitle && <p className="book-page-note-book">{note.bookTitle}</p>}
            {note.image_key && <NoteThumbnail imageKey={note.image_key} onOpen={setLightboxUrl} />}
            {note.content && <p className="book-page-note-content">{note.content}</p>}
            <p className="book-page-note-date">{formatNoteMeta(note)}</p>
          </button>
        ))}
      </div>

      {lightboxUrl && (
        <div className="note-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" />
        </div>
      )}
    </>
  )
}
