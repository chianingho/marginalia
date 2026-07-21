import { useLayoutEffect, useRef, useState } from 'react'
import BirdDoodle from './BirdDoodle.jsx'

// 開場動畫：忠實移植 marginalia-splash-prototype.html 的視覺/時間軸/技術手法
// （打字機字標→手繪線畫出攤開的書→小鳥登場→眨一下眼→lockup 微縮+overlay
// 淡出）。時間常數、path 座標、CSS 數值都直接照抄原型，不是重新設計一版。
//
// children 從一開始就掛在 DOM 上（背後的 Bookshelf 資料照樣立刻開始撈），
// overlay 只是蓋在最上面，退場時淡出露出已經準備好的首頁——原型裡的
// #home 是純預覽用的假首頁，這裡不需要，也不接它的 fade-in class。
//
// 這是 app 內的入場動畫，跟 public/ 的 PWA manifest 靜態 splash 是兩回事，
// 不動 manifest。原型右下角「重播」鈕不進正式版。
const SPLASH_STORAGE_KEY = 'marginalia_splash_seen'
const WORD = 'Marginalia'

// 時間軸（相對於「開始打字」那一刻，即 fonts.ready 後再等 POST_FONTS_DELAY_MS）：
const TYPE_START_MS = 150
const TYPE_STEP_MS = 80
const TYPED_AT_MS = TYPE_START_MS + WORD.length * TYPE_STEP_MS // 950
const CARET_GONE_MS = TYPED_AT_MS + 120 // 1070：游標收掉，墨線開始畫
const STROKE_DONE_MS = CARET_GONE_MS + 700 // 1770（排程用的估計值，跟下面 CSS 的
// 0.68s transition 對不完全整，原型本身也是這樣抓，不用湊到剛好一致）
const BIRD_IN_MS = STROKE_DONE_MS + 40 // 1810
const EYE_WINK_MS = STROKE_DONE_MS + 280 // 2050
const FINISH_MS = STROKE_DONE_MS + 900 // 2670：觸發退場
const POST_FONTS_DELAY_MS = 120
const SETTLE_TO_FADE_GAP_MS = 250
const OVERLAY_FADE_MS = 450
const REDUCED_HOLD_MS = 600

// 攤開的書：單一連續路徑（左頁底線→升至書脊尖頂→右頁底線），對應
// .splash-stroke 的 viewBox「0 0 440 130」，座標照抄原型，不是重新設計。
const BOOK_PATH_D = `
  M 64 104
  C 120 98 168 100 200 104
  C 203 104 205 95 207 84
  C 211 64 215 58 220 58
  C 225 58 229 64 233 84
  C 235 95 237 104 240 104
  C 272 100 320 98 376 104`

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function BookLine({ drawing }) {
  const pathRef = useRef(null)
  const [length, setLength] = useState(0)

  useLayoutEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength())
  }, [])

  return (
    <path
      ref={pathRef}
      className="splash-book-line"
      filter="url(#splash-rough)"
      d={BOOK_PATH_D}
      style={{
        opacity: length ? 1 : 0,
        strokeDasharray: length,
        strokeDashoffset: drawing ? 0 : length,
      }}
    />
  )
}

export default function Splash({ children }) {
  const alreadySeenRef = useRef(localStorage.getItem(SPLASH_STORAGE_KEY) === '1')
  const reducedRef = useRef(prefersReducedMotion())
  const [visible, setVisible] = useState(!alreadySeenRef.current)

  const [typedCount, setTypedCount] = useState(0)
  const [caretPhase, setCaretPhase] = useState('blink') // blink | gone
  const [strokeDrawing, setStrokeDrawing] = useState(false)
  const [birdIn, setBirdIn] = useState(false)
  const [eyeWink, setEyeWink] = useState(false)
  const [settling, setSettling] = useState(false)
  const [fading, setFading] = useState(false)

  const timersRef = useRef([])
  const exitingRef = useRef(false)

  function schedule(fn, ms) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  function clearAllTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  // 退場：lockup 先縮（.settling），250ms 後 overlay 開始淡出（.fading），
  // 再等淡出跑完才真的把整個 overlay 從 DOM 上拿掉。自然播完、或
  // tap-to-skip，都是走這條同一個函式——原型的點擊處理也是直接呼叫
  // 跟自然結束同一個 finish()，不是另外做一個瞬間切換的分支。
  function beginExit() {
    if (exitingRef.current) return
    exitingRef.current = true
    clearAllTimers()
    localStorage.setItem(SPLASH_STORAGE_KEY, '1')
    setSettling(true)
    schedule(() => {
      setFading(true)
      schedule(() => setVisible(false), OVERLAY_FADE_MS)
    }, SETTLE_TO_FADE_GAP_MS)
  }

  useLayoutEffect(() => {
    if (!visible) return
    let cancelled = false

    function runFull() {
      setCaretPhase('blink')
      for (let i = 0; i < WORD.length; i += 1) {
        schedule(() => setTypedCount(i + 1), TYPE_START_MS + i * TYPE_STEP_MS)
      }
      schedule(() => {
        setCaretPhase('gone')
        setStrokeDrawing(true)
      }, CARET_GONE_MS)
      schedule(() => setBirdIn(true), BIRD_IN_MS)
      schedule(() => setEyeWink(true), EYE_WINK_MS)
      schedule(beginExit, FINISH_MS)
    }

    if (reducedRef.current) {
      // 跳過逐字與畫線動畫，直接顯示成品：字標全部可見、墨線全畫完、
      // 鳥在，眼睛不眨（不排 eye wink），短暫停留後進首頁。
      setTypedCount(WORD.length)
      setStrokeDrawing(true)
      setBirdIn(true)
      schedule(() => !cancelled && beginExit(), REDUCED_HOLD_MS)
    } else {
      // 啟動時機：等字體真的載入完成、再等 120ms 才開始打字，避免字寬跳動。
      const fontsReady = document.fonts?.ready ?? Promise.resolve()
      fontsReady.then(() => {
        if (cancelled) return
        schedule(() => !cancelled && runFull(), POST_FONTS_DELAY_MS)
      })
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useLayoutEffect(() => () => clearAllTimers(), [])

  // tap-to-skip：動畫期間點畫面任意處，走跟自然結束同一條退場路徑並寫 flag。
  function handleSkip() {
    beginExit()
  }

  const reduced = reducedRef.current

  return (
    <>
      <div
        className={alreadySeenRef.current ? 'app-enter-fade' : undefined}
        style={alreadySeenRef.current ? { animationDuration: '200ms' } : undefined}
      >
        {children}
      </div>

      {visible && (
        <div
          className={`splash-overlay ${fading ? 'splash-overlay--fading' : ''}`}
          onClick={handleSkip}
          role="presentation"
        >
          <div className={`splash-lockup ${settling ? 'splash-lockup--settling' : ''}`}>
            <div className="splash-word">
              {[...WORD].map((ch, i) => (
                <span key={i} className={`splash-ch ${i < typedCount ? 'splash-ch--on' : ''}`}>
                  {ch}
                </span>
              ))}
              {!reduced && (
                <span
                  className={`splash-caret ${caretPhase === 'blink' ? 'splash-caret--blink' : ''} ${
                    caretPhase === 'gone' ? 'splash-caret--gone' : ''
                  }`}
                />
              )}
            </div>

            <div className="splash-stroke-wrap">
              <svg className="splash-stroke" viewBox="0 0 440 130">
                <defs>
                  {/* 手繪抖動：讓墨線不是機械直線，跟小鳥共用同一顆 filter。 */}
                  <filter id="splash-rough" x="-20%" y="-20%" width="140%" height="140%">
                    <feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
                <BookLine drawing={strokeDrawing} />
              </svg>
            </div>

            <div className={`splash-bird ${birdIn ? 'splash-bird--in' : ''}`}>
              {/* BirdDoodle 的座標是原本 BrandBanner 440×218 viewBox 底下量出來的
                  本地座標（原生落在 x:371–410 / y:122–188 一帶），這裡直接裁一個
                  貼合鳥的 viewBox 視窗，不改路徑數字，維持跟首頁同一份資產。 */}
              <svg viewBox="368 118 46 74" filter="url(#splash-rough)">
                <BirdDoodle eyeClassName={`splash-eye ${eyeWink ? 'splash-eye--wink' : ''}`} />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
