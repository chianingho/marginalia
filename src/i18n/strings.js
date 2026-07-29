// src/i18n/strings.js
// Marginalia UI 字串字典。EN + ZH(繁中)。
// 保留英文(不進字典、JSX 直接寫死):Marginalia、Books、BrandBanner 裝飾 SVG 字。
// 動態值以 {name} 佔位,由 t(key, vars) 內插。ZH 全形標點。

export const strings = {
  en: {
    common: {
      appDocTitle: 'Marginalia — Reading Notes',
      subtitle: 'reading notes',
      accountMenu: 'Account menu',
      signOut: 'Sign out',
      signIn: 'Sign in',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving…',
      done: 'Done',
      close: 'Close',
      loading: 'Loading…',
      loadError: "Couldn't load. {error}",
      back: 'Back',
      backHome: 'Back to shelf',
    },
    login: {
      tagline: 'For those who write in the margins',
      google: 'Continue with Google',
      connecting: 'Connecting…',
      or: 'or',
      guest: 'Continue as guest',
      guestWarning: 'Guest data stays on this device and may be cleared by the browser.',
    },
    shelf: {
      booksAria: 'Book list',
      count: '{n} books',
      searchOpen: 'Search shelves',
      searchClose: 'Close search',
      filterAria: 'Filter',
      searchPlaceholder: 'Search by title or author',
      emptyAll: 'Your shelves are empty. Tap below to add your first book.',
      emptyFiltered: 'No books match your filters.',
      addBook: 'Add a book',
      filterTitle: 'Filter',
    },
    facet: { status: 'Status', category: 'Category', year: 'Year', month: 'Month' },
    status: { toRead: 'To read', reading: 'Reading', finished: 'Finished' },
    category: {
      none: 'None', custom: 'Custom…', customPlaceholder: 'Enter a category',
      fiction: 'Fiction', essays: 'Essays', psychology: 'Psychology', design: 'Design',
      business: 'Business', history: 'History', other: 'Other',
    },
    addBook: {
      title: 'Add a book', searchPlaceholder: 'Search by title or author',
      searching: 'Searching…', noResults: 'No books found', details: 'Details',
      submit: 'Add book', submitting: 'Adding…',
    },
    editBook: { title: 'Edit book', delete: 'Delete this book' },
    field: {
      title: 'Title', authorOptional: 'Author (optional)', status: 'Status',
      categoryOptional: 'Category (optional)', uploadCoverOptional: 'Upload cover (optional)',
      chooseFile: 'Choose file', noFile: 'No file chosen',
    },
    error: { enterTitle: 'Please enter a title.', noteEmpty: 'Add a screenshot or write something.' },
    confirm: {
      deleteBook: "Delete this book? This can't be undone.",
      deleteNote: "Delete this note? This can't be undone.",
    },
    note: {
      newTitle: 'New note', editTitle: 'Edit note', screenshotOptional: 'Screenshot (optional)',
      annotate: 'Annotate', removeImage: 'Remove image', choosePhoto: 'Choose photo',
      pageFieldOptional: 'Page (optional)', fieldOptional: 'Note (optional)',
      placeholder: 'Write your note…', delete: 'Delete this note',
    },
    notes: {
      empty: 'No notes yet', emptyHint: 'Tap below to jot down your first thought.',
      pagePrefix: 'p. {n}', badgePhoto: 'Photo', badgeText: 'Text',
    },
    book: { notesCount: '{n} notes', edit: 'Edit', addNote: 'New note' },
    noteDetail: { editAnnotation: 'Edit annotation', edit: 'Edit' },
    annotator: {
      cancel: 'Cancel', done: 'Done', penColor: 'Highlighter {color}', undo: 'Undo', clear: 'Clear',
    },
    tour: {
      step1: { title: 'Add books by title', body: "We'll fetch the cover and details for you." },
      step2: { title: 'Open any book', body: 'Tap a cover to see its notes.' },
      step3: { title: 'Write in the margins', body: 'Highlight and annotate as you read.' },
      next: 'Next', skip: 'Skip', done: 'Done',
    },
  },

  zh: {
    common: {
      appDocTitle: 'Marginalia · 閱讀筆記',
      subtitle: '閱讀筆記',
      accountMenu: '帳號選單',
      signOut: '登出',
      signIn: '登入',
      cancel: '取消',
      save: '儲存',
      saving: '儲存中…',
      done: '完成',
      close: '關閉',
      loading: '載入中…',
      loadError: '載入失敗：{error}',
      back: '返回',
      backHome: '回首頁',
    },
    login: {
      tagline: '記錄你的每一步閱讀軌跡',
      google: '使用 Google 繼續',
      connecting: '連接中…',
      or: '或',
      guest: '以訪客身分繼續',
      guestWarning: '訪客身分資料只存在這台裝置，資料會有遺失的風險。',
    },
    shelf: {
      booksAria: '書籍列表',
      count: '共 {n} 本',
      searchOpen: '搜尋書櫃',
      searchClose: '關閉搜尋',
      filterAria: '篩選',
      searchPlaceholder: '搜尋書名或作者',
      emptyAll: '書架還空著，點擊下方加入第一本書。',
      emptyFiltered: '沒有符合篩選條件的書。',
      addBook: '新增書籍',
      filterTitle: '篩選',
    },
    facet: { status: '狀態', category: '類別', year: '年份', month: '月份' },
    status: { toRead: '待閱讀', reading: '閱讀中', finished: '閱讀完畢' },
    category: {
      none: '無', custom: '自訂…', customPlaceholder: '輸入類別',
      fiction: '小說', essays: '散文', psychology: '心理', design: '設計',
      business: '商業', history: '歷史', other: '其他',
    },
    addBook: {
      title: '新增書籍', searchPlaceholder: '輸入書名或作者',
      searching: '搜尋中…', noResults: '找不到此書籍', details: '書籍資料',
      submit: '加入書櫃', submitting: '新增中…',
    },
    editBook: { title: '編輯書籍', delete: '刪除這本書' },
    field: {
      title: '書名', authorOptional: '作者（選填）', status: '狀態',
      categoryOptional: '類別（選填）', uploadCoverOptional: '上傳封面（選填）',
      chooseFile: '選擇檔案', noFile: '尚未選擇檔案',
    },
    error: { enterTitle: '請輸入書名。', noteEmpty: '請至少上傳截圖或寫點筆記。' },
    confirm: {
      deleteBook: '確定刪除這本書?此動作無法復原。',
      deleteNote: '確定刪除這則筆記?此動作無法復原。',
    },
    note: {
      newTitle: '新增筆記', editTitle: '編輯筆記', screenshotOptional: '截圖（選填）',
      annotate: '標註', removeImage: '移除圖片', choosePhoto: '選擇照片',
      pageFieldOptional: '頁碼（選填）', fieldOptional: '筆記（選填）',
      placeholder: '寫下你的筆記…', delete: '刪除這則筆記',
    },
    notes: {
      empty: '還沒有筆記', emptyHint: '點擊下方記下第一個想法。',
      pagePrefix: '第 {n} 頁', badgePhoto: '照片', badgeText: '文字',
    },
    book: { notesCount: '{n} 則筆記', edit: '編輯', addNote: '新增筆記' },
    noteDetail: { editAnnotation: '編輯標註', edit: '編輯' },
    annotator: {
      cancel: '取消', done: '完成', penColor: '螢光筆顏色 {color}', undo: '復原', clear: '清除',
    },
    tour: {
      step1: { title: '輸入書名就能新增', body: '封面和資料將自動帶入。' },
      step2: { title: '打開任何一本', body: '點擊封面就能看筆記。' },
      step3: { title: '在筆記寫字', body: '邊讀邊畫重點、寫註記。' },
      next: '下一步', skip: '略過', done: '完成',
    },
  },
};

export const LOCALES = ['en', 'zh'];
export const DEFAULT_LOCALE = 'en';
