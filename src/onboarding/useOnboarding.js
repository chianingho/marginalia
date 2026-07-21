import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

// 首次進站導覽（driver.js coach mark）。localStorage flag 存「使用者是否已經
// 看過導覽」，flag 存在就不再自動跑——略過跟完成都算「已看過」（見 buildTour
// 的 onDestroyed，兩條路徑最後都會經過同一個 destroy 生命週期）。
const ONBOARDING_STORAGE_KEY = 'marginalia_onboarded'

// 目前只有 2 步：ADD BOOK 按鈕、右上搜尋/篩選工具。「篩選膠囊列」那一步
// 文案還在調整中（書架頁預設狀態沒有常駐的分類膠囊可以指），先不上，
// 之後文案確定了再加回 TOUR_STEPS。
const TOUR_STEPS = [
  {
    element: '[data-tour="add-book"]',
    popover: {
      description: '從這裡加入第一本書',
    },
  },
  {
    element: '[data-tour="search-tools"]',
    popover: {
      description: '搜尋整個書庫，或開進階篩選',
    },
  },
]

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function allTargetsPresent() {
  return TOUR_STEPS.every((step) => document.querySelector(step.element))
}

// 建立一輪新的 driver.js 導覽實例。每次呼叫都是全新 instance——driver.js
// 沒有「reset 現有 instance 的 steps」以外的乾淨重跑方式。
function buildOnboardingTour() {
  let driverObj

  driverObj = driver({
    animate: !prefersReducedMotion(),
    allowClose: true,
    overlayColor: 'var(--ink)',
    overlayOpacity: 0.5,
    stagePadding: 6,
    stageRadius: 16,
    popoverClass: 'marginalia-tour',
    showButtons: ['next'],
    nextBtnText: '下一步',
    doneBtnText: '完成',
    // 總規格：每步含「下一步／略過」，最後一步為「完成」。driver.js 內建的
    // showButtons 只有 next/previous/close 三種，close 是固定文字「×」的
    // 右上角圖示按鈕，沒有能改文字的「略過」文字鈕，所以關掉內建 close、
    // 自己在 footer 塞一顆「略過」——直接呼叫 driverObj.destroy()，跟按完
    // 「完成」走同一個 onDestroyed 收尾（一律視為已看過）。
    onPopoverRender: (popover) => {
      popover.closeButton.style.display = 'none'

      const skipBtn = document.createElement('button')
      skipBtn.type = 'button'
      skipBtn.className = 'tour-skip-btn'
      skipBtn.textContent = '略過'
      skipBtn.addEventListener('click', () => driverObj.destroy())
      popover.footerButtons.insertBefore(skipBtn, popover.nextButton)
    },
    onDestroyed: () => {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    },
    steps: TOUR_STEPS,
  })

  return driverObj
}

// ready：書架資料是否已經載入完成（避免在空畫面/loading 狀態就搶跑）。
export function useOnboarding(ready) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (!ready || startedRef.current) return
    if (localStorage.getItem(ONBOARDING_STORAGE_KEY)) return

    let cancelled = false
    let attempts = 0

    // 資料是 async 的，載入完成後 React 還要再走一輪 render/commit，
    // data-tour 目標不一定在這個 effect 執行當下就已經在 DOM 上，
    // 用 rAF 輪詢確認兩個目標都存在才真的 start。另外首次進站還會疊一層
    // 開場動畫（Splash.jsx，總長 1.2s，z-index 蓋過整個畫面）——driver.js
    // 的 popover/overlay z-index 高達 10 億，導覽如果在開場動畫還沒收掉
    // 前就 start，coach mark 會直接穿透蓋在動畫上面，所以這裡也一併等
    // .splash-overlay 從 DOM 上消失，最多等約 5 秒。
    function tryStart() {
      if (cancelled || startedRef.current) return
      if (!document.querySelector('.splash-overlay') && allTargetsPresent()) {
        startedRef.current = true
        buildOnboardingTour().drive()
        return
      }
      attempts += 1
      if (attempts > 300) return
      requestAnimationFrame(tryStart)
    }

    tryStart()

    return () => {
      cancelled = true
    }
  }, [ready])
}
