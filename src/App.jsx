import { Routes, Route, Link, Navigate, useLocation, useParams } from 'react-router-dom'
import Bookshelf from './pages/Bookshelf.jsx'
import BookDetail from './pages/BookDetail.jsx'
import NoteDetail from './pages/NoteDetail.jsx'
import Login from './pages/Login.jsx'
import Splash from './components/Splash.jsx'
import { hasSupabaseConfig } from './lib/supabaseClient.js'
import { useAuthSession } from './lib/useAuthSession.js'

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

  // 有設定 Supabase env 才需要登入：初次判斷 session 前先不畫任何畫面，避免先
  // 閃一下書櫃（或登入頁）才又切換。沒有 env（本機預覽模式）完全不受影響，
  // loading 一開始就是 false，直接照舊流程進 app。
  if (hasSupabaseConfig && loading) return null

  if (hasSupabaseConfig && !session) return <Login />

  return (
    <Splash>
      <div className="app">
        {!isFlush && (
          <header className="app-header">
            <Link to="/" className="app-title">
              <span className="app-name">Marginalia</span>
              <span className="app-subtitle">閱讀筆記</span>
            </Link>
          </header>
        )}

        {!isFlush && !hasSupabaseConfig && (
          <div className="local-mode-banner">
            目前以「本機預覽模式」執行：資料暫存在這個瀏覽器的 localStorage，重灌瀏覽器或清除快取會消失。
            設定好 Supabase 並填入 <code>.env.local</code> 後即可自動切回雲端儲存。
          </div>
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
    </Splash>
  )
}
