import { useEffect, useRef, useState } from 'react'

// True Marker 風格標題 lockup：Marginalia / Books / 螢光筆刷束 / 維度小字全部畫在同一顆
// inline SVG 裡（viewBox + width:100%，整組隨螢幕寬度等比縮放）。
//
// 對齊靠「墨緣對齊」而不是硬座標：等 document.fonts.ready 之後量測 Books 的 getBBox()，
// 用 translate 把 Marginalia 的左緣、維度小字的右緣分別黏到 Books 的左緣／右緣，
// 補償不同字體 side bearing 造成的視覺誤差。

const THICK_STROKES = [
  { points: '52,128 110,123 180,126 250,124 328,127 328,137 250,140 180,136 110,139 52,134' },
  { points: '50,146 120,142 200,145 270,143 330,147 330,154 270,158 200,153 120,156 50,151' },
  { points: '56,164 130,159 210,162 280,160 322,164 322,172 280,176 210,171 130,174 56,169' },
]

const FIBER_LINES = [
  { x1: 60, y1: 126, x2: 200, y2: 129, opacity: 0.8, width: 1.5 },
  { x1: 150, y1: 131, x2: 320, y2: 127, opacity: 0.6, width: 1 },
  { x1: 90, y1: 134, x2: 260, y2: 132, opacity: 0.9, width: 1.5 },
  { x1: 200, y1: 124, x2: 330, y2: 130, opacity: 0.55, width: 1 },
  { x1: 70, y1: 148, x2: 220, y2: 145, opacity: 0.85, width: 1.5 },
  { x1: 180, y1: 152, x2: 325, y2: 149, opacity: 0.65, width: 1 },
  { x1: 100, y1: 143, x2: 280, y2: 147, opacity: 0.95, width: 1.5 },
  { x1: 50, y1: 150, x2: 160, y2: 153, opacity: 0.6, width: 1 },
  { x1: 65, y1: 166, x2: 210, y2: 163, opacity: 0.75, width: 1.5 },
  { x1: 150, y1: 170, x2: 310, y2: 167, opacity: 0.6, width: 1 },
  { x1: 90, y1: 161, x2: 240, y2: 165, opacity: 0.9, width: 2 },
  { x1: 200, y1: 168, x2: 320, y2: 171, opacity: 0.55, width: 1 },
]

const THIN_STROKES = [
  // 斷筆：中間空 18px（194→212）
  { x1: 62, y1: 140, x2: 194, y2: 139, opacity: 0.68, width: 2.5 },
  { x1: 212, y1: 140, x2: 324, y2: 141, opacity: 0.68, width: 2.5 },
  { x1: 58, y1: 157, x2: 326, y2: 158, opacity: 0.6, width: 2 },
]

const DRY_PATCHES = [
  { x: 140, y: 122, width: 104, height: 16, opacity: 0.45 },
  { x: 244, y: 142, width: 62, height: 12, opacity: 0.5 },
  { x: 70, y: 159, width: 52, height: 13, opacity: 0.4 },
  { x: 292, y: 122, width: 36, height: 50, opacity: 0.3 }, // 右端收筆漸乾
]

export default function TitleLockup({ subtitle }) {
  const marginaliaRef = useRef(null)
  const booksRef = useRef(null)
  const categoryRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled) return

      const booksEl = booksRef.current
      const margEl = marginaliaRef.current
      if (!booksEl || !margEl) return

      const booksBox = booksEl.getBBox()
      const margBox = margEl.getBBox()
      margEl.setAttribute('transform', `translate(${booksBox.x - margBox.x}, 0)`)

      const catEl = categoryRef.current
      if (catEl) {
        const catBox = catEl.getBBox()
        const dx = booksBox.x + booksBox.width - (catBox.x + catBox.width)
        catEl.setAttribute('transform', `translate(${dx}, 0)`)
      }

      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [subtitle])

  return (
    <svg
      className="bookshelf-lockup"
      viewBox="0 0 380 205"
      style={{ overflow: 'visible' }}
      role="img"
      aria-label={subtitle ? `Marginalia Books ${subtitle}` : 'Marginalia Books'}
    >
      <defs>
        <filter id="marker-wobble" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="marker-dry" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.5" numOctaves="3" seed="17" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="marker-ink" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <text
        ref={marginaliaRef}
        x="70"
        y="56"
        fontFamily="'Oswald', 'Arial Narrow', sans-serif"
        fontWeight="200"
        fontSize="21"
        letterSpacing="5"
        fill="#000"
        opacity={ready ? 1 : 0}
      >
        Marginalia
      </text>

      <text
        ref={booksRef}
        x="70"
        y="130"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="800"
        fontSize="90"
        letterSpacing="-6"
        textLength="240"
        lengthAdjust="spacingAndGlyphs"
        fill="#000"
        filter="url(#marker-ink)"
      >
        Books
      </text>

      {subtitle && (
        <text
          ref={categoryRef}
          x="326"
          y="176"
          textAnchor="end"
          fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontWeight="800"
          fontSize="21"
          letterSpacing="-0.5"
          fill="#000"
          filter="url(#marker-ink)"
          opacity={ready ? 1 : 0}
        >
          {subtitle}
        </text>
      )}

      {/* 螢光黃纖維筆刷束：整組包在 multiply 群組內，畫在三行文字之後（DOM 順序在後 = 疊在上面），
          讓黑字透出「被劃過」的痕跡；沒水乾段的背景色 patch 也在同一個 multiply 群組內，
          否則會直接把底下的黑字擦掉，而不是只讓黃色變淡。 */}
      <g style={{ mixBlendMode: 'multiply' }}>
        <g filter="url(#marker-wobble)">
          {THICK_STROKES.map((s, i) => (
            <polygon key={`thick-${i}`} points={s.points} fill="#F2FF00" opacity="0.5" />
          ))}
          {FIBER_LINES.map((l, i) => (
            <line
              key={`fiber-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#F2FF00"
              strokeWidth={l.width}
              strokeLinecap="round"
              opacity={l.opacity}
            />
          ))}
          {THIN_STROKES.map((l, i) => (
            <line
              key={`thin-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#F2FF00"
              strokeWidth={l.width}
              strokeLinecap="round"
              opacity={l.opacity}
            />
          ))}
        </g>
        <g filter="url(#marker-dry)">
          {DRY_PATCHES.map((p, i) => (
            <rect key={`dry-${i}`} x={p.x} y={p.y} width={p.width} height={p.height} fill="#FDFCFA" opacity={p.opacity} />
          ))}
        </g>
      </g>
    </svg>
  )
}
