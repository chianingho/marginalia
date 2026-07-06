import { Routes, Route, Link } from 'react-router-dom'
import Bookshelf from './pages/Bookshelf.jsx'
import BookNotes from './pages/BookNotes.jsx'
import { hasSupabaseConfig } from './lib/supabaseClient.js'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-title">
          <span className="app-name">Marginalia</span>
          <span className="app-subtitle">閱讀筆記</span>
        </Link>
      </header>

      {!hasSupabaseConfig && (
        <div className="local-mode-banner">
          目前以「本機預覽模式」執行：資料暫存在這個瀏覽器的 localStorage，重灌瀏覽器或清除快取會消失。
          設定好 Supabase 並填入 <code>.env.local</code> 後即可自動切回雲端儲存。
        </div>
      )}

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Bookshelf />} />
          <Route path="/books/:bookId" element={<BookNotes />} />
        </Routes>
      </main>
    </div>
  )
}
