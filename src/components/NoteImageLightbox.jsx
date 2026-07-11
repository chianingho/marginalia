import { useEffect, useState } from 'react'
import { updateNote } from '../api/notes.js'
import { compressImage, getNoteImage, noteDisplayImageKey, saveNoteImage } from '../lib/imageStore.js'
import { getNoteStrokes, getOriginalImageKey } from '../lib/noteAnnotation.js'
import ImageAnnotator from './ImageAnnotator.jsx'

// 共用截圖 lightbox：點背景關閉，可進標注模式（非破壞性——原圖 image_original 永遠
// 不動，Done 只覆寫顯示快取 image_display 並把 strokes 寫回 note 記錄）。
// initialAnnotate：詳情頁圖片右上的「標注」入口直接跳全螢幕標注畫面用，這種情況下不管是
// 按 X 還是完成，都要直接關閉整個 overlay（onClose），而不是掉回使用者根本沒點開過的 lightbox。
export default function NoteImageLightbox({ note, displayUrl, initialAnnotate = false, onClose, onAnnotated }) {
  const [showAnnotator, setShowAnnotator] = useState(initialAnnotate)
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState(displayUrl)
  const [originalUrl, setOriginalUrl] = useState(null)

  // 只有真的要進標注畫面才去撈原圖（單純看 lightbox 不需要）
  useEffect(() => {
    if (!showAnnotator) return
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
  }, [showAnnotator])

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
    setCurrentDisplayUrl(newUrl)
    onAnnotated?.(newUrl, updatedNote)
    if (initialAnnotate) {
      onClose()
    } else {
      setShowAnnotator(false)
    }
  }

  function handleAnnotatorCancel() {
    if (initialAnnotate) {
      onClose()
    } else {
      setShowAnnotator(false)
    }
  }

  return (
    <>
      {!showAnnotator && (
        <div className="note-lightbox" onClick={onClose}>
          <img src={currentDisplayUrl} alt="" />
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

      {showAnnotator && originalUrl && (
        <ImageAnnotator
          imageUrl={originalUrl}
          initialStrokes={getNoteStrokes(note)}
          onDone={handleAnnotateDone}
          onCancel={handleAnnotatorCancel}
        />
      )}
    </>
  )
}
