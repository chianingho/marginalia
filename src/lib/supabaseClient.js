import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 尚未設定 Supabase 環境變數時，整個 app 會自動改用瀏覽器 localStorage
// 來暫存資料（見 src/lib/localStore.js），方便先在本機預覽畫面。
// 之後只要在 .env.local 填入真正的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，
// 不需要改任何程式碼，就會自動切回 Supabase。
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

// 兩個 bucket 名稱對應 Supabase Dashboard 上實際建立的名字（決策 A/B），
// 都是 private bucket，讀取一律走 resolveStoragePaths 現簽即用的 signed URL。
export const COVERS_BUCKET = 'book-covers'
export const NOTE_IMAGES_BUCKET = 'note-images'

// RLS 從一開始就是開啟的,所以「要不要走 Supabase」不能只看 env vars 有沒有填,
// 還要確認當下真的有登入 session——避免 env vars 已填但登入頁還沒做完的空窗期,
// 用未認證的 anon key 去打有 RLS 的資料表(一定被拒),此時應該一律退回 localStorage。
export async function getSupabaseSession() {
  if (!hasSupabaseConfig) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function hasActiveSupabaseSession() {
  return Boolean(await getSupabaseSession())
}

export function isExternalUrl(value) {
  return typeof value === 'string' && /^https?:\/\//.test(value)
}

const SIGNED_URL_EXPIRES_IN = 3600 // 秒。只在記憶體 view model 用，不入庫、不寫進 localStorage。

// 私有 bucket 存的是路徑（不是 URL），讀取當下才用短效期 signed URL 現換成可渲染網址。
// books.cover_url、notes.image_path 的使用者上傳圖都共用這支函式；Google Books
// 的外部 http(s) 封面不會傳進這裡處理（呼叫端用 isExternalUrl 先篩掉）。
export async function resolveStoragePaths(bucket, paths) {
  const uniquePaths = [...new Set(paths.filter((p) => p && !isExternalUrl(p)))]
  if (uniquePaths.length === 0) return {}

  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(uniquePaths, SIGNED_URL_EXPIRES_IN)
  if (error) throw error

  const map = {}
  data.forEach((item) => {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl
  })
  return map
}
