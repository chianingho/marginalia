// 訪客模式專用的資料層——跟 localStore.js 共用同一套邏輯（createLocalStore
// 工廠），只是綁定完全獨立的一組 localStorage key，不跟正式的
// reading-notes:books/notes 共用命名空間。這樣日後第 2 階段的一次性遷移函式
// （只讀 reading-notes:books/notes）永遠不會掃到訪客期間新增的資料，避免
// 訪客隨手加的測試書污染使用者本人登入後的雲端書櫃（不可逆的資料污染）。
// 不 seed 範例書：訪客是真實使用情境，不是本機開發預覽，不需要那 5 本示範書。
import { createLocalStore } from './localStore.js'

export const {
  fetchBooks,
  fetchBookById,
  createBook,
  updateBook,
  deleteBook,
  getNotesByBook,
  getNoteById,
  addNote,
  updateNote,
  deleteNote,
} = createLocalStore({
  booksKey: 'reading-notes:guest:books',
  notesKey: 'reading-notes:guest:notes',
  seededFlagKey: 'reading-notes:guest:seeded',
  seedSamples: false,
})
