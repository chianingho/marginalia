import { useLayoutEffect, useRef, useState } from 'react'
import BirdDoodle from './BirdDoodle.jsx'

// 開場動畫：忠實移植 marginalia-splash-prototype.html 的視覺/時間軸/技術手法
// （打字機字標→手繪線畫出攤開的書→小鳥登場→眨一下眼→lockup 微縮+overlay
// 淡出）。時間常數、path 座標、CSS 數值都直接照抄原型，不是重新設計一版。
//
// 登入體驗批次（2026-07-23）第 4 節：這支動畫現在兼作 session 判定遮罩。
// ready prop（App.jsx 傳入）代表「最終要進登入頁還是書櫃已經確定」——動畫
// 本身照原本時間軸播完（timelineFinished），但真正觸發退場（beginExit）
// 一定要等 ready 也為 true 才會發生：動畫先跑完、ready 還沒到 → 停在最後
// 一格等；ready 先到、動畫還沒跑完 → 還是等動畫播完。children 從一開始就
// 掛在 DOM 上（原本設計），ready 為 false 期間 App.jsx 傳進來的 children
// 是 null，反正遮罩不透明，這段沒東西可看也沒關係。
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
const FINISH_MS = STROKE_DONE_MS + 900 // 2670：動畫時間軸跑完（不代表一定退場，見 ready 邏輯）
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

export default function Splash({ children, ready }) {
  const alreadySeenRef = useRef(localStorage.getItem(SPLASH_STORAGE_KEY) === '1')
  const reducedRef = useRef(prefersReducedMotion())
  const [visible, setVisible] = useState(true)

  const [typedCount, setTypedCount] = useState(0)
  const [caretPhase, setCaretPhase] = useState('blink') // blink | gone
  const [caretLeft, setCaretLeft] = useState(0)
  const wordRef = useRef(null)
  const charRefs = useRef([])
  const [strokeDrawing, setStrokeDrawing] = useState(false)
  const [birdIn, setBirdIn] = useState(false)
  const [eyeWink, setEyeWink] = useState(false)
  const [settling, setSettling] = useState(false)
  const [fading, setFading] = useState(false)

  const timersRef = useRef([])
  const exitingRef = useRef(false)
  const readyRef = useRef(ready)
  const timelineDoneRef = useRef(false)

  // 游標要跟著打字進度走，不能固定釘在最後一格：字母 span 從一開始就全部
  // 掛在 DOM 上（只是 opacity 淡入，避免整行寬度隨打字跳動），所以游標的
  // 水平位置得靠量測「目前已顯示的最後一個字母」的右緣，不能單純疊在
  // flex 排列的最後一個 DOM 節點後面（那會永遠停在整個字打完的位置）。
  useLayoutEffect(() => {
    if (typedCount === 0 || !wordRef.current) return
    const lastChar = charRefs.current[typedCount - 1]
    if (!lastChar) return
    const wordRect = wordRef.current.getBoundingClientRect()
    const charRect = lastChar.getBoundingClientRect()
    setCaretLeft(charRect.right - wordRect.left)
  }, [typedCount])

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
  // tap-to-skip，都是走這條同一個函式。
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

  // 動畫時間軸本身跑完，只代表「可以退場了」，真正退不退還要看 ready。
  function timelineFinished() {
    timelineDoneRef.current = true
    if (readyRef.current) beginExit()
  }

  // ready 是外部（session 判定）變化，不是動畫自己的節奏——用 effect 盯著它，
  // 一旦動畫也跑完了（timelineDoneRef）且還沒開始退場，這裡才補一腳觸發。
  useLayoutEffect(() => {
    readyRef.current = ready
    if (ready && timelineDoneRef.current && !exitingRef.current) {
      beginExit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  useLayoutEffect(() => {
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
      schedule(() => !cancelled && timelineFinished(), FINISH_MS)
    }

    if (alreadySeenRef.current) {
      // 已經看過完整開場：不重播打字機/畫線/小鳥，遮罩本身還是會蓋著（見
      // render），只是內容是空的，純粹等 ready 就放行——這是「已有 session」
      // 那條路徑真正在做的事：遮罩同時等 session 判定，不是重播一次全套動畫。
      timelineFinished()
      return () => {
        cancelled = true
      }
    }

    if (reducedRef.current) {
      // 跳過逐字與畫線動畫，直接顯示成品：字標全部可見、墨線全畫完、
      // 鳥在，眼睛不眨（不排 eye wink），短暫停留後準備退場（仍要等 ready）。
      setTypedCount(WORD.length)
      setStrokeDrawing(true)
      setBirdIn(true)
      schedule(() => !cancelled && timelineFinished(), REDUCED_HOLD_MS)
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
  }, [])

  useLayoutEffect(() => () => clearAllTimers(), [])

  // tap-to-skip：只提前結束「動畫本身」，ready 沒到一樣不會真的放行——避免
  // 使用者手癢點擊跳過，搶在 session 判定完成前看到還沒決定好的畫面。
  function handleSkip() {
    timelineFinished()
  }

  const reduced = reducedRef.current
  const showFullAnimation = !alreadySeenRef.current

  return (
    <>
      <div>{children}</div>

      {visible && (
        <div
          className={`splash-overlay ${fading ? 'splash-overlay--fading' : ''}`}
          onClick={handleSkip}
          role="presentation"
        >
          {showFullAnimation ? (
            <div className={`splash-lockup ${settling ? 'splash-lockup--settling' : ''}`}>
              <div className="splash-word" ref={wordRef}>
                {[...WORD].map((ch, i) => (
                  <span
                    key={i}
                    ref={(el) => (charRefs.current[i] = el)}
                    className={`splash-ch ${i < typedCount ? 'splash-ch--on' : ''}`}
                  >
                    {ch}
                  </span>
                ))}
                {!reduced && (
                  <span
                    className={`splash-caret ${caretPhase === 'blink' ? 'splash-caret--blink' : ''} ${
                      caretPhase === 'gone' ? 'splash-caret--gone' : ''
                    }`}
                    style={{ left: `calc(${caretLeft}px + 0.04em)` }}
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
          ) : (
            // 已看過完整開場：遮罩只留純底色（跟 .splash-overlay 背景同色），
            // 不重播內容，純粹當 session 判定期間的暫時遮蓋。
            <div className={`splash-lockup ${settling ? 'splash-lockup--settling' : ''}`} />
          )}
        </div>
      )}
    </>
  )
}
