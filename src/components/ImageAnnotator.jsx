import { useEffect, useRef, useState } from 'react'

// 截圖標注 MVP：純 canvas + pointer events，不引入任何繪圖套件。
// 唯一工具＝螢光筆，常駐啟用，沒有其他工具可切換。
// 破壞性合成——Undo 只在「完成」之前的筆畫 stack 內有效，一按 Done 就把目前畫面 flatten
// 匯出成一張新圖（呼叫端負責重新壓縮、存回同一個 image_key，覆蓋原圖）。
// 保留原圖／圖層分離是之後的事，MVP 先不做。

const HIGHLIGHT_COLOR = '#F2FF00' // 全站共用值，跟首頁/書架頁書名刷色同一個常數
const HIGHLIGHT_WIDTH_RATIO = 0.045 // 圖寬的 4.5%

function drawStroke(ctx, points, imgWidth) {
  if (points.length < 2) return
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.strokeStyle = HIGHLIGHT_COLOR
  ctx.lineWidth = Math.max(4, imgWidth * HIGHLIGHT_WIDTH_RATIO)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
  ctx.stroke()
  ctx.restore()
}

export default function ImageAnnotator({ imageUrl, onDone, onCancel }) {
  const canvasRef = useRef(null)
  const baseImageRef = useRef(null)
  const strokesRef = useRef([]) // 完成的筆畫：每筆是一串 {x,y} 點
  const draftRef = useRef(null) // 正在畫的那一筆
  const [strokeCount, setStrokeCount] = useState(0) // 只用來讓 Undo 按鈕的 disabled 狀態跟著更新

  // 鎖住背景頁面滾動（跟其他 modal 同一套做法）
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

  // 載入底圖，canvas 內部解析度對齊圖片原始像素尺寸
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      baseImageRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      redraw()
    }
    img.src = imageUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl])

  function redraw() {
    const canvas = canvasRef.current
    const img = baseImageRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    for (const points of strokesRef.current) drawStroke(ctx, points, canvas.width)
    if (draftRef.current) drawStroke(ctx, draftRef.current, canvas.width)
  }

  function getCanvasPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(e) {
    e.preventDefault()
    if (!baseImageRef.current) return
    draftRef.current = [getCanvasPoint(e)]
    canvasRef.current.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!draftRef.current) return
    e.preventDefault()
    draftRef.current.push(getCanvasPoint(e))
    redraw()
  }

  function handlePointerUp() {
    if (!draftRef.current) return
    strokesRef.current = [...strokesRef.current, draftRef.current]
    draftRef.current = null
    setStrokeCount(strokesRef.current.length)
    redraw()
  }

  function handleUndo() {
    if (strokesRef.current.length === 0) return
    strokesRef.current = strokesRef.current.slice(0, -1)
    setStrokeCount(strokesRef.current.length)
    redraw()
  }

  // 返回：已經畫了東西才二次確認，避免手滑丟掉標注
  function handleBack() {
    if (strokeCount > 0 && !confirm('捨棄這次的標注變更？')) return
    onCancel()
  }

  // X：MVP 不加確認，直接捨棄未完成筆畫、離開（跟返回鍵是兩種退出路徑，各自獨立）
  function handleExit() {
    onCancel()
  }

  function handleDone() {
    canvasRef.current.toBlob((blob) => {
      if (blob) onDone(blob)
    }, 'image/png')
  }

  return (
    // stopPropagation：這顆元件常被掛在別的 modal 內部（React tree 上是子節點，
    // 即使視覺上用 position:fixed 蓋在最上層），不擋住點擊事件會直接冒泡到
    // 外層 modal 的 backdrop onClick，把整個 modal 一起關掉。
    <div className="annotator-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="annotator-header">
        <button type="button" className="annotator-exit" onClick={handleExit} aria-label="Exit">
          ✕
        </button>
        <button type="button" className="annotator-back" onClick={handleBack} aria-label="Back">
          ‹
        </button>
        <span className="annotator-tool-indicator">✎ Highlighter</span>
        <div className="annotator-spacer" />
        <button type="button" className="annotator-undo" onClick={handleUndo} disabled={strokeCount === 0}>
          Undo
        </button>
        <button type="button" className="annotator-done" onClick={handleDone}>
          Done
        </button>
      </div>

      <div className="annotator-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="annotator-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  )
}
