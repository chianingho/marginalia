import { useEffect, useRef, useState } from 'react'

// 共用「一痕螢光筆貼著文字」量測邏輯：寬度依實際量到的文字寬度計算（不寫死），
// 兩處呼叫端共用同一份實作，只是各自套不同 class 決定顏色/位置/字體——
// 時間軸日期標頭（note-timeline-day-*）與詳情頁 p.{n}（note-detail-page-*）。
export default function HighlightLabel({ children, wrapClassName, highlightClassName, labelClassName }) {
  const labelRef = useRef(null)
  const [highlightWidth, setHighlightWidth] = useState(0)

  useEffect(() => {
    if (labelRef.current) {
      setHighlightWidth(labelRef.current.getBoundingClientRect().width)
    }
  }, [children])

  return (
    <span className={wrapClassName}>
      {highlightWidth > 0 && (
        <span className={highlightClassName} style={{ width: `${highlightWidth + 10}px` }} aria-hidden="true" />
      )}
      <span className={labelClassName} ref={labelRef}>
        {children}
      </span>
    </span>
  )
}
