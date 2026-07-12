import { useRef, useState, useEffect } from 'react'
import { useScrollLock } from '../lib/scrollLock.js'

// 截圖標注：純 canvas + pointer events，不引入任何繪圖套件。
// 唯一工具＝螢光筆，常駐啟用，沒有其他工具可切換；F-8 起筆色可從 4 顆色票切換。
// 非破壞性：進入時吃 initialStrokes（正規化 0-1 座標）重繪成起始狀態，Undo 是
// 逐筆退的「快照 stack」——每畫完一筆或按 Clear 都 push 一份完整 strokes 陣列快照，
// Undo 就是 pop 掉最上面那份，回到上一份快照（Clear 也能被 Undo 還原，因為 Clear
// 本質上只是 push 了一份 []）。完成（Done）時把目前畫面 flatten 匯出成一張新圖，
// 同時把目前的 strokes（正規化座標）一起回傳——呼叫端負責重新壓縮、存成顯示快取，
// 並把 strokes 寫回 note 記錄，原圖（imageUrl 對應的來源）完全不動。
const HIGHLIGHT_WIDTH_RATIO = 0.045 // 圖寬的 4.5%

const SWATCH_COLORS = ['#F2FF00', '#FF9EC4', '#7FD8FF', '#8CFF9E']
const DEFAULT_COLOR = SWATCH_COLORS[0]

// F-8（批次二未上）：色彩只在本次編輯 session 的記憶體中跟著每一筆走，用來讓
// 多色繪製/合成當下正確顯示；Done 匯出的 strokes 仍是舊格式（純座標陣列，無
// color 欄位），不擅自生出新的持久化 schema——欄位真正定案、寫回 note 記錄要
// 等批次二。所以「重新打開標注畫面」時，之前畫的筆畫一律吃不到色票資訊，
// 依規格 fallback 回黃色（見 normalizeInitialStrokes）。
function normalizeInitialStrokes(initialStrokes) {
  return initialStrokes.map((stroke) =>
    Array.isArray(stroke) ? { color: DEFAULT_COLOR, points: stroke } : stroke,
  )
}

// pixelPoints：畫布像素座標（不是正規化座標）
function drawStroke(ctx, pixelPoints, canvasWidth, color) {
  if (pixelPoints.length < 2) return
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(4, canvasWidth * HIGHLIGHT_WIDTH_RATIO)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y)
  for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y)
  ctx.stroke()
  ctx.restore()
}

// 進入時把 initialStrokes 逐筆疊成快照 stack：[[], [s1], [s1,s2], ...]，
// 這樣 Undo 才能把「先前儲存過的歷史筆畫」也一筆一筆退掉，不是只能整批退。
function buildInitialHistory(initialStrokes) {
  const history = [[]]
  for (let i = 0; i < initialStrokes.length; i++) {
    history.push(initialStrokes.slice(0, i + 1))
  }
  return history
}

function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7H15C18.3137 7 21 9.68629 21 13C21 16.3137 18.3137 19 15 19H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 3.5L7 7L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 7V4.5C9 4.22386 9.22386 4 9.5 4H14.5C14.7761 4 15 4.22386 15 4.5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7L7.8 19.2C7.83 19.66 8.21 20 8.67 20H15.33C15.79 20 16.17 19.66 16.2 19.2L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ImageAnnotator({ imageUrl, initialStrokes = [], onDone, onCancel }) {
  const canvasRef = useRef(null)
  const baseImageRef = useRef(null)
  const historyRef = useRef(buildInitialHistory(normalizeInitialStrokes(initialStrokes))) // 快照 stack；最上面一份 = 目前狀態
  const draftRef = useRef(null) // 正在畫的那一筆，像素座標
  const [strokeCount, setStrokeCount] = useState(historyRef.current[historyRef.current.length - 1].length)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR)

  function currentStrokes() {
    return historyRef.current[historyRef.current.length - 1]
  }

  function pushHistory(newStrokes) {
    historyRef.current.push(newStrokes)
    setStrokeCount(newStrokes.length)
    redraw()
  }

  useScrollLock()

  // 載入底圖（image_original），canvas 內部解析度對齊圖片原始像素尺寸
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
    for (const stroke of currentStrokes()) {
      const pixelPoints = stroke.points.map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height }))
      drawStroke(ctx, pixelPoints, canvas.width, stroke.color)
    }
    if (draftRef.current) drawStroke(ctx, draftRef.current.points, canvas.width, draftRef.current.color)
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
    draftRef.current = { color: selectedColor, points: [getCanvasPoint(e)] }
    canvasRef.current.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!draftRef.current) return
    e.preventDefault()
    draftRef.current.points.push(getCanvasPoint(e))
    redraw()
  }

  function handlePointerUp() {
    if (!draftRef.current) return
    const canvas = canvasRef.current
    const normalizedStroke = {
      color: draftRef.current.color,
      points: draftRef.current.points.map((p) => ({ x: p.x / canvas.width, y: p.y / canvas.height })),
    }
    draftRef.current = null
    pushHistory([...currentStrokes(), normalizedStroke])
  }

  function handleUndo() {
    if (historyRef.current.length <= 1) return
    historyRef.current.pop()
    const strokes = currentStrokes()
    setStrokeCount(strokes.length)
    redraw()
  }

  // Clear：一鍵清空，計入 undo stack（push 一份空陣列），按 Undo 可還原。
  // 已知限制（批次二完成前不處理）：Clear 清的是目前快照的「全部」筆畫，
  // 不會特別區分哪些是這次進來才畫的、哪些是之前存檔就有的——維持既有行為不動。
  function handleClear() {
    if (currentStrokes().length === 0) return
    pushHistory([])
  }

  // Cancel：不加確認，直接捨棄本次進入後的所有變動、離開（不合成、不存檔）
  function handleExit() {
    onCancel()
  }

  function handleDone() {
    const strokes = currentStrokes().map((stroke) => stroke.points)
    canvasRef.current.toBlob((blob) => {
      if (blob) onDone(blob, strokes)
    }, 'image/png')
  }

  return (
    // stopPropagation：這顆元件常被掛在別的 modal 內部（React tree 上是子節點，
    // 即使視覺上用 position:fixed 蓋在最上層），不擋住點擊事件會直接冒泡到
    // 外層 modal 的 backdrop onClick，把整個 modal 一起關掉。
    <div className="annotator-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="annotator-header">
        <button type="button" className="annotator-cancel" onClick={handleExit}>
          Cancel
        </button>
        <div className="annotator-spacer" />
        <button type="button" className="annotator-done" onClick={handleDone}>
          Done
        </button>
      </div>

      <div className="annotator-toolbar">
        <div className="annotator-swatches">
          {SWATCH_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`annotator-swatch ${selectedColor === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`螢光筆顏色 ${color}`}
              aria-pressed={selectedColor === color}
            />
          ))}
        </div>
        <button
          type="button"
          className="annotator-undo"
          onClick={handleUndo}
          disabled={historyRef.current.length <= 1}
          aria-label="Undo"
        >
          <UndoIcon />
        </button>
        <button type="button" className="annotator-clear" onClick={handleClear} disabled={strokeCount === 0} aria-label="Clear">
          <ClearIcon />
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
