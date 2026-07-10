import { Routes, Route, Link, Navigate, useLocation, useParams } from 'react-router-dom'
import Bookshelf from './pages/Bookshelf.jsx'
import BookDetail from './pages/BookDetail.jsx'
import ShelfDetail from './pages/ShelfDetail.jsx'
import { hasSupabaseConfig } from './lib/supabaseClient.js'

// 這幾個路由自己控制版面（白底、自帶 header），不套用全域 app-header 跟 app-main 的 padding
function isFlushRoute(pathname) {
  return pathname === '/' || pathname.startsWith('/shelf/') || pathname.startsWith('/book/')
}

// 舊版路由 /books/:bookId 殘留連結導去新路由 /book/:id
function LegacyBookRedirect() {
  const { bookId } = useParams()
  return <Navigate to={`/book/${bookId}`} replace />
}

export default function App() {
  const location = useLocation()
  const isFlush = isFlushRoute(location.pathname)

  return (
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
          <Route path="/books/:bookId" element={<LegacyBookRedirect />} />
          <Route path="/shelf/:groupBy/:slug" element={<ShelfDetail />} />
          {/* 舊版單段狀態制路由（/shelf/:status）殘留連結一律導回首頁 */}
          <Route path="/shelf/:status" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
