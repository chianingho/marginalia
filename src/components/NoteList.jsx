import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNoteDisplayBlob, getOriginalImageKey } from '../lib/noteAnnotation.js'
import { formatTimelineDate, formatTimelineTime } from '../lib/format.js'
import HighlightLabel from './HighlightLabel.jsx'

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
// 純色小色塊（無 wobble 濾鏡），跟著文字內容變動即時重量。量測邏輯抽到共用的
// HighlightLabel（總規格項目 6：詳情頁 p.{n} 重用同一份，不另寫）。
// book-detail-redesign-0719：樣式/邏輯完全不動（修訂版 spec 明訂不含手繪元素，
// 先前草稿加的星芒已拿掉）。
function DayHeader({ label }) {
  return (
    <HighlightLabel
      wrapClassName="note-timeline-day-header"
      highlightClassName="note-timeline-day-highlight"
      labelClassName="note-timeline-day-label meta-text"
    >
      {label}
    </HighlightLabel>
  )
}

// 撈顯示用截圖 blob（有標注就是合成快取，沒有就 fallback 原圖）轉成縮圖，
// 離開時自己 revoke object URL。N-2：縮圖不再是可點開 lightbox 的獨立入口，
// 點卡片任何位置（含縮圖）一律導頁進 /note/:id 詳情頁——不用 stopPropagation
// 也不用 refreshToken 手動觸發更新，標注完從詳情頁返回時 /book/:id 整頁
// 重新掛載、notes 重新撈取，縮圖自然拿到最新的顯示快取。
function NoteThumbnail({ note }) {
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
  }, [note.id])

  if (!url) return null

  return <img src={url} alt="" className="note-timeline-thumb" />
}

// 純渲染元件：吃 notes 陣列畫時間軸，依日分組（同一天共用一個日期標頭）。
// book-detail-redesign-0719：原本的 showBookTitle/note.bookTitle（保留給未來
// 「全部筆記時間牆」用）沒有任何呼叫端傳 true，這次整頁卡片重寫順手拿掉，
// 之後真的要做時間牆再加回來，不影響現在的行為。
// 顯示排序固定為 created_at 由舊到新（由上往下），跟資料層 getNotesByBook 回傳的
// 新到舊順序無關——這裡只重排「顯示用」的副本，不動 notes prop、不動資料層。
// N-2：統一路徑，卡片內任意位置一律導頁進 /note/:id 詳情頁。
// book-detail-redesign-0719 項目 3：卡片改「海報感」白底方卡（原本的左側時間欄
// +卡片上緣髮絲線分隔的版面整組退場）——時間欄拿掉，時間併入卡片底部 meta
// 一行（時間｜類型），時間流分組仍然只靠日期標頭。頁碼改純文字小字（原規格要
// Cormorant，這個字體已被多輪決議退場，改用 --font-serif，見 index.css）。
// 這批筆記資料沒有獨立的「標題」欄位（NoteModal 只有 content/page），spec
// 項目 3 提到「頁碼與標題同行、對齊標題基線」對不上現有資料模型（沒有標題），
// 頁碼這裡先維持獨立一行放在內文上方，此落差另外回報，不在這裡自行加欄位。
export default function NoteList({ notes }) {
  const navigate = useNavigate()

  if (notes.length === 0) {
    return <p className="note-timeline-empty">No notes yet</p>
  }

  const sortedNotes = [...notes].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
  const dayGroups = groupNotesByDay(sortedNotes)

  return (
    <div className="note-timeline">
      {dayGroups.map((group) => (
        <div className="note-timeline-day-group" key={group.key}>
          <DayHeader label={group.label} />
          {group.notes.map((note) => (
            <button
              type="button"
              className="note-timeline-card"
              key={note.id}
              onClick={() => navigate(`/note/${note.id}`)}
            >
              {getOriginalImageKey(note) && <NoteThumbnail note={note} />}
              <div className="note-timeline-card-body">
                {note.page != null && note.page !== '' && <p className="note-timeline-page">p. {note.page}</p>}
                {note.content && <NoteContent text={note.content} />}
                <div className="note-timeline-card-hairline" aria-hidden="true" />
                <p className="note-timeline-card-meta meta-text">
                  {formatTimelineTime(note.created_at)} · {getOriginalImageKey(note) ? 'Photo' : 'Text'}
                </p>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
