import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 尚未設定 Supabase 環境變數時，整個 app 會自動改用瀏覽器 localStorage
// 來暫存資料（見 src/lib/localStore.js），方便先在本機預覽畫面。
// 之後只要在 .env.local 填入真正的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，
// 不需要改任何程式碼，就會自動切回 Supabase。
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

export const COVERS_BUCKET = 'covers'
export const SCREENSHOTS_BUCKET = 'screenshots'
