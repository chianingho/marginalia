import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { compressImage, getNoteImage, saveNoteImage } from '../lib/noteImages.js'
import ImageAnnotator from './ImageAnnotator.jsx'

// 全 app 時間顯示統一以 created_at 為單一事實來源（不再用 note_date）
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatTimelineDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function formatTimelineTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hours24 = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${minutes} ${ampm}`
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
      className="note-timeline-thumb"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(imageKey, url)
      }}
    />
  )
}

// 純渲染元件：吃 notes 陣列畫時間軸。showBookTitle 給未來「全部筆記時間牆」用
// （單書頁不需要，時間牆會把 note.bookTitle 一起塞進 notes 陣列再傳進來）。
// 顯示排序固定為 created_at 由舊到新（由上往下），跟資料層 getNotesByBook 回傳的
// 新到舊順序無關——這裡只重排「顯示用」的副本，不動 notes prop、不動資料層。
// 卡片點擊 = 導頁進 /note/:id 詳情頁（縮圖點擊另外 stopPropagation，走既有 lightbox）。
export default function NoteList({ notes, showBookTitle = false }) {
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState(null) // { imageKey, url } | null
  const [showAnnotator, setShowAnnotator] = useState(false)
  const [refreshTokens, setRefreshTokens] = useState({})

  if (notes.length === 0) {
    return <p className="note-timeline-empty">No notes yet</p>
  }

  const sortedNotes = [...notes].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))

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
      <div className="note-timeline">
        {sortedNotes.map((note, index) => (
          <div className="note-timeline-row" key={note.id}>
            <div className="note-timeline-col">
              <span className="note-timeline-date">{formatTimelineDate(note.created_at)}</span>
              <span className="note-timeline-time">{formatTimelineTime(note.created_at)}</span>
              <span className="note-timeline-dot" />
              {index < sortedNotes.length - 1 && <span className="note-timeline-line" />}
            </div>

            <div className="note-timeline-card-wrap">
              <button
                type="button"
                className="note-timeline-card"
                onClick={() => navigate(`/note/${note.id}`)}
              >
                {showBookTitle && note.bookTitle && <p className="note-timeline-book">{note.bookTitle}</p>}
                {note.image_key && (
                  <NoteThumbnail imageKey={note.image_key} refreshToken={refreshTokens[note.image_key]} onOpen={openLightbox} />
                )}
                {note.page != null && note.page !== '' && <p className="note-timeline-page">page.{note.page}</p>}
                {note.content && <p className="note-timeline-content">{note.content}</p>}
              </button>
              {index < sortedNotes.length - 1 && <div className="note-timeline-divider" />}
            </div>
          </div>
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
