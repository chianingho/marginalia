# Pages 外部串接

| 服務 | 用途及狀態 |
|---|---|
| Vercel | [公開首頁](https://marginalia-ruddy.vercel.app/) 盤點時 HTTP 200；部署提交、部署分支及自動部署待查 |
| Supabase Auth | 程式以 Google OAuth 登入。正式 provider、回呼 URL 與跨裝置登入待驗 |
| Supabase Postgres | `books` 保存書籍、狀態、分類與時間；`notes` 保存筆記、頁碼、`image_path` 和 JSON `strokes`。本機 schema 為兩表定義以 `auth.uid() = user_id` 限制的 RLS |
| Supabase Storage | 設計使用 `note-images`、`book-covers`。本機 policy 按使用者資料夾隔離，封面流程使用 signed URL；正式 bucket、policy 和套用情況待驗 |
| Google Books | 書名與封面搜尋，由前端讀取選用的 `VITE_GOOGLE_BOOKS_API_KEY`。前端變數可見，請在服務端限制可用 API 與網站來源。正式查詢與配額待驗 |
| GitHub | [marginalia](https://github.com/chianingho/marginalia) 遠端 refs 可讀；寫入權限待驗 |

本機候選目錄只有 `.env.example`。`jessica_agent` 有受忽略的 `.env`。設定名稱為 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY` 等，實際值由環境管理。Repo 只有 [schema.sql](../supabase/schema.sql)，正式 schema、待執行 migration 及是否需調整服務均未驗證。 [環境範本](../.env.example) · [歷史遷移規格](supabase-auth-migration-spec.md)
