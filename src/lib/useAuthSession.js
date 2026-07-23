import { useEffect, useState } from 'react'
import { hasSupabaseConfig, supabase } from './supabaseClient.js'

// 全 app 唯一的登入狀態來源。沒有 Supabase env（本機預覽模式）時 session 永遠是
// null 但 loading 直接為 false——不阻塞畫面，維持既有「無 env 直接進 localStorage
// 模式」的防呆行為不變。有 env 時才需要先問過 Supabase 拿目前 session，並訂閱
// onAuthStateChange，讓登入/登出能立刻反映到畫面（不用重新整理）。
export function useAuthSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!hasSupabaseConfig) return

    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
