import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getNoteById } from '../api/notes.js'
import { fetchBookById } from '../api/books.js'
import { getNoteDisplayBlob, getOriginalImageKey } from '../lib/noteAnnotation.js'
import { formatFullDate } from '../lib/format.js'
import NoteImageLightbox from '../components/NoteImageLightbox.jsx'
import NoteModal from '../components/NoteModal.jsx'
import HighlightLabel from '../components/HighlightLabel.jsx'

// /note/:id — 筆記詳情頁，時間軸卡片點擊的導頁目標。
// 總規格項目 6（批次 N）／N-2：獨立全螢幕三段式頁面（綠帶標頭／暗室照片區／
// 紙面內文區），不透出下層。NoteImageLightbox 這裡單純是「進標注畫面」的
// 撈圖+存檔 wrapper（舊的整頁黑底一般 lightbox 分支已整組移除，見該元件），
// 圖片本身不是可點開放大檢視的入口，唯一操作是 Edit annotation 按鈕。
export default function NoteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [note, setNote] = useState(null)
  const [book, setBook] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | notfound
  const [imageUrl, setImageUrl] = useState(null)
  const [showAnnotator, setShowAnnotator] = useState(false)
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
        fetchBookById(found.book_id)
          .then((b) => {
            if (!cancelled) setBook(b)
          })
          .catch(() => {})
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
    <div className="note-detail-screen">
      <header className="note-detail-band">
        <button type="button" className="note-detail-back" aria-label="返回" onClick={handleBack}>
          <span>‹</span>
        </button>
        <h1 className="note-detail-title">{book?.title || 'Marginalia'}</h1>
      </header>

      {imageUrl && (
        <div className="note-detail-darkroom">
          <div className="note-detail-image-wrap">
            <img src={imageUrl} alt="" className="note-detail-image" />
            <button
              type="button"
              className="note-detail-annotate-btn btn-frosted btn-frosted--sm"
              onClick={() => setShowAnnotator(true)}
            >
              ✎ Edit annotation
            </button>
          </div>
        </div>
      )}

      <div className="note-detail-paper">
        {note.page != null && note.page !== '' && (
          <div className="note-detail-meta-row">
            <HighlightLabel
              wrapClassName="note-detail-page-wrap"
              highlightClassName="note-detail-page-highlight"
              labelClassName="note-detail-page meta-text"
            >
              p. {note.page}
            </HighlightLabel>
            <span className="note-detail-date meta-text">{formatFullDate(note.created_at)}</span>
          </div>
        )}
        {(note.page == null || note.page === '') && (
          <div className="note-detail-meta-row note-detail-meta-row--no-page">
            <span className="note-detail-date meta-text">{formatFullDate(note.created_at)}</span>
          </div>
        )}

        {note.content && <p className="note-detail-content">{note.content}</p>}

        <button type="button" className="note-detail-edit-btn" onClick={() => setShowEditModal(true)}>
          ✎ Edit
        </button>
      </div>

      {showAnnotator && imageUrl && (
        <NoteImageLightbox
          note={note}
          onClose={() => setShowAnnotator(false)}
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
