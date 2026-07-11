// 書封面 URL 處理的共用邏輯。目前只有 Google Books 搜尋結果的縮圖需要處理，
// 之後如果有其他來源的封面也需要同樣的處理，改這裡就好，不要各自處理。

// Google Books API 回傳的縮圖網址有時是 http，混入 https 頁面會被瀏覽器擋掉，
// 一律換成 https。
export function toSecureCoverUrl(url) {
  if (!url) return url
  return url.replace('http://', 'https://')
}
