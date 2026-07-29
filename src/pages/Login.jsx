import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useLocale } from '../i18n/i18n'

// 登入體驗批次（2026-07-23）第 2 節：登入頁改版。
// 未登入時的唯一畫面：不透出書櫃內容。onGuest 是訪客模式的入口（第 3 節），
// 由 App.jsx 傳入——實際的旗標讀寫在 lib/guestMode.js，這裡只負責觸發。
//
// Google OAuth 觸發後是全頁導向，session 由 supabaseClient.js 的
// autoRefreshToken/detectSessionInUrl 預設行為自動接住，這裡不用另外解析
// callback。
export default function Login({ onGuest }) {
  const { t } = useLocale()
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
        <p className="login-wordmark">Marginalia</p>
        <p className="login-subtitle">{t('login.tagline')}</p>

        <div className="login-cta-block">
          <button type="button" className="login-google-btn" onClick={handleLogin} disabled={loading}>
            <span className="login-google-icon">
              <img src="/google-color.svg" alt="" width="16" height="16" />
            </span>
            {loading ? t('login.connecting') : t('login.google')}
          </button>
          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="login-divider">
          <span className="login-divider-line" />
          <p className="login-divider-label">{t('login.or')}</p>
          <span className="login-divider-line" />
        </div>

        <button type="button" className="login-guest-btn" onClick={onGuest}>
          {t('login.guest')}
        </button>
        <p className="login-guest-warning">
          {t('login.guestWarning')}
        </p>
      </div>
    </div>
  )
}
