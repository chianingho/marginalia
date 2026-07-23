import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// 未登入時的唯一畫面：不透出書櫃內容。單一按鈕觸發 Supabase Auth 的 Google
// OAuth（全頁導向 Google 再導回來，session 由 supabaseClient.js 的
// autoRefreshToken/detectSessionInUrl 預設行為自動接住，不用在這裡另外解析
// callback）。按鈕材質沿用全站 .btn-frosted（跟 Add Book/Save 同一份材質），
// 不自訂新樣式；.login-page/.login-card 只是版面置中用的殼層，顏色/字體
// 全部指到 tokens.css 既有變數。
export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // 成功時瀏覽器會整頁導去 Google，這裡不用再手動處理導頁。
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="app-name">Marginalia</p>
        <p className="app-subtitle">閱讀筆記</p>
        <button type="button" className="add-page-btn btn-frosted" onClick={handleLogin} disabled={loading}>
          {loading ? '連接中…' : '使用 Google 繼續'}
        </button>
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}
