import { useLayoutEffect, useRef, useState } from 'react'
import BirdDoodle from './BirdDoodle.jsx'

// 開場動畫改版（總長約 2.7s）：取代舊的四拍版（淡入字標→螢光筆掃過→縮小淡出），
// 整支重寫。序列：打字「Marginalia」→ 墨綠手繪線畫出攤開的書 → 小鳥從書右端
// 淡入+微彈 → 眨一下眼 → lockup 微縮淡出、首頁疊上。
//
// children 從一開始就掛在 DOM 上（背後的 Bookshelf 資料照樣立刻開始撈），
// overlay 只是蓋在最上面，退場時淡出露出已經準備好的首頁。
//
// 這是 app 內的入場動畫，跟 public/ 的 PWA manifest 靜態 splash 是兩回事，
// 不動 manifest。
const SPLASH_STORAGE_KEY = 'marginalia_splash_seen'
const WORD = 'Marginalia'

const TYPE_CHAR_MS = 80
const TYPE_TOTAL_MS = WORD.length * TYPE_CHAR_MS // 800ms
const DRAW_MS = 700
const BIRD_MS = 350
const BLINK_GAP_MS = 100
const BLINK_MS = 250
const EXIT_MS = 500
const REDUCED_HOLD_MS = 400
const RETURNING_FADE_MS = 200

// 書攤開的手繪輪廓：單一連續路徑（起點左下角，經左頁弧線、書脊中央凹陷、
// 右頁弧線，到右下角收尾），不是三段拆開的 path，stroke-dashoffset 才能
// 一筆畫出來。座標對應下面 .splash-stage 的 viewBox。
const BOOK_PATH_D =
  'M60,132 C68,96 90,84 105,92 C120,100 128,116 134,132 C140,116 150,102 165,94 C182,85 202,96 208,128'

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function BookLine({ animate }) {
  const pathRef = useRef(null)
  const [length, setLength] = useState(0)
  const [drawn, setDrawn] = useState(!animate)

  useLayoutEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength())
  }, [])

  useLayoutEffect(() => {
    if (!animate || !length) return
    // 下一幀才把 drawn 打開，確保瀏覽器先畫過一次「未畫」狀態（dashoffset=length），
    // stroke-dashoffset 的 transition 才有起點可以動，不會直接跳到終點。
    const frame = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(frame)
  }, [animate, length])

  return (
    <path
      ref={pathRef}
      className="splash-book-line"
      d={BOOK_PATH_D}
      style={{
        opacity: length ? 1 : 0,
        strokeDasharray: length,
        strokeDashoffset: drawn ? 0 : length,
        transitionDuration: `${DRAW_MS}ms`,
      }}
    />
  )
}

export default function Splash({ children }) {
  const alreadySeenRef = useRef(localStorage.getItem(SPLASH_STORAGE_KEY) === '1')
  const reducedRef = useRef(prefersReducedMotion())
  const [visible, setVisible] = useState(!alreadySeenRef.current)
  // phase: waiting | typing | drawing | bird | blink | exiting | static
  const [phase, setPhase] = useState('waiting')
  const [typedCount, setTypedCount] = useState(0)
  const finishedRef = useRef(false)

  useLayoutEffect(() => {
    if (!visible) return

    let cancelled = false
    const timers = []
    const schedule = (fn, ms) => {
      timers.push(setTimeout(() => !cancelled && fn(), ms))
    }

    function runReducedSequence() {
      setPhase('static')
      setTypedCount(WORD.length)
      schedule(finish, REDUCED_HOLD_MS)
    }

    function runFullSequence() {
      setPhase('typing')
      let count = 0
      const typeInterval = setInterval(() => {
        count += 1
        setTypedCount(count)
        if (count >= WORD.length) {
          clearInterval(typeInterval)
          setPhase('drawing')
          schedule(() => setPhase('bird'), DRAW_MS)
          schedule(() => setPhase('blink'), DRAW_MS + BIRD_MS + BLINK_GAP_MS)
          schedule(() => setPhase('exiting'), DRAW_MS + BIRD_MS + BLINK_GAP_MS + BLINK_MS)
          schedule(finish, DRAW_MS + BIRD_MS + BLINK_GAP_MS + BLINK_MS + EXIT_MS)
        }
      }, TYPE_CHAR_MS)
      timers.push(typeInterval)
    }

    // 啟動時機：等字體真的載入完成再跑，Cormorant 沒到位前先不打字，
    // 避免字寬跳動。沒有 document.fonts API 的舊瀏覽器直接開始，不卡住。
    const fontsReady = document.fonts?.ready
    if (reducedRef.current) {
      runReducedSequence()
    } else if (fontsReady) {
      fontsReady.then(() => !cancelled && runFullSequence())
    } else {
      runFullSequence()
    }

    return () => {
      cancelled = true
      timers.forEach((t) => clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true
    localStorage.setItem(SPLASH_STORAGE_KEY, '1')
    setVisible(false)
  }

  // tap-to-skip：動畫期間點畫面任意處，立即跳到首頁（不等退場動畫播完）。
  function handleSkip() {
    finish()
  }

  const reduced = reducedRef.current
  const showCursor = phase === 'typing' && typedCount < WORD.length
  const eyeClassName = phase === 'blink' ? 'splash-eye splash-eye--blink' : 'splash-eye'
  const birdVisiblePhase = ['bird', 'blink', 'exiting'].includes(phase) || reduced
  const bookAnimating = !reduced

  return (
    <>
      <div
        className={alreadySeenRef.current ? 'app-enter-fade' : undefined}
        style={alreadySeenRef.current ? { animationDuration: `${RETURNING_FADE_MS}ms` } : undefined}
      >
        {children}
      </div>

      {visible && (
        <div
          className={`splash-overlay ${phase === 'exiting' ? 'splash-overlay--exiting' : ''}`}
          style={phase === 'exiting' ? { transitionDuration: `${EXIT_MS}ms` } : undefined}
          onClick={handleSkip}
          role="presentation"
        >
          <svg
            className={`splash-lockup ${phase === 'exiting' ? 'splash-lockup--exiting' : ''}`}
            style={phase === 'exiting' ? { transitionDuration: `${EXIT_MS}ms` } : undefined}
            viewBox="0 0 360 220"
            role="img"
            aria-label="Marginalia"
          >
            <text className="splash-wordmark-text" x="40" y="82" textAnchor="start">
              <tspan>{WORD.slice(0, typedCount)}</tspan>
              {showCursor && (
                <tspan className="splash-cursor" dx="2">
                  |
                </tspan>
              )}
            </text>

            <BookLine animate={bookAnimating} />

            {/* 外層 <g> 只負責用 SVG transform 屬性把鳥定位到書右端＋轉向；
                CSS transform（pop 進場動畫的 scale）套在內層另一個 <g>，
                兩者不能疊在同一個節點——CSS transform 會直接蓋掉 SVG
                transform 屬性，疊在一起會讓鳥在動畫當下瞬移回原點。 */}
            <g transform="translate(-155,-42) rotate(-8 395 170)">
              <g className={`splash-bird ${birdVisiblePhase ? 'splash-bird--in' : ''}`}>
                <BirdDoodle eyeClassName={eyeClassName} />
              </g>
            </g>
          </svg>
        </div>
      )}
    </>
  )
}
