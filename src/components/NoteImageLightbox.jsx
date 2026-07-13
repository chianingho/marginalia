import { useEffect, useState } from 'react'
import { updateNote } from '../api/notes.js'
import { compressImage, getNoteImage, noteDisplayImageKey, saveNoteImage } from '../lib/imageStore.js'
import { getNoteStrokes, getOriginalImageKey } from '../lib/noteAnnotation.js'
import ImageAnnotator from './ImageAnnotator.jsx'

// N-2：舊的「整頁黑底 + 照片 + 中央白色 Edit annotation 膠囊」一般 lightbox
// 分支已整組移除（含死碼）——詳情頁（NoteDetail）是筆記放大/標注的唯一入口，
// 這個元件現在單純負責「撈原圖 → 進標注畫面 → 存檔」，不再有 initialAnnotate
// 開關或非標注的檢視狀態。
export default function NoteImageLightbox({ note, onClose, onAnnotated }) {
  const [originalUrl, setOriginalUrl] = useState(null)

  useEffect(() => {
    let objectUrl
    let cancelled = false
    const originalKey = getOriginalImageKey(note)
    if (!originalKey) return
    getNoteImage(originalKey).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setOriginalUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  async function handleAnnotateDone(blob, strokes) {
    const compressed = await compressImage(blob)
    const displayKey = noteDisplayImageKey(note.id)
    await saveNoteImage(displayKey, compressed)
    const updatedNote = await updateNote(note.id, {
      content: note.content,
      imageKey: getOriginalImageKey(note),
      page: note.page,
      imageDisplay: displayKey,
      strokes,
    })
    const newUrl = URL.createObjectURL(compressed)
    onAnnotated?.(newUrl, updatedNote)
    onClose()
  }

  if (!originalUrl) return null

  return (
    <ImageAnnotator
      imageUrl={originalUrl}
      initialStrokes={getNoteStrokes(note)}
      onDone={handleAnnotateDone}
      onCancel={onClose}
    />
  )
}
