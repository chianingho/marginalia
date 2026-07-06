import { useState } from 'react'
import { createNote } from '../api/notes.js'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function NoteForm({ bookId, onCreated }) {
  const [readDate, setReadDate] = useState(todayISO())
  const [content, setContent] = useState('')
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | submitting | error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      const note = await createNote({ bookId, readDate, content, screenshotFile })
      setContent('')
      setScreenshotFile(null)
      setReadDate(todayISO())
      e.target.reset()
      setStatus('idle')
      onCreated(note)
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <h3>新增這一頁的筆記</h3>
      <label>
        閱讀日期
        <input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)} required />
      </label>
      <label>
        頁面截圖（選填）
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
        />
      </label>
      <label>
        心得
        <textarea
          rows={4}
          placeholder="寫下你對這一頁的想法⋯⋯"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? '儲存中…' : '儲存筆記'}
      </button>
    </form>
  )
}
