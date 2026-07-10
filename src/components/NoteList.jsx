import { useEffect, useState } from 'react'
import { compressImage, getNoteImage, saveNoteImage } from '../lib/noteImages.js'
import ImageAnnotator from './ImageAnnotator.jsx'

function formatNoteMeta(note) {
  const parts = []
  if (note.note_date) parts.push(note.note_date)
  if (note.page != null && note.page !== '') parts.push(`p.${note.page}`)
  return parts.join(' · ')
}

// 從 IndexedDB 撈截圖 blob 轉成縮圖，離開時自己 revoke object URL。
// refreshToken 變了就強制重撈一次（標注完成存回同一個 image_key 後用這個觸發縮圖更新）。
function NoteThumbnail({ imageKey, refreshToken, onOpen }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey, refreshToken])

  if (!url) return null

  return (
    <img
      src={url}
      alt=""
      className="book-page-note-thumb"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(imageKey, url)
      }}
    />
  )
}

// 純渲染元件：吃 notes 陣列畫時間流。showBookTitle 給未來「全部筆記時間牆」用
// （單書頁不需要，時間牆會把 note.bookTitle 一起塞進 notes 陣列再傳進來）。
export default function NoteList({ notes, showBookTitle = false, onNoteClick }) {
  const [lightbox, setLightbox] = useState(null) // { imageKey, url } | null
  const [showAnnotator, setShowAnnotator] = useState(false)
  const [refreshTokens, setRefreshTokens] = useState({})

  if (notes.length === 0) {
    return <p className="book-page-notes-empty">No notes yet</p>
  }

  function openLightbox(imageKey, url) {
    setLightbox({ imageKey, url })
  }

  // lightbox 的標注入口：完成後直接壓縮存回同一個 image_key（覆蓋原圖），
  // 更新 lightbox 顯示 + 讓對應縮圖強制重撈一次。
  async function handleAnnotateDone(blob) {
    const key = lightbox.imageKey
    const compressed = await compressImage(blob)
    await saveNoteImage(key, compressed)
    const newUrl = URL.createObjectURL(compressed)
    setLightbox({ imageKey: key, url: newUrl })
    setRefreshTokens((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    setShowAnnotator(false)
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
            {note.image_key && (
              <NoteThumbnail imageKey={note.image_key} refreshToken={refreshTokens[note.image_key]} onOpen={openLightbox} />
            )}
            {note.content && <p className="book-page-note-content">{note.content}</p>}
            <p className="book-page-note-date">{formatNoteMeta(note)}</p>
          </button>
        ))}
      </div>

      {lightbox && !showAnnotator && (
        <div className="note-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox.url} alt="" />
          <button
            type="button"
            className="note-lightbox-annotate"
            onClick={(e) => {
              e.stopPropagation()
              setShowAnnotator(true)
            }}
          >
            Edit annotation
          </button>
        </div>
      )}

      {showAnnotator && lightbox && (
        <ImageAnnotator
          imageUrl={lightbox.url}
          onDone={handleAnnotateDone}
          onCancel={() => setShowAnnotator(false)}
        />
      )}
    </>
  )
}
