import { toSecureCoverUrl } from '../lib/bookCover.js'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

/**
 * 用書名搜尋 Google Books，回傳整理過的候選清單。
 */
export async function searchBooks(query) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY
  if (!apiKey) {
    console.warn('缺少 VITE_GOOGLE_BOOKS_API_KEY 環境變數，無法搜尋 Google Books')
    return []
  }

  const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const items = data.items || []

    return items.map((item) => {
      const info = item.volumeInfo || {}
      const imageLinks = info.imageLinks || {}
      const thumbnail = toSecureCoverUrl(imageLinks.thumbnail) || null

      return {
        id: item.id,
        title: info.title || query,
        authors: (info.authors || []).join(', ') || '作者不詳',
        thumbnail,
        publisher: info.publisher || '',
        publishedDate: info.publishedDate || '',
      }
    })
  } catch (err) {
    console.error('搜尋 Google Books 失敗：', err)
    return []
  }
}
