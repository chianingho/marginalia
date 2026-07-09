import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Bookshelf from './pages/Bookshelf.jsx'
import BookNotes from './pages/BookNotes.jsx'
import ShelfDetail from './pages/ShelfDetail.jsx'
import AddBook from './pages/AddBook.jsx'
import { hasSupabaseConfig } from './lib/supabaseClient.js'

// 這幾個路由自己控制版面（白底、自帶 header），不套用全域 app-header 跟 app-main 的 padding
function isFlushRoute(pathname) {
  return pathname === '/' || pathname === '/add' || pathname.startsWith('/shelf/')
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
          <Route path="/books/:bookId" element={<BookNotes />} />
          <Route path="/shelf/:status" element={<ShelfDetail />} />
          <Route path="/add" element={<AddBook />} />
        </Routes>
      </main>
    </div>
  )
}
