-- ============================================================
-- Marginalia · Supabase schema(定案版,一次性套用於全新專案)
-- 平台:Postgres / Supabase。所有表 RLS 保護,以 user_id = auth.uid() 分租。
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- books ----------
create table if not exists public.books (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  author         text,
  cover_url      text,               -- Google Books 外部 URL,或使用者上傳封面的 Storage URL(決策 B)
  google_books_id text,
  status         text not null default 'to_read'
                   check (status in ('to_read','reading','finished')),
  category       text,               -- 未分類為 null
  started_at     timestamptz,        -- status 首次變 reading 時衍生
  finished_at    timestamptz,        -- status 首次變 finished 時衍生
  added_at       timestamptz not null default now(),  -- ⚠ 年/月篩選唯一依據,務必有 default
  created_at     timestamptz not null default now()
);

-- ---------- notes ----------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  book_id     uuid not null references public.books(id) on delete cascade,
  content     text,
  page        integer,              -- JS number,存整數
  image_path  text,                 -- 截圖原圖在 Storage 的路徑(決策 A);無截圖為 null
  strokes     jsonb not null default '[]'::jsonb,  -- 標注筆畫,source of truth(決策 A)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- note_date 不入庫(決策 C):8 月時間流頁在查詢端用
--   (created_at at time zone 'Asia/Taipei')::date 分日,避免粒度不一致。
-- 合成顯示圖(image_display)不入庫:留在本機 IndexedDB 快取,由 原圖 + strokes 即時重算。

-- ---------- 索引 ----------
create index if not exists books_user_idx        on public.books(user_id);
create index if not exists books_user_status_idx on public.books(user_id, status);
create index if not exists books_user_added_idx  on public.books(user_id, added_at);
create index if not exists notes_book_idx         on public.notes(book_id);
create index if not exists notes_user_created_idx on public.notes(user_id, created_at);

-- ---------- notes.updated_at 自動更新 ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.books enable row level security;
alter table public.notes enable row level security;

create policy "books_owner" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes_owner" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage(決策 A / B):兩個 bucket,以 user_id 資料夾分租
--   note-images/{user_id}/{noteId}.jpg      ← 筆記原圖
--   book-covers/{user_id}/{bookId}.jpg      ← 使用者上傳的封面
-- 於 Supabase Dashboard 建立 bucket(建議 private)後,套下列 policy。
-- ============================================================

create policy "note_images_owner"
  on storage.objects for all
  using (bucket_id = 'note-images'
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'note-images'
         and (storage.foldername(name))[1] = auth.uid()::text);

create policy "book_covers_owner"
  on storage.objects for all
  using (bucket_id = 'book-covers'
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'book-covers'
         and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 不入庫的東西(留在本機,屬裝置級 UX 狀態,不值得同步):
--   marginalia_splash_seen   ← localStorage 保留
--   marginalia_onboarded     ← localStorage 保留
--   note-img-display-*        ← IndexedDB 顯示快取,可重算
-- 若日後要跨裝置記住導覽/開場,再開一張 profiles 表,現在不做。
-- ============================================================
