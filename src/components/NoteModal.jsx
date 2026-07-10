import { useEffect, useState } from 'react'
import { addNote, updateNote, deleteNote } from '../api/notes.js'

// New Note 跟 Edit Note 共用同一顆 modal（note 有值 = 編輯模式，帶 Delete；沒有 = 新增模式）。
// modal 外殼（尺寸、背景滾動鎖定、內部自捲）直接重用 Add Book modal 的 .add-modal* CSS，不重寫。
export default function NoteModal({ bookId, note, onClose, onSaved, onDeleted }) {
  const [content, setContent] = useState(note?.content || '')
  const [submitStatus, setSubmitStatus] = useState('idle') // idle | submitting
  const [formError, setFormError] = useState('')

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

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      setFormError('Please write something first')
      return
    }

    setSubmitStatus('submitting')
    try {
      const saved = note ? await updateNote(note.id, { content: trimmed }) : await addNote({ bookId, content: trimmed })
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
          <label className="add-modal-label">
            <textarea
              rows={7}
              placeholder="Write your note…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ fontSize: '16px' }}
              autoFocus
              required
            />
          </label>

          {formError && <p className="form-error">{formError}</p>}

          <div className="modal-actions">
            <button type="button" className="add-page-btn add-page-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-page-btn add-page-btn-primary" disabled={submitStatus === 'submitting'}>
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
    </div>
  )
}
