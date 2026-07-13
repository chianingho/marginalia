// 未來彩蛋(Supabase 後):書背改由使用者「在讀」書目動態生成,本版目前是定稿點陣圖。
// PWA standalone 階段：綠底延伸進狀態列（safe-area）待議，本版瀏覽器模式不處理。
// 已知取捨（總規格項目 1 記錄）：橫幅文字是點陣圖裡烙好的，日後要改字必須重出圖檔。
// H-1-5：Group by 疊字機制整組廢除，chips 是分組狀態的唯一指示——這個元件
// 恢復成純展示、無 state，只留 children 讓 Bookshelf 把 icons 疊在橫幅上。
// B-2 修正：icons 一定要掛在 .brand-banner 底下（不是外面另一層 wrap），
// 因為只有 .brand-banner 自己的寬度才是滿版真正的 390px——外面包一層
// wrap 的話，wrap 還是吃 .bookshelf-header 的左右 padding，寬度只有
// 350px，icons 的百分比定位會算錯基準。
export default function BrandBanner({ children }) {
  return (
    <div className="brand-banner">
      <img
        src="/banner.png"
        width="680"
        height="424"
        alt="Marginalia · Books"
        className="brand-banner-img"
      />
      {children}
    </div>
  )
}
