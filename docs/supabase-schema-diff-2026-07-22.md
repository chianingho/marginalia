> ⚠️ **前提已修正（第 0.5 階段，2026-07-22）**：本文假設「books/notes 兩表在 DB 已存在既有資料」，
> 需改寫成 alter table 並處理舊資料歸屬。此假設有誤——Supabase 專案是全新建立，DB 上沒有這兩張表。
> 因此本文列出的舊資料歸屬、read_date、screenshot_url、索引撞名等問題全部不成立，
> `supabase/schema.sql` 已直接整份替換為定案版（一次性建置，非 alter table）。
> 本文僅保留作歷史記錄，套用時請勿依本文步驟操作。

# Marginalia · Supabase schema diff 回報（第 0 階段）

只讀清點，未修改任何檔案、未連線 Supabase、未執行任何 migration。

## 檔案位置說明

三份參考文件都不在 `jessica_agent` 專案根目錄，實際找到位置：
- `schema.sql`、`supabase-auth-migration-spec.md` → 在 `/Users/chianiny/Desktop/files (1)/`
- `supabase-migration-plan-2026-07-21.md` → **找不到**，整台機器搜尋都沒有這個檔案。內容大部分已包在同資料夾的 `marginalia-handoff-2026-07-21-supabase.md` 跟 `supabase-auth-migration-spec.md` 裡（三決策、必修 bug、遷移步驟都有復述），這份 diff 是用這兩份補足完成的。若原始檔案之後找得到，麻煩再補上核對有沒有遺漏。

---

## 現有 `supabase/schema.sql` 完整內容（原樣）

```sql
create extension if not exists "pgcrypto";

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text,
  google_books_id text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  read_date date not null,
  content text,
  screenshot_url text,
  created_at timestamptz not null default now()
);

create index if not exists notes_book_id_idx on notes(book_id);

alter table books disable row level security;
alter table notes disable row level security;
```

這是一份很早期、單人無登入版本的 schema：沒有 `user_id`、沒有多租戶概念、RLS 明確關閉。

---

## ⚠️ 最重要的一個結構性發現（會影響「怎麼套用」，不只是欄位差異）

定案版 `schema.sql` 全部用 **`create table if not exists`**。因為 `books`/`notes` 兩張表在現有 DB 裡**已經存在**，`if not exists` 會讓這兩段 `create table` **整段變成 no-op（完全不執行）**——不會報錯，但也**不會**真的加上任何新欄位。也就是說：**不能直接把定案版 schema.sql 整份貼去 SQL Editor 跑**，套用時必須改寫成一系列 `alter table ... add column ...`，而不是原樣執行定案檔案。這點會直接決定下一步「套用」該怎麼寫。

---

## 1. 欄位缺少 / 型別不同 / 預設值不同

### books

| 差異 | 影響 |
|---|---|
| 缺 `user_id uuid not null references auth.users(id) on delete cascade` | 整張表完全沒有使用者欄位。這是後面 RLS 能不能生效的前提，也是最棘手的一項——如果表裡已經有資料，`not null` 欄位沒有合理 default 可以自動填，需要先決定舊資料歸屬給哪個帳號。 |
| 缺 `status text not null default 'to_read' check (status in ('to_read','reading','finished'))` | `add column` 有 default，若已有資料會安全回填成 `'to_read'`——但這**跟遷移計畫裡「舊書缺 status 要補 reading（比照 resolveShelfKey 顯示邏輯）」的決策不一致**，DB 層 default 跟 App 層遷移邏輯要補的值不一樣，兩邊要對齊好，不能只依賴 DB default。 |
| 缺 `category text` | nullable，無資料風險。 |
| 缺 `started_at timestamptz`、`finished_at timestamptz` | nullable，無資料風險；符合決策「留 null，不反推假日期」。 |
| 缺 `added_at timestamptz not null default now()` | `add column` 有 default 可安全套用，但既有資料（如果有）會被回填成「套用當下的時間」，不是書真正的建立時間——如果 Supabase 現在已經有真實資料，年/月篩選會失真，需要額外一次性補值（用 `created_at` 回填）而不是只吃 DB default。 |
| `id/title/author/cover_url/google_books_id/created_at` | 型別、default 都對得上，無差異。 |

### notes

| 差異 | 影響 |
|---|---|
| 缺 `user_id uuid not null references auth.users(id) on delete cascade` | 同 books，是硬性阻礙，需要先解決舊資料歸屬。 |
| 缺 `page integer` | nullable，無風險。 |
| 缺 `image_path text`；現有是完全不同名字的 **`screenshot_url text`** | 不是單純改名——`screenshot_url` 語意像「一個 URL」，`image_path` 語意是「Storage 內部路徑」。如果現有表裡 `screenshot_url` 真的有資料，需要另外判斷這些值是不是本來就能直接當 `image_path` 用，還是要重新處理；不能無腦 rename。 |
| 缺 `strokes jsonb not null default '[]'::jsonb` | `add column` 有 default，安全。 |
| 缺 `updated_at timestamptz not null default now()` | `add column` 有 default，安全，但既有資料會全部被填成套用當下時間，不是真實最後修改時間。 |
| 現有多出 **`read_date date not null`**，定案版完全沒有這個欄位（決策 C：note_date 不入庫，改在查詢端用 `created_at` 算） | 這欄位在現有表是 `not null`，代表舊資料理論上每筆都有值。定案版沒有承接它——如果現有表真的有資料，這些 `read_date` 值目前的 diff 沒有安排去處，需要確認這欄位的資料要不要保留/怎麼處理，還是本來就是空表可以直接不管。 |
| `id/content/created_at` | 對得上。 |

---

## 2. constraint / index / trigger 差異

- **check constraint**：定案版新增 `books.status` 的 `check (status in ('to_read','reading','finished'))`，現有完全沒有（因為欄位本身就不存在）。
- **索引**：
  - 現有只有 `notes_book_id_idx on notes(book_id)` 一個。
  - 定案版是 `books_user_idx`、`books_user_status_idx`、`books_user_added_idx`、`notes_book_idx`、`notes_user_created_idx` 五個。
  - **注意**：`notes_book_id_idx`（現有）跟 `notes_book_idx`（定案版）其實是同一個概念（book_id 上的索引）但**名字不同**。因為名字不同，`create index if not exists notes_book_idx` 不會認得現有那個索引已經存在，會**多建一個功能重複、名字不同的索引**。要嘛沿用舊名字、要嘛先砍舊索引再建新的，不要兩個都留著。
  - 其餘 4 個索引因為欄位都還不存在，現在無從建立，全部是「新增」。
- **trigger**：現有完全沒有任何 function/trigger。定案版新增 `set_updated_at()` function + `notes_set_updated_at`（before update on notes）。這個 trigger 依賴 `notes.updated_at` 欄位，順序上必須先把欄位加上去，trigger 才有意義；且套用後，之後每次 update 一筆 note，`updated_at` 就會自動被覆寫成當下時間——如果 App 邏輯裡有自己手動維護 `updated_at`（localStorage 版本目前是這樣），DB trigger 生效後值以 DB 為準沒問題，但要注意不是「兩邊各算各的」造成不一致。

---

## 3. RLS policy 差異

- 現有：**兩張表都明確關閉 RLS**（`disable row level security`），註解寫明是「單人工具、不做登入驗證，讓 anon key 可以直接讀寫」。
- 定案版：**兩張表都啟用 RLS**，各加一條 owner-only policy `using (auth.uid() = user_id) with check (auth.uid() = user_id)`。
- **方向完全相反**，而且這條 policy 硬依賴 `user_id` 欄位存在且有正確值。**影響（重要，會斷現有功能）**：
  1. 這張表現在還沒有 `user_id` 欄位，policy 語法上就無法套用，必須先完成第 1 節的欄位新增。
  2. 就算欄位加上去了，**如果既有資料的 `user_id` 是 null 或沒有正確回填**，RLS 開啟後這些資料會變成「誰都讀不到、寫不到」（因為 `auth.uid() = null` 永遠不成立）——等於資料還在，但實質上被鎖死。
  3. **目前這個專案的登入功能（Google OAuth）根本還沒做**——RLS 一旦打開，任何用 anon key 直接讀寫的路徑（現有 code 目前就是這樣用）都會立刻被擋下來。所以套用順序上，RLS 不應該在登入流程做好之前打開，這點也是 migration spec 自己列的步驟順序（schema diff → 修 bug → 套 schema/RLS/storage → 做登入頁 → 資料層改造），要照順序做，不能提前開 RLS。

---

## 4. Storage policy 差異

- 現有：**完全沒有**任何 Storage bucket 或 policy（現有 schema.sql 只碰資料表）。
- 定案版：新增兩條 policy——`note_images_owner`（bucket `note-images`）、`book_covers_owner`（bucket `book-covers`），都是用 `(storage.foldername(name))[1] = auth.uid()::text` 做資料夾層級隔離。
- 全部標為**新增**。policy 本身依賴 bucket 已存在（bucket 要在 Dashboard 手動建立，SQL 建不了），也依賴 `auth.uid()`，所以一樣要等登入流程可用才有意義；套用 policy 本身對現有資料無風險（現在沒有任何檔案在這兩個 bucket 裡）。

---

## 待確認事項

套用 RLS 前，麻煩先確認一下 Supabase 那邊 `books`/`notes` 兩張表現在到底是空的還是已經有資料——這點無法從靜態檔案看出來，也不能連線去查（本次任務限制），但它會直接決定「新增 `user_id` 欄位」跟「開 RLS」這兩步能不能無痛套用，還是要先做一次資料歸屬/回填。
