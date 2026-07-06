-- 個人閱讀筆記 App － Supabase 資料表結構
-- 在 Supabase Dashboard 的 SQL Editor 貼上整段執行即可

create extension if not exists "pgcrypto";

-- 書籍
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text,
  google_books_id text,
  created_at timestamptz not null default now()
);

-- 筆記（每一筆對應某本書、某次閱讀的紀錄）
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  read_date date not null,
  content text,
  screenshot_url text,
  created_at timestamptz not null default now()
);

create index if not exists notes_book_id_idx on notes(book_id);

-- 這是單人使用的個人工具，不做登入驗證，
-- 因此關閉 Row Level Security，讓 anon key 可以直接讀寫。
alter table books disable row level security;
alter table notes disable row level security;
