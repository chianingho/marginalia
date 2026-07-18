// v6 改版：橫幅文字改回活文字（Marginalia/Books，Apple Garamond Light Italic），
// 不再是 banner.png 點陣圖，換字不用重出圖檔。插畫是複製自
// marginalia-redesign-preview.html 的 .shelf-illo 手繪 SVG，路徑不變，
// 只把屬性名稱轉成 JSX camelCase。動畫（sway/blink）包在 index.css 的
// prefers-reduced-motion media query 內。
export default function BrandBanner() {
  return (
    <div className="brand-hero">
      <p className="brand-title-over">Marginalia</p>
      <h1 className="brand-title">Books</h1>

      <svg className="shelf-illo" viewBox="0 0 440 218" fill="none" aria-hidden="true">
        <g stroke="#26332E" strokeWidth="2" strokeLinecap="round">
          <path d="M92 30l7 7M99 30l-7 7" />
          <path d="M228 18l5 5M233 18l-5 5" />
        </g>
        <circle cx="180" cy="26" r="3" fill="#D8502C" />
        <circle cx="300" cy="30" r="2.6" fill="#2C4EA8" />

        {/* spine 1: plum, MARGIN */}
        <path
          d="M30 64c6-3 12-2 18-3 5-1 9 1 10 2 1.5 18 .5 36 1.5 54 .8 17-.5 35 .5 52-6 2.5-13 1.5-19 2.5-4 .7-8-.5-10-1-1.5-18-.5-36-1.5-54-.8-17 .5-35 0-52.5z"
          fill="#A84E8C"
        />
        <g fontFamily="Gloria Hallelujah" fontSize="12" fill="#F6F1E6">
          <text x="38" y="88" transform="rotate(-4 38 88)">M</text>
          <text x="39" y="104" transform="rotate(3 39 104)">A</text>
          <text x="38" y="120" transform="rotate(-3 38 120)">R</text>
          <text x="39.5" y="136" transform="rotate(4 39.5 136)">G</text>
          <text x="41" y="152" transform="rotate(-2 41 152)">I</text>
          <text x="38" y="167" transform="rotate(3 38 167)">N</text>
        </g>

        {/* spine 2: mustard, dots */}
        <path
          d="M66 90c5-2.5 10-1.5 15-2 3-.3 5 .8 6 1.5 1 14 .3 28 1 42 .6 13-.4 27 .4 40-5 2-11 1-16 1.5-2.5.3-5-.5-6-1-1-14-.3-28-1-42-.6-13 .4-27 .6-40z"
          fill="#E3A63B"
        />
        <g fill="#F6F1E6">
          <ellipse cx="76" cy="106" rx="3" ry="2.6" transform="rotate(-8 76 106)" />
          <ellipse cx="77.5" cy="124" rx="2.5" ry="3" transform="rotate(12 77.5 124)" />
          <ellipse cx="75.5" cy="142" rx="3.1" ry="2.5" transform="rotate(-14 75.5 142)" />
          <ellipse cx="77" cy="159" rx="2.6" ry="2.9" transform="rotate(6 77 159)" />
        </g>

        {/* spine 3: paper, multicolor READ */}
        <path
          d="M96 74c6-2.5 13-1.5 19-2.5 3.5-.6 6 .8 7 1.5 1.2 16 .3 32 1.2 48 .8 15-.6 31 .3 46-6 2.5-14 1.5-20 2.5-3.5.6-6-.6-7-1.2-1.2-16-.3-32-1.2-48-.8-15 .7-31 .7-46.3z"
          fill="#FBF8F0"
        />
        <path
          d="M96 74c6-2.5 13-1.5 19-2.5 3.5-.6 6 .8 7 1.5 1.2 16 .3 32 1.2 48 .8 15-.6 31 .3 46-6 2.5-14 1.5-20 2.5-3.5.6-6-.6-7-1.2-1.2-16-.3-32-1.2-48-.8-15 .7-31 .7-46.3z"
          stroke="#26332E"
          strokeWidth="1.2"
          opacity=".35"
        />
        <g fontFamily="Gloria Hallelujah" fontSize="17">
          <text x="103" y="100" fill="#D8502C" transform="rotate(-6 103 100)">R</text>
          <text x="105" y="122" fill="#2C4EA8" transform="rotate(5 105 122)">E</text>
          <text x="103" y="144" fill="#1E7A6D" transform="rotate(-4 103 144)">A</text>
          <text x="104" y="166" fill="#A84E8C" transform="rotate(6 104 166)">D</text>
        </g>

        {/* spine 4: red tilted, NOTES */}
        <g transform="rotate(7 146 176)">
          <path
            d="M130 70c7-3 15-2 22-3 4-.6 7 1 8 2 1.5 17 .5 34 1.5 51 .8 17-.5 34 .5 51-7 2.5-16 1.5-23 2.5-4 .6-7-.6-8-1.2-1.5-17-.5-34-1.5-51-.8-17 .5-34 0-51.3z"
            fill="#D8502C"
          />
          <g fontFamily="Gloria Hallelujah" fontSize="11.5" fill="#F6F1E6">
            <text x="142" y="96" transform="rotate(-4 142 96)">N</text>
            <text x="143" y="111" transform="rotate(4 143 111)">O</text>
            <text x="142" y="126" transform="rotate(-3 142 126)">T</text>
            <text x="143.5" y="141" transform="rotate(3 143.5 141)">E</text>
            <text x="142" y="156" transform="rotate(-4 142 156)">S</text>
          </g>
        </g>

        {/* spine 5: forest, wonky yellow 5 */}
        <path
          d="M170 82c6-3 13-2 19-2.5 3.5-.4 6 .8 7 1.5 1.2 15 .3 30 1.2 45 .8 14-.6 29 .3 43-6 2.5-14 1.5-20 2-3.5.4-6-.5-7-1-1.2-15-.3-30-1.2-45-.8-14 .7-29 .7-43z"
          fill="#254B3A"
        />
        <text x="178" y="140" fontFamily="Gloria Hallelujah" fontSize="26" fill="#F2FF00" transform="rotate(-5 178 140)">5</text>

        {/* spine 6: teal, wave scribbles, swaying */}
        <g className="sway" transform="rotate(-9 218 174)">
          <path
            d="M204 98c5-2.5 10-1.5 15-2 3-.3 5 .8 6 1.5 1 12.5.3 25 1 38 .6 12-.4 24 .4 36-5 2-11 1-16 1.5-2.5.3-5-.5-6-1-1-12.5-.3-25-1-38-.6-12 .4-24 .6-36z"
            fill="#1E7A6D"
          />
          <g stroke="#F6F1E6" strokeWidth="2" strokeLinecap="round">
            <path d="M209 114c2.5-3 5-3 7.5 0" />
            <path d="M209 132c2.5-3 5-3 7.5 0" />
            <path d="M209 150c2.5-3 5-3 7.5 0" />
          </g>
        </g>

        {/* leaning little book */}
        <g transform="rotate(23 248 176)">
          <path
            d="M240 118c3.5-1.5 7.5-1 11-1.5 1 14 .5 28 1 42 .4 6.5-.3 13 .2 19-3.5 1.5-8 1-11.5 1.5-1-14-.5-28-1-42-.4-6.5.8-13 .3-19z"
            fill="#E3A63B"
            opacity=".92"
          />
        </g>

        {/* pink bird + caption */}
        <g>
          <path
            d="M394 132c8 1 14 6 15.5 14 1.6 8.5-2.5 16-9.5 19.5 1.5 2.5 4 4 7 4.5-3.5 2.5-8 3-12 1.5-2 .6-4 .9-6.5.7-9.5-.8-16.5-7.5-17-16.5-.5-9 4.5-16.5 12.5-19.5-2-2.5-2.5-5.5-1.5-8.5 3.5.5 6 2 7.5 4.3z"
            fill="#E9A0B6"
          />
          <path d="M383 124l-7-1.5 6 5" fill="#D8502C" />
          <circle className="blink" cx="386.5" cy="130.5" r="1.7" fill="#26332E" />
          <g stroke="#26332E" strokeWidth="1.8" strokeLinecap="round">
            <path d="M390 171v14M390 185l-4 3M390 185l4 3" />
            <path d="M400 170v15M400 185l-4 3M400 185l4 3" />
          </g>
        </g>
        <text x="318" y="112" fontFamily="Gloria Hallelujah" fontSize="11" fill="#26332E" transform="rotate(-3 318 112)">i must</text>
        <text x="322" y="128" fontFamily="Gloria Hallelujah" fontSize="11" fill="#26332E" transform="rotate(2 322 128)">read</text>

        {/* open book: chunky naive strokes */}
        <g stroke="#26332E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M296 168c12-8 26-10 39-6 .8 5 .8 10.5 0 15.5-13-4-27-2-39 6-.8-5.5-.8-10 0-15.5z" />
          <path d="M374 168c-12-8-26-10-39-6-.8 5-.8 10.5 0 15.5 13-4 27-2 39 6 .8-5.5 .8-10 0-15.5z" />
          <path d="M335 162v17" />
        </g>

        {/* chunky wobbly shelf */}
        <path
          d="M16 190c50-3.5 100-1 150-2 60-1.2 120 1.5 180 .5 28-.4 56-1.2 78-2.5"
          stroke="#26332E"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M50 191v16M386 189v16" stroke="#26332E" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}
