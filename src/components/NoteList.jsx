import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNoteDisplayBlob, getOriginalImageKey } from '../lib/noteAnnotation.js'
import { formatTimelineDate, formatTimelineTime } from '../lib/format.js'
import NoteImageLightbox from './NoteImageLightbox.jsx'

// 依本地日期（年/月/日）分組——notes 已經是 created_at 由舊到新排序，同一天一定
// 連續出現，直接照順序累加分組即可，不需要另外排序。分組純粹是顯示層的事，
// 不動 notes 本身、不動資料層。
function groupNotesByDay(notes) {
  const groups = []
  let currentKey = null
  for (const note of notes) {
    const d = new Date(note.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (key !== currentKey) {
      groups.push({ key, label: formatTimelineDate(note.created_at), notes: [] })
      currentKey = key
    }
    groups[groups.length - 1].notes.push(note)
  }
  return groups
}

// note 文字最多顯示兩行，只有「真的有第二行」才套第二行淡出遮罩——單行 note 不受影響。
// 用 Range.getClientRects() 數自然斷行數（不受 -webkit-line-clamp 影響，量到的是文字
// 實際排版行數，不是裁切後的可視行數），>1 行才加 is-multiline。
function NoteContent({ text }) {
  const ref = useRef(null)
  const [isMultiline, setIsMultiline] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const range = document.createRange()
    range.selectNodeContents(el)
    setIsMultiline(range.getClientRects().length > 1)
  }, [text])

  return (
    <p ref={ref} className={`note-timeline-content ${isMultiline ? 'is-multiline' : ''}`}>
      {text}
    </p>
  )
}

// 日期分組標頭：一痕螢光黃貼著文字，寬度依實際量到的文字寬度計算（不寫死），
// 左右各溢出約 5px。視覺語言呼應首頁 lockup 的 Marginalia 小字刷色，但這裡是
// 純色小色塊（無 wobble 濾鏡），跟著文字內容變動即時重量。
function DayHeader({ label }) {
  const labelRef = useRef(null)
  const [highlightWidth, setHighlightWidth] = useState(0)

  useEffect(() => {
    if (labelRef.current) {
      setHighlightWidth(labelRef.current.getBoundingClientRect().width)
    }
  }, [label])

  return (
    <div className="note-timeline-day-header">
      {highlightWidth > 0 && (
        <span
          className="note-timeline-day-highlight"
          style={{ width: `${highlightWidth + 10}px` }}
          aria-hidden="true"
        />
      )}
      <span className="note-timeline-day-label" ref={labelRef}>
        {label}
      </span>
    </div>
  )
}

// 撈顯示用截圖 blob（有標注就是合成快取，沒有就 fallback 原圖）轉成縮圖，
// 離開時自己 revoke object URL。refreshToken 變了就強制重撈一次
// （標注完成後用這個觸發縮圖更新，撈的時候一律走 getNoteDisplayBlob，
// 不用擔心這裡的 note prop 是不是最新——顯示快取 key 是純 noteId 算出來的固定值）。
function NoteThumbnail({ note, refreshToken, onOpen }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let objectUrl
    let cancelled = false
    getNoteDisplayBlob(note).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id, refreshToken])

  if (!url) return null

  return (
    <img
      src={url}
      alt=""
      className="note-timeline-thumb"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(url)
      }}
    />
  )
}

// 純渲染元件：吃 notes 陣列畫時間軸，依日分組（同一天共用一個日期標頭，卡片
// 左欄只留時間）。showBookTitle 給未來「全部筆記時間牆」用（單書頁不需要，
// 時間牆會把 note.bookTitle 一起塞進 notes 陣列再傳進來）。
// 顯示排序固定為 created_at 由舊到新（由上往下），跟資料層 getNotesByBook 回傳的
// 新到舊順序無關——這裡只重排「顯示用」的副本，不動 notes prop、不動資料層。
// 卡片點擊 = 導頁進 /note/:id 詳情頁（縮圖點擊另外 stopPropagation，走既有 lightbox）。
export default function NoteList({ notes, showBookTitle = false }) {
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState(null) // { note, url } | null
  const [refreshTokens, setRefreshTokens] = useState({})

  if (notes.length === 0) {
    return <p className="note-timeline-empty">No notes yet</p>
  }

  const sortedNotes = [...notes].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
  const dayGroups = groupNotesByDay(sortedNotes)

  function openLightbox(note, url) {
    setLightbox({ note, url })
  }

  return (
    <>
      <div className="note-timeline">
        {dayGroups.map((group) => (
          <div className="note-timeline-day-group" key={group.key}>
            <DayHeader label={group.label} />
            {group.notes.map((note) => (
              <div className="note-timeline-row" key={note.id}>
                <div className="note-timeline-col">
                  <span className="note-timeline-time">{formatTimelineTime(note.created_at)}</span>
                </div>

                <div className="note-timeline-card-wrap">
                  <div className="note-timeline-divider" />
                  <button
                    type="button"
                    className="note-timeline-card"
                    onClick={() => navigate(`/note/${note.id}`)}
                  >
                    {showBookTitle && note.bookTitle && <p className="note-timeline-book">{note.bookTitle}</p>}
                    {getOriginalImageKey(note) && (
                      <NoteThumbnail note={note} refreshToken={refreshTokens[note.id]} onOpen={(url) => openLightbox(note, url)} />
                    )}
                    {note.page != null && note.page !== '' && <p className="note-timeline-page">p. {note.page}</p>}
                    {note.content && <NoteContent text={note.content} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {lightbox && (
        <NoteImageLightbox
          note={lightbox.note}
          displayUrl={lightbox.url}
          onClose={() => setLightbox(null)}
          onAnnotated={(newUrl) => {
            setLightbox((prev) => (prev ? { ...prev, url: newUrl } : prev))
            setRefreshTokens((prev) => ({ ...prev, [lightbox.note.id]: (prev[lightbox.note.id] || 0) + 1 }))
          }}
        />
      )}
    </>
  )
}
