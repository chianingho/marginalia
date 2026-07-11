import { useEffect } from 'react'

// 鎖住背景頁面滾動：iOS Safari 上單靠 body overflow:hidden 不夠，改用 position:fixed
// 並記錄/還原 scrollY，避免關閉 modal／全螢幕畫面後畫面跳掉。
// 所有需要鎖背景捲動的 modal／全螢幕畫面共用這一份，不要各自重寫。
export function useScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    const { body } = document
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'

    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      window.scrollTo(0, scrollY)
    }
  }, [])
}
