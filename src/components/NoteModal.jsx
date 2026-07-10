import { useEffect, useRef, useState } from 'react'
import { addNote, updateNote, deleteNote } from '../api/notes.js'
import { compressImage, deleteNoteImage, getNoteImage, noteImageKey, saveNoteImage } from '../lib/noteImages.js'
import ImageAnnotator from './ImageAnnotator.jsx'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// New Note 跟 Edit Note 共用同一顆 modal（note 有值 = 編輯模式，帶 Delete；沒有 = 新增模式）。
// modal 外殼（尺寸、背景滾動鎖定、內部自捲）直接重用 Add Book modal 的 .add-modal* CSS，不重寫。
// 版面刻意壓緊（截圖列壓扁、日期+頁數併一行、textarea 3 行）：四欄位要在一屏內放完，
// 不然內容高度逼近 85dvh 上限，選圖前後高度差太大，modal 重新置中時就會看起來在「晃」。
export default function NoteModal({ bookId, note, onClose, onSaved, onDeleted }) {
  const [content, setContent] = useState(note?.content || '')
  const [noteDate, setNoteDate] = useState(note?.note_date || todayISO())
  const [page, setPage] = useState(note?.page != null ? String(note.page) : '')
  const [imageFile, setImageFile] = useState(null)
  const [newFilePreviewUrl, setNewFilePreviewUrl] = useState(null)
  const [existingPreviewUrl, setExistingPreviewUrl] = useState(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | submitting
  const [formError, setFormError] = useState('')
  const [showAnnotator, setShowAnnotator] = useState(false)
  const fileInputRef = useRef(null)

  // 鎖住背景頁面滾動：iOS Safari 上單靠 body overflow:hidden 不夠，改用 position:fixed
  // 並記錄/還原 scrollY，避免關閉 modal 後畫面跳掉（跟 AddBookModal 同一套做法）
  useEffect(() => {
    const scrollY = window.scrollY
    const { body } = document
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // 編輯模式：把既有截圖從 IndexedDB 撈出來做預覽縮圖
  useEffect(() => {
    if (!note?.image_key) return
    let objectUrl
    let cancelled = false
    getNoteImage(note.image_key).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setExistingPreviewUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 新選的檔案：另外管自己的 object URL 生命週期
  useEffect(() => {
    if (!imageFile) {
      setNewFilePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setNewFilePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const previewUrl = imageRemoved ? null : newFilePreviewUrl || existingPreviewUrl
  const hasImage = !imageRemoved && (imageFile || note?.image_key)
  const canSave = Boolean(hasImage || content.trim())

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null
    if (!file) return
    setImageFile(file)
    setImageRemoved(false)
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImageRemoved(true)
    // 清掉原生 input 的值，這樣使用者重選同一張圖也會正常觸發 change
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 標注完成：拿到 flatten 過的 PNG blob，當成「新選的檔案」取代原圖，
  // 存檔時會走跟一般選圖一樣的壓縮流程（compressImage），不在這裡重複壓縮。
  function handleAnnotateDone(blob) {
    setImageFile(blob)
    setImageRemoved(false)
    setShowAnnotator(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hasImage && !content.trim()) {
      setFormError('請至少上傳截圖或寫點筆記')
      return
    }
    if (!noteDate) {
      setFormError('請選擇日期')
      return
    }

    setSubmitStatus('submitting')
    try {
      const noteId = note?.id || crypto.randomUUID()
      let imageKey = note?.image_key || null

      if (imageRemoved && imageKey) {
        await deleteNoteImage(imageKey)
        imageKey = null
      }

      if (imageFile) {
        const compressed = await compressImage(imageFile)
        imageKey = noteImageKey(noteId)
        await saveNoteImage(imageKey, compressed)
      }

      const payload = {
        content: content.trim() || null,
        imageKey,
        noteDate,
        page: page.trim() ? Number(page) : null,
      }

      const saved = note
        ? await updateNote(noteId, payload)
        : await addNote({ id: noteId, bookId, ...payload })

      onSaved(saved)
    } catch (err) {
      setSubmitStatus('idle')
      setFormError(err.message)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this note? This cannot be undone.')) return
    try {
      await deleteNote(note.id)
      onDeleted()
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <div className="add-modal-backdrop" onClick={onClose}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{note ? 'Edit Note' : 'New Note'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-modal-form">
          <div className="add-modal-field">
            <label htmlFor="note-image-input" className="add-modal-label-text">
              Screenshot (optional)
            </label>
            {previewUrl ? (
              <div className="note-image-selected-row">
                <img src={previewUrl} alt="" className="note-image-thumb-sm" />
                <button
                  type="button"
                  className="note-image-annotate-link"
                  onClick={() => setShowAnnotator(true)}
                >
                  Annotate
                </button>
                <button
                  type="button"
                  className="note-image-remove-sm"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="add-modal-file-row">
                <label htmlFor="note-image-input" className="add-modal-file-btn">
                  Choose photo
                </label>
                <span className="add-modal-file-name">No file chosen</span>
              </div>
            )}
            <input
              id="note-image-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="add-modal-file-input"
            />
          </div>

          <div className="add-modal-row-2col">
            <label className="add-modal-label">
              Date
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                style={{ fontSize: '16px' }}
                required
              />
            </label>

            <label className="add-modal-label">
              Page (optional)
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                style={{ fontSize: '16px' }}
              />
            </label>
          </div>

          <label className="add-modal-label">
            Note (optional)
            <textarea
              rows={3}
              placeholder="Write your note…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ fontSize: '16px' }}
            />
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <div className="modal-actions">
            <button type="button" className="add-page-btn add-page-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="add-page-btn add-page-btn-primary"
              disabled={submitStatus === 'submitting' || !canSave}
            >
              {submitStatus === 'submitting' ? 'Saving…' : 'Save'}
            </button>
          </div>

          {note && (
            <button type="button" className="edit-modal-delete" onClick={handleDelete}>
              Delete this note
            </button>
          )}
        </form>
      </div>

      {showAnnotator && previewUrl && (
        <ImageAnnotator
          imageUrl={previewUrl}
          onDone={handleAnnotateDone}
          onCancel={() => setShowAnnotator(false)}
        />
      )}
    </div>
  )
}
