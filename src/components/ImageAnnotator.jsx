import { useEffect, useRef, useState } from 'react'

// 截圖標注（MVP）：純 canvas + pointer events，不引入任何繪圖套件。
// 破壞性合成——Undo 只在「完成」之前的操作 stack 內有效，一按 Done 就把目前畫面 flatten
// 匯出成一張新圖（呼叫端負責重新壓縮、存回同一個 image_key，覆蓋原圖）。
// 保留原圖／圖層分離是之後的事，MVP 先不做。

const HIGHLIGHT_COLOR = '#F2FF00'
const HIGHLIGHT_WIDTH_RATIO = 0.045 // 圖寬的 4.5%
const CIRCLE_COLOR = '#2A332A' // 墨綠，跟書架層板同色系
const CIRCLE_WIDTH = 3
const STAR_COLOR = '#1a1a1a'
const STAR_SIZE_RATIO = 0.09

function drawStar(ctx, cx, cy, size) {
  const spikes = 5
  const outerRadius = size / 2
  const innerRadius = outerRadius * 0.45
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius)
    rot += step
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius)
    rot += step
  }
  ctx.closePath()
  ctx.fillStyle = STAR_COLOR
  ctx.fill()
  ctx.restore()
}

function drawOp(ctx, op, imgWidth) {
  if (op.type === 'highlight') {
    if (op.points.length < 2) return
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = HIGHLIGHT_COLOR
    ctx.lineWidth = Math.max(4, imgWidth * HIGHLIGHT_WIDTH_RATIO)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(op.points[0].x, op.points[0].y)
    for (let i = 1; i < op.points.length; i++) ctx.lineTo(op.points[i].x, op.points[i].y)
    ctx.stroke()
    ctx.restore()
  } else if (op.type === 'circle') {
    const cx = (op.x1 + op.x2) / 2
    const cy = (op.y1 + op.y2) / 2
    const rx = Math.abs(op.x2 - op.x1) / 2
    const ry = Math.abs(op.y2 - op.y1) / 2
    if (rx < 1 || ry < 1) return
    ctx.save()
    ctx.strokeStyle = CIRCLE_COLOR
    ctx.lineWidth = CIRCLE_WIDTH
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  } else if (op.type === 'star') {
    drawStar(ctx, op.x, op.y, Math.max(20, imgWidth * STAR_SIZE_RATIO))
  }
}

export default function ImageAnnotator({ imageUrl, onDone, onCancel }) {
  const canvasRef = useRef(null)
  const baseImageRef = useRef(null)
  const opsRef = useRef([])
  const draftRef = useRef(null)
  const [tool, setTool] = useState('highlight')
  const [opsCount, setOpsCount] = useState(0) // 只用來讓 Undo 按鈕的 disabled 狀態跟著更新

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
    for (const op of opsRef.current) drawOp(ctx, op, canvas.width)
    if (draftRef.current) drawOp(ctx, draftRef.current, canvas.width)
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
    const pt = getCanvasPoint(e)

    if (tool === 'star') {
      opsRef.current = [...opsRef.current, { type: 'star', x: pt.x, y: pt.y }]
      setOpsCount(opsRef.current.length)
      redraw()
      return
    }

    if (tool === 'highlight') {
      draftRef.current = { type: 'highlight', points: [pt] }
    } else if (tool === 'circle') {
      draftRef.current = { type: 'circle', x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y }
    }
    canvasRef.current.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!draftRef.current) return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    if (draftRef.current.type === 'highlight') {
      draftRef.current.points.push(pt)
    } else if (draftRef.current.type === 'circle') {
      draftRef.current.x2 = pt.x
      draftRef.current.y2 = pt.y
    }
    redraw()
  }

  function handlePointerUp() {
    if (!draftRef.current) return
    opsRef.current = [...opsRef.current, draftRef.current]
    draftRef.current = null
    setOpsCount(opsRef.current.length)
    redraw()
  }

  function handleUndo() {
    if (opsRef.current.length === 0) return
    opsRef.current = opsRef.current.slice(0, -1)
    setOpsCount(opsRef.current.length)
    redraw()
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
        <button type="button" className="annotator-close" onClick={onCancel} aria-label="Cancel">
          ✕
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

      <div className="annotator-toolbar">
        <button
          type="button"
          className={`annotator-tool ${tool === 'highlight' ? 'is-active' : ''}`}
          onClick={() => setTool('highlight')}
        >
          ✎ Highlight
        </button>
        <button
          type="button"
          className={`annotator-tool ${tool === 'circle' ? 'is-active' : ''}`}
          onClick={() => setTool('circle')}
        >
          ○ Circle
        </button>
        <button
          type="button"
          className={`annotator-tool ${tool === 'star' ? 'is-active' : ''}`}
          onClick={() => setTool('star')}
        >
          ★ Star
        </button>
        <button type="button" className="annotator-tool" onClick={handleUndo} disabled={opsCount === 0}>
          Undo
        </button>
        <button type="button" className="annotator-done" onClick={handleDone}>
          Done
        </button>
      </div>
    </div>
  )
}
