import { useEffect, useRef, useState } from 'react'

// 開場動畫（四拍版，總長 1.2s）。跟 App.jsx 底下真正的路由內容一起掛載——
// children 從一開始就在 DOM 上（Bookshelf 的資料 useEffect 照樣立刻開始
// 撈），這裡的 overlay 只是蓋在最上面，動畫結束時淡出，露出已經在背後準備
// 好的首頁，達成「首頁淡入疊上」的效果，不用等 overlay 收掉才開始載入。
//
// 這是 app 內的入場動畫，跟 public/manifest 裡 PWA 靜態 splash 是兩回事，
// 不動 manifest。
const SPLASH_STORAGE_KEY = 'marginalia_splash_seen'
const FULL_DURATION_MS = 1200
const REDUCED_DURATION_MS = 300
const RETURNING_FADE_MS = 200

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function Splash({ children }) {
  const alreadySeenRef = useRef(localStorage.getItem(SPLASH_STORAGE_KEY) === '1')
  const reducedRef = useRef(prefersReducedMotion())
  const [visible, setVisible] = useState(!alreadySeenRef.current)

  useEffect(() => {
    if (!visible) return
    const duration = reducedRef.current ? REDUCED_DURATION_MS : FULL_DURATION_MS
    const timer = setTimeout(finish, duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function finish() {
    localStorage.setItem(SPLASH_STORAGE_KEY, '1')
    setVisible(false)
  }

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
          className={`splash-overlay ${reducedRef.current ? 'splash-overlay--reduced' : ''}`}
          onClick={finish}
          role="presentation"
        >
          <span className={`splash-wordmark ${reducedRef.current ? 'splash-wordmark--static' : ''}`}>
            Marginalia
            {!reducedRef.current && <span className="splash-sweep" aria-hidden="true" />}
          </span>
        </div>
      )}
    </>
  )
}
