// 全站唯一一份粉紅小鳥插畫資產——首頁 BrandBanner 的書架插畫跟開場動畫
// （Splash.jsx）共用同一份，改一次兩邊同步，不會養出兩隻會漂移的鳥。
// 修正批次（開場動畫改版，對照 marginalia-splash-prototype.html）：換成原型
// 那隻新畫法的鳥（圓肚身體＋翅膀＋抬頭嘴＋長腿），取代舊版首頁那隻，兩邊都
// 換成同一份。座標是原型的 0–100 / 0–110 本地座標，呼叫端要換位置/縮放
// 一律外層包 <g transform="..."> 做，不要動這裡的路徑數字。
// 黑色描邊（#1f1f1f）、粉紅（#E6A0B4）、喙的橘（#E4884C）是插畫層專屬色，
// 不套全域 token（跟 BrandBanner 其餘插畫元素同一套規則）。
//
// eyeClassName：眼睛圓點要套的 class，用來讓呼叫端各自控制眨眼時機——
// 首頁走 index.css 既有的 .blink（prefers-reduced-motion 下自動不循環播放），
// 開場動畫走自己「只眨一次」的 class，鳥的形狀本身完全不變。
export default function BirdDoodle({ eyeClassName = 'blink' }) {
  return (
    <g>
      {/* 大圓肚身體 */}
      <path
        d="M50 20 C 68 20 80 34 80 52 C 80 72 68 82 50 82 C 32 82 20 72 20 52 C 20 34 32 20 50 20 Z"
        fill="#E6A0B4"
        stroke="#1f1f1f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 尾巴一撇（往上翹，移到右後方） */}
      <path
        d="M78 46 C 86 40 90 39 95 42"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 抬頭的嘴（朝左上，看向文字） */}
      <path d="M34 31 L 21 20 L 35 41 Z" fill="#E4884C" stroke="#1f1f1f" strokeWidth="3" strokeLinejoin="round" />
      {/* 眼睛（左上＝看左邊上面那行字，會眨） */}
      <circle className={eyeClassName} cx="44" cy="33" r="3.6" fill="#1f1f1f" />
      {/* 翅膀：垂在身體兩側 */}
      <path
        d="M25 50 C 21 58 23 66 29 69"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M75 50 C 79 58 77 66 71 69"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 長腿 + 小腳 */}
      <path
        d="M44 81 L 42 103 M40 103 l 6 0 M56 81 L 58 103 M55 103 l 6 0"
        fill="none"
        stroke="#1f1f1f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}
