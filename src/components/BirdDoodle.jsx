// 全站唯一一份粉紅小鳥插畫資產——首頁 BrandBanner 的書架插畫跟開場動畫
// （Splash.jsx）共用同一份，改一次兩邊同步，不會養出兩隻會漂移的鳥。
// 座標是原本 BrandBanner 那份 440×218 viewBox 底下量出來的本地座標，呼叫端
// 要換位置/縮放一律外層包 <g transform="..."> 做，不要動這裡的路徑數字。
// 黑色描邊（#26332E）跟粉紅（#E9A0B6）/喙的橘紅（#D8502C）是插畫層專屬色，
// 不套全域 token（跟 BrandBanner 其餘插畫元素同一套規則）。
//
// eyeClassName：眼睛圓點要套的 class，用來讓呼叫端各自控制眨眼時機——
// 首頁走 index.css 既有的 .blink（prefers-reduced-motion 下自動不循環播放），
// 開場動畫走自己的「只眨一次」class，鳥的形狀本身完全不變。
export default function BirdDoodle({ eyeClassName = 'blink' }) {
  return (
    <g>
      <path
        d="M394 132c8 1 14 6 15.5 14 1.6 8.5-2.5 16-9.5 19.5 1.5 2.5 4 4 7 4.5-3.5 2.5-8 3-12 1.5-2 .6-4 .9-6.5.7-9.5-.8-16.5-7.5-17-16.5-.5-9 4.5-16.5 12.5-19.5-2-2.5-2.5-5.5-1.5-8.5 3.5.5 6 2 7.5 4.3z"
        fill="#E9A0B6"
      />
      <path d="M383 124l-7-1.5 6 5" fill="#D8502C" />
      <circle className={eyeClassName} cx="386.5" cy="130.5" r="1.7" fill="#26332E" />
      <g stroke="#26332E" strokeWidth="1.8" strokeLinecap="round">
        <path d="M390 171v14M390 185l-4 3M390 185l4 3" />
        <path d="M400 170v15M400 185l-4 3M400 185l4 3" />
      </g>
    </g>
  )
}
