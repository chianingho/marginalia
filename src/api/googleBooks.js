const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

/**
 * 用書名搜尋 Google Books，回傳整理過的候選清單。
 * 沒有設定 VITE_GOOGLE_BOOKS_API_KEY 時會用 Google 提供的共用額度查詢，
 * 該額度是所有人共用的，很容易在尖峰時段被用完（HTTP 429）。
 * 設定自己的 API Key 後，會改用個人配額，較不容易遇到額度問題。
 */
export async function searchGoogleBooks(title) {
  const query = title.trim()
  if (!query) return []

  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''
  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=8${keyParam}`

  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`無法連線到 Google Books（網路或 CORS 問題）：${err.message}`)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error?.message || ''
    } catch {
      // 回應不是 JSON，忽略
    }
    throw new Error(
      `Google Books 搜尋失敗（HTTP ${res.status}${detail ? `：${detail}` : ''}），請稍後再試`
    )
  }

  const data = await res.json()
  const items = data.items || []

  return items.map((item) => {
    const info = item.volumeInfo || {}
    const imageLinks = info.imageLinks || {}
    const coverUrl = (imageLinks.thumbnail || imageLinks.smallThumbnail || '').replace(
      'http://',
      'https://'
    )

    return {
      googleBooksId: item.id,
      title: info.title || query,
      author: (info.authors || []).join(', '),
      publishedDate: info.publishedDate || '',
      coverUrl,
    }
  })
}
