import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useParams } from 'react-router-dom'
import Bookshelf from './pages/Bookshelf.jsx'
import BookDetail from './pages/BookDetail.jsx'
import NoteDetail from './pages/NoteDetail.jsx'
import Login from './pages/Login.jsx'
import Splash from './components/Splash.jsx'
import { hasSupabaseConfig } from './lib/supabaseClient.js'
import { useAuthSession } from './lib/useAuthSession.js'
import { isGuestMode, enterGuestMode, exitGuestMode } from './lib/guestMode.js'
import { useLocale } from './i18n/i18n'

// 這幾個路由自己控制版面（白底、自帶 header），不套用全域 app-header 跟 app-main 的 padding
function isFlushRoute(pathname) {
  return pathname === '/' || pathname.startsWith('/shelf/') || pathname.startsWith('/book/') || pathname.startsWith('/note/')
}

// 舊版路由 /books/:bookId 殘留連結導去新路由 /book/:id
function LegacyBookRedirect() {
  const { bookId } = useParams()
  return <Navigate to={`/book/${bookId}`} replace />
}

export default function App() {
  const location = useLocation()
  const isFlush = isFlushRoute(location.pathname)
  const { session, loading } = useAuthSession()
  const { t } = useLocale()
  const [guestMode, setGuestMode] = useState(() => isGuestMode())
  // 訪客是點擊觸發的進站（不像 OAuth 那樣整頁重新導向），Splash 不會自動重新
  // 掛載——用 key 強制在這個時間點重新掛載一次 Splash，讓開場動畫在「登入頁
  // → 點 Continue as guest → 書櫃」這條路徑上也會播一次（登入體驗批次第 4 節）。
  const [splashKey, setSplashKey] = useState(0)

  // 訪客中途登入成功後，guest 旗標要跟著清掉——資料本身不動（獨立命名空間留著
  // 當無害殘留），只是不讓這個旗標繼續代表「目前是訪客」，避免之後單純登出時
  // 被誤判成訪客而略過登入頁。
  useEffect(() => {
    if (session) {
      exitGuestMode()
      setGuestMode(false)
    }
  }, [session])

  useEffect(() => {
    document.title = t('common.appDocTitle')
  }, [t])

  function handleGuest() {
    enterGuestMode()
    setGuestMode(true)
    setSplashKey((k) => k + 1)
  }

  // ready：登入頁還是書櫃已經確定了沒有。沒設定 Supabase env（本機預覽模式）
  // 完全不受影響，永遠是 true，直接照舊流程進 app。
  const ready = !hasSupabaseConfig || !loading
  const needsLogin = hasSupabaseConfig && !session && !guestMode

  // ready 為 false 時 content 是 null——Splash 的遮罩本來就不透明，這段沒東西
  // 可看也沒關係（見 Splash.jsx 註解）。決定要顯示登入頁還是書櫃都在遮罩底下
  // 完成，使用者看不到「先畫登入頁再跳走」這種中途換畫面的閃爍。
  const content = !ready ? null : needsLogin ? (
    <Login onGuest={handleGuest} />
  ) : (
    <div className="app">
      {!isFlush && (
        <header className="app-header">
          <Link to="/" className="app-title">
            <span className="app-name">Marginalia</span>
            <span className="app-subtitle">{t('common.subtitle')}</span>
          </Link>
        </header>
      )}

      <main className={`app-main ${isFlush ? 'app-main--flush' : ''}`}>
        <Routes>
          <Route path="/" element={<Bookshelf />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/note/:id" element={<NoteDetail />} />
          <Route path="/books/:bookId" element={<LegacyBookRedirect />} />
          {/* 增補項 8：Year/Category 分組 + 「所有書籍」都是首頁 chips 接管的視圖，
              不是獨立頁面——這幾個路由只是讓深連結/分享網址能還原對應狀態，
              實際渲染的仍是 Bookshelf（見該檔的 useParams 初始化邏輯）。
              See All 頁自此只服務 Status 模式。 */}
          <Route path="/shelf/all" element={<Bookshelf />} />
          <Route path="/shelf/year/:slug" element={<Bookshelf />} />
          <Route path="/shelf/category/:slug" element={<Bookshelf />} />
          {/* Patch 02 P2-3：See all 詳細頁（ShelfDetail）移除，沒有入口了，
              舊連結（含更早的單段 /shelf/:status）一律導回首頁。 */}
          <Route path="/shelf/status/:slug" element={<Navigate to="/" replace />} />
          <Route path="/shelf/:status" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )

  return (
    <Splash key={splashKey} ready={ready}>
      {content}
    </Splash>
  )
}
