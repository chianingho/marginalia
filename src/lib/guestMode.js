// 訪客模式旗標——獨立且明確的狀態來源，不是「hasActiveSupabaseSession() 回傳
// false」的隱含推論。資料層（api/books.js、api/notes.js）靠這支旗標判斷要不要
// 走 guestStore.js 那組獨立命名空間；App.jsx 靠它決定要不要略過登入頁。
const GUEST_MODE_KEY = 'marginalia_guest_mode'

export function isGuestMode() {
  return localStorage.getItem(GUEST_MODE_KEY) === '1'
}

export function enterGuestMode() {
  localStorage.setItem(GUEST_MODE_KEY, '1')
}

// 訪客中途登入成功後呼叫：訪客資料本身不清（獨立命名空間留著當無害殘留），
// 只是不再讓這個旗標繼續代表「目前是訪客」，避免之後單純登出時被誤判成
// 訪客而跳過登入頁。
export function exitGuestMode() {
  localStorage.removeItem(GUEST_MODE_KEY)
}
