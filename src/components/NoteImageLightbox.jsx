import { useState } from 'react'
import { compressImage, saveNoteImage } from '../lib/noteImages.js'
import ImageAnnotator from './ImageAnnotator.jsx'

// 共用截圖 lightbox：點背景關閉，可進標注模式後直接壓縮存回同一個 image_key（覆蓋原圖）。
// 跟 NoteList.jsx 裡那份是同一套視覺／行為，這裡獨立成元件給 NoteDetail 用，
// 沒有動 NoteList 自己那份內嵌實作。
// initialAnnotate：詳情頁圖片右上的「標注」入口直接跳全螢幕標注畫面用，這種情況下不管是
// 按返回還是完成，都要直接關閉整個 overlay（onClose），而不是掉回使用者根本沒點開過的 lightbox。
export default function NoteImageLightbox({ imageKey, url, initialAnnotate = false, onClose, onAnnotated }) {
  const [showAnnotator, setShowAnnotator] = useState(initialAnnotate)
  const [currentUrl, setCurrentUrl] = useState(url)

  async function handleAnnotateDone(blob) {
    const compressed = await compressImage(blob)
    await saveNoteImage(imageKey, compressed)
    const newUrl = URL.createObjectURL(compressed)
    setCurrentUrl(newUrl)
    onAnnotated?.(newUrl)
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
          <img src={currentUrl} alt="" />
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

      {showAnnotator && (
        <ImageAnnotator imageUrl={currentUrl} onDone={handleAnnotateDone} onCancel={handleAnnotatorCancel} />
      )}
    </>
  )
}
