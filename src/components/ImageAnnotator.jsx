import { useEffect, useRef, useState } from 'react'

// 截圖標注：純 canvas + pointer events，不引入任何繪圖套件。
// 唯一工具＝螢光筆，常駐啟用，沒有其他工具可切換。
// 非破壞性：進入時吃 initialStrokes（正規化 0-1 座標）重繪成起始狀態，Undo 是
// 逐筆退的「快照 stack」——每畫完一筆或按 Clear 都 push 一份完整 strokes 陣列快照，
// Undo 就是 pop 掉最上面那份，回到上一份快照（Clear 也能被 Undo 還原，因為 Clear
// 本質上只是 push 了一份 []）。完成（Done）時把目前畫面 flatten 匯出成一張新圖，
// 同時把目前的 strokes（正規化座標）一起回傳——呼叫端負責重新壓縮、存成顯示快取，
// 並把 strokes 寫回 note 記錄，原圖（imageUrl 對應的來源）完全不動。
const HIGHLIGHT_COLOR = '#F2FF00' // 全站共用值，跟首頁/書架頁書名刷色同一個常數
const HIGHLIGHT_WIDTH_RATIO = 0.045 // 圖寬的 4.5%

// pixelPoints：畫布像素座標（不是正規化座標）
function drawStroke(ctx, pixelPoints, canvasWidth) {
  if (pixelPoints.length < 2) return
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.strokeStyle = HIGHLIGHT_COLOR
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

export default function ImageAnnotator({ imageUrl, initialStrokes = [], onDone, onCancel }) {
  const canvasRef = useRef(null)
  const baseImageRef = useRef(null)
  const historyRef = useRef(buildInitialHistory(initialStrokes)) // 快照 stack；最上面一份 = 目前狀態
  const draftRef = useRef(null) // 正在畫的那一筆，像素座標
  const [strokeCount, setStrokeCount] = useState(historyRef.current[historyRef.current.length - 1].length)

  function currentStrokes() {
    return historyRef.current[historyRef.current.length - 1]
  }

  function pushHistory(newStrokes) {
    historyRef.current.push(newStrokes)
    setStrokeCount(newStrokes.length)
    redraw()
  }

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
    for (const normPoints of currentStrokes()) {
      const pixelPoints = normPoints.map((p) => ({ x: p.x * canvas.width, y: p.y * canvas.height }))
      drawStroke(ctx, pixelPoints, canvas.width)
    }
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
    const canvas = canvasRef.current
    const normalizedStroke = draftRef.current.map((p) => ({ x: p.x / canvas.width, y: p.y / canvas.height }))
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

  // Clear：一鍵清空，計入 undo stack（push 一份空陣列），按 Undo 可還原
  function handleClear() {
    if (currentStrokes().length === 0) return
    pushHistory([])
  }

  // X：不加確認，直接捨棄本次進入後的所有變動、離開（不合成、不存檔）
  function handleExit() {
    onCancel()
  }

  function handleDone() {
    const strokes = currentStrokes()
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
        <button type="button" className="annotator-exit" onClick={handleExit} aria-label="Exit">
          ✕
        </button>
        <span className="annotator-tool-indicator">✎ Highlighter</span>
        <div className="annotator-spacer" />
        <button type="button" className="annotator-clear" onClick={handleClear} disabled={strokeCount === 0}>
          Clear
        </button>
        <button type="button" className="annotator-undo" onClick={handleUndo} disabled={historyRef.current.length <= 1}>
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
