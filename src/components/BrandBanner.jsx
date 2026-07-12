// 未來彩蛋(Supabase 後):書背改由使用者「在讀」書目動態生成,本版目前是定稿點陣圖。
// PWA standalone 階段：綠底延伸進狀態列（safe-area）待議，本版瀏覽器模式不處理。
// 已知取捨（總規格項目 1 記錄）：橫幅文字是點陣圖裡烙好的，日後要改字必須重出圖檔。
// F-2：subtitle 為 Group by 選中後的模式標籤(Year / Category)，absolute 疊在
// banner.png 上（容器 position:relative）；顯示/隱藏不影響圖片本身尺寸，無 layout shift。
export default function BrandBanner({ subtitle }) {
  return (
    <div className="brand-banner">
      <img
        src="/banner.png"
        width="680"
        height="424"
        alt="Marginalia · Books"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      {subtitle && <span className="brand-banner-subtitle">{subtitle}</span>}
    </div>
  )
}
