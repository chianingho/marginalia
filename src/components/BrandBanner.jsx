// 未來彩蛋(Supabase 後):書背改由使用者「在讀」書目動態生成,本版目前是定稿點陣圖。
// PWA standalone 階段：綠底延伸進狀態列（safe-area）待議，本版瀏覽器模式不處理。
// 已知取捨（總規格項目 1 記錄）：橫幅文字是點陣圖裡烙好的，日後要改字必須重出圖檔。
// H-1-5：Group by 疊字機制整組廢除，chips 是分組狀態的唯一指示——這個元件
// 恢復成純展示、無 props、無 state。
export default function BrandBanner() {
  return (
    <div className="brand-banner">
      <img
        src="/banner.png"
        width="680"
        height="424"
        alt="Marginalia · Books"
        className="brand-banner-img"
      />
    </div>
  )
}
