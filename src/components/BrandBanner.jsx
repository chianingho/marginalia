// 未來彩蛋(Supabase 後):書背改由使用者「在讀」書目動態生成,本版為靜態線稿
// PWA standalone 階段：綠底延伸進狀態列（safe-area）待議，本版瀏覽器模式不處理
// F-2：subtitle 為 Group by 選中後的模式標籤(Year / Category)，畫在 SVG 內、
// 不影響 viewBox 尺寸，顯示/隱藏不造成 layout shift；預設 Status 分組不傳值。
export default function BrandBanner({ subtitle }) {
  return (
    <div className="brand-banner">
      <svg
        viewBox="0 0 390 176"
        role="img"
        aria-label="Marginalia · Books"
        style={{ display: 'block', width: '100%', maxWidth: 390, margin: '0 auto' }}
      >
        <defs>
          <clipPath id="bannerClip">
            <rect x="0" y="0" width="390" height="176" />
          </clipPath>
        </defs>

        <rect width="390" height="176" fill="var(--color-green)" />

        <g clipPath="url(#bannerClip)">
          {/* (a) 黃痕 + Marginalia */}
          <path d="M 26 33 L 152 30 L 149 46 L 23 49 Z" fill="var(--color-highlight)" opacity="0.9" />
          <text
            x="34"
            y="44"
            fontFamily="Cormorant"
            fontWeight="500"
            fontSize="13"
            letterSpacing="3.2"
            fill="var(--color-ink-on-yellow)"
          >
            Marginalia
          </text>

          {/* (a) Books */}
          <text x="26" y="102" fontFamily="Cormorant" fontWeight="600" fontSize="54" fill="#FDFCFA">
            Books
          </text>

          {/* F-2: Group by 模式標籤，左緣對齊 Books */}
          {subtitle && (
            <text x="26" y="128" fontFamily="Cormorant" fontWeight="500" fontSize="19" fill="#FDFCFA">
              {subtitle}
            </text>
          )}

          {/* (b) 線稿螢光筆:筆芯尖端接黃痕右端(152,30)–(149,46) */}
          <polygon points="152,30 172,22 176,38 149,46" fill="var(--color-highlight)" />
          <g stroke="#FDFCFA" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round">
            <line x1="172" y1="22" x2="176" y2="38" /> {/* 筆頭套環 */}
            <path d="M 172 22 L 214 -30 M 176 38 L 218 -14" /> {/* 筆身兩側,出血過頂 */}
          </g>

          {/* (c) 線稿書背排,底緣 y=176,靠右出血。F-1:整排下移 8px 貼齊裁切後新底緣,
              騰出 Books 與書背之間的呼吸間距(對照 1.png 緊湊度) */}
          <g stroke="#FDFCFA" strokeWidth="1.5" fill="none" strokeLinejoin="round">
            <rect x="236" y="130" width="14" height="46" />
            <rect x="254" y="120" width="12" height="56" /> {/* 印數字這本 */}
            {/* 描黃 NOTES 這本(fill 蓋掉 group 的 none) */}
            <rect x="270" y="126" width="16" height="50" fill="var(--color-highlight)" stroke="#FDFCFA" />
            {/* 斜倚這本:底角仍觸底緣 */}
            <rect x="290" y="128" width="12" height="50" transform="rotate(-10 296 176)" />
            <rect x="312" y="116" width="13" height="60" />
            <rect x="329" y="134" width="15" height="42" />
            <rect x="348" y="122" width="14" height="54" />
            <rect x="368" y="128" width="30" height="48" /> {/* 出血右緣 */}
          </g>
          <text
            fontFamily="Cormorant"
            fontStyle="italic"
            fontWeight="500"
            fontSize="10"
            fill="#FDFCFA"
            transform="rotate(90 260 126)"
            x="260"
            y="126"
          >
            17
          </text>
          <text
            fontFamily="Cormorant"
            fontWeight="500"
            fontSize="8"
            letterSpacing="1.5"
            fill="var(--color-ink-on-yellow)"
            transform="rotate(90 278 130)"
            x="278"
            y="130"
          >
            NOTES
          </text>
        </g>
      </svg>
    </div>
  )
}
