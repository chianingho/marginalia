import { useEffect, useRef, useState } from 'react'
import { supabase, isExternalUrl } from '../lib/supabaseClient.js'
import { useLocale } from '../i18n/i18n'

// 登入體驗批次（2026-07-23）第 5 節：頭像 + 登出下拉。
// sizeRefTarget 是書櫃頁相鄰 .pill-btn 的 ref——頭像直徑用 getBoundingClientRect()
// 量測那顆按鈕的實際高度，不寫死 px（.pill-btn 本身是橢圓，寬高不同，量高度
// 是因為頭像是圓形，跟旁邊按鈕對齊的是同一條水平視覺高度）。
export default function AvatarMenu({ session, sizeRefTarget }) {
  const { t, locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [size, setSize] = useState(null)
  const rootRef = useRef(null)

  const email = session.user.email || ''
  const avatarUrl = session.user.user_metadata?.avatar_url
  // Google 頭像是外部 URL，跟 Google Books 封面走同一條判斷——直接跳過，
  // 不得送進 createSignedUrls（那支只處理 Storage 內部路徑）。
  const showImage = Boolean(avatarUrl) && isExternalUrl(avatarUrl) && !imgError
  const initial = email.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    const target = sizeRefTarget?.current
    if (!target) return

    function measure() {
      setSize(target.getBoundingClientRect().height)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [sizeRefTarget])

  useEffect(() => {
    if (!open) return

    function handleOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open])

  async function handleLogout() {
    // 資料已在雲端，登出不會遺失——不加二次確認，兩段點擊（開下拉→按登出）已足夠。
    await supabase.auth.signOut()
  }

  return (
    <div className="avatar-menu" ref={rootRef}>
      <button
        type="button"
        className="avatar-trigger"
        style={size ? { width: size, height: size } : undefined}
        onClick={() => setOpen((o) => !o)}
        aria-label={t('common.accountMenu')}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {showImage ? (
          <img src={avatarUrl} alt="" onError={() => setImgError(true)} />
        ) : (
          <span className="avatar-fallback">{initial}</span>
        )}
      </button>

      {open && (
        <div className="avatar-dropdown" role="menu">
          <p className="avatar-dropdown-email meta-text">{email}</p>
          <div className="avatar-dropdown-divider" />
          <button type="button" className="avatar-dropdown-logout" onClick={handleLogout} role="menuitem">
            {t('common.signOut')}
          </button>
          <div className="avatar-dropdown-divider" />
          <div className="avatar-dropdown-language-row">
            <span className="avatar-dropdown-language-label">{t('settings.language')}</span>
            <div className="locale-pill" role="group">
              <button
                type="button"
                className={`locale-pill-seg${locale === 'zh' ? ' is-active' : ''}`}
                onClick={() => setLocale('zh')}
              >
                ZH
              </button>
              <button
                type="button"
                className={`locale-pill-seg${locale === 'en' ? ' is-active' : ''}`}
                onClick={() => setLocale('en')}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
