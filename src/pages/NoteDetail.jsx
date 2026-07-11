import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getNoteById } from '../api/notes.js'
import { getNoteDisplayBlob, getOriginalImageKey } from '../lib/noteAnnotation.js'
import { formatFullDate } from '../lib/format.js'
import NoteImageLightbox from '../components/NoteImageLightbox.jsx'
import NoteModal from '../components/NoteModal.jsx'

// /note/:id — 筆記詳情頁，時間軸卡片點擊的導頁目標。
export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [note, setNote] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | notfound
  const [imageUrl, setImageUrl] = useState(null)
  // null | 'lightbox' | 'annotate' — 圖片本身點擊開一般 lightbox，右上標注入口直接跳標注畫面
  const [imageOverlay, setImageOverlay] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    getNoteById(id)
      .then((found) => {
        if (cancelled) return
        if (!found) {
          setStatus('notfound')
          return
        }
        setNote(found)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('notfound')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!getOriginalImageKey(note)) return
    let objectUrl
    let cancelled = false
    getNoteDisplayBlob(note).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setImageUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id])

  // 深連結直開（沒有 in-app 上一頁）就 fallback 回所屬 /book/:id，
  // 否則走瀏覽器 history back（React Router 初始那筆 history entry 的 key 固定是 'default'）。
  function handleBack() {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate(`/book/${note.book_id}`, { replace: true })
    }
  }

  if (status === 'notfound') return <Navigate to="/" replace />
  if (status === 'loading' || !note) return <p className="bookshelf-status">載入中…</p>

  return (
    <div className="book-page">
      <header className="book-page-header">
        <button type="button" className="book-page-back" aria-label="返回" onClick={handleBack}>
          ‹
        </button>
      </header>

      <div className="note-detail-body">
        {imageUrl && (
          <div className="note-detail-image-wrap">
            <img
              src={imageUrl}
              alt=""
              className="note-detail-image"
              onClick={() => setImageOverlay('lightbox')}
            />
            <button
              type="button"
              className="note-detail-annotate-btn"
              aria-label="標注"
              onClick={() => setImageOverlay('annotate')}
            >
              ✎
            </button>
          </div>
        )}

        <div className="note-detail-meta-row">
          {note.page != null && note.page !== '' && <h1 className="note-detail-page">p. {note.page}</h1>}
          <span className="note-detail-date">{formatFullDate(note.created_at)}</span>
        </div>

        <button type="button" className="note-detail-edit-btn" onClick={() => setShowEditModal(true)}>
          Edit
        </button>

        {note.content && <p className="note-detail-content">{note.content}</p>}
      </div>

      {imageOverlay && imageUrl && (
        <NoteImageLightbox
          note={note}
          displayUrl={imageUrl}
          initialAnnotate={imageOverlay === 'annotate'}
          onClose={() => setImageOverlay(null)}
          onAnnotated={(newUrl, updatedNote) => {
            setImageUrl(newUrl)
            setNote(updatedNote)
          }}
        />
      )}

      {showEditModal && (
        <NoteModal
          bookId={note.book_id}
          note={note}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setNote(updated)
            setShowEditModal(false)
          }}
          onDeleted={() => navigate(`/book/${note.book_id}`, { replace: true })}
        />
      )}
    </div>
  )
}
