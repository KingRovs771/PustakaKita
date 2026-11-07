-- ==============================================================================
-- PustakaKita (Perpustakaan Digital Siswa) Database Migration Script
-- Target Database: Neon Serverless PostgreSQL
-- ==============================================================================

-- 1. Enable UUID Extension & Vector Extension (pgvector for AI recommendations)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABEL: students
-- Identifikasi siswa menggunakan nisn_hash (HMAC-SHA256). NISN asli tidak pernah disimpan.
CREATE TABLE IF NOT EXISTS students (
  nisn_hash VARCHAR(64) PRIMARY KEY,
  pin_hash VARCHAR(60) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  class_name VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  first_login_at TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_last_login ON students(last_login_at);
CREATE INDEX IF NOT EXISTS idx_students_first_login ON students(first_login_at);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);

-- 3. TABEL: admin_users (Pustakawan & Kepala Sekolah)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(60) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('librarian', 'principal')),
  full_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABEL: categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) NOT NULL,
  color_hex CHAR(7) NOT NULL,
  sort_order SMALLINT DEFAULT 0 NOT NULL
);

-- 5. TABEL: books
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  isbn VARCHAR(20) NULL,
  r2_key VARCHAR(500) NOT NULL UNIQUE,
  cover_url VARCHAR(500) NULL,
  source_type VARCHAR(20) DEFAULT 'bse' NOT NULL CHECK (source_type IN ('internal', 'bse', 'licensed')),
  grade_level VARCHAR(10) NOT NULL CHECK (grade_level IN ('SD', 'SMP', 'SMA')),
  total_pages INTEGER NOT NULL CHECK (total_pages > 0),
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  estimated_read_minutes INTEGER DEFAULT 30 NOT NULL,
  vocabulary_level VARCHAR(50) DEFAULT 'Menengah' NOT NULL,
  synopsis TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(author, ''))) STORED,
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_search ON books USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id) WHERE is_deleted = false AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_books_grade ON books(grade_level) WHERE is_deleted = false AND is_published = true;

-- 6. TABEL: reading_sessions (State Progres Membaca Terakhir)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_nisn_hash VARCHAR(64) NOT NULL REFERENCES students(nisn_hash) ON UPDATE CASCADE ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 1 NOT NULL,
  progress_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL CHECK (progress_pct BETWEEN 0 AND 100),
  total_read_minutes INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_session_student_book UNIQUE (student_nisn_hash, book_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_student_book ON reading_sessions(student_nisn_hash, book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_read ON reading_sessions(last_read_at DESC);

-- 7. TABEL: daily_reading_stats (Tracking WAR & Durasi Membaca Harian yang Akurat)
CREATE TABLE IF NOT EXISTS daily_reading_stats (
  id BIGSERIAL PRIMARY KEY,
  student_nisn_hash VARCHAR(64) NOT NULL REFERENCES students(nisn_hash) ON UPDATE CASCADE ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  read_minutes INTEGER DEFAULT 0 NOT NULL,
  books_opened_count SMALLINT DEFAULT 1 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_daily_stats_student_date UNIQUE (student_nisn_hash, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_student_date ON daily_reading_stats(student_nisn_hash, reading_date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_reading_stats(reading_date);

-- 8. TABEL: reading_history (Rekapitulasi Buku yang Selesai Dibaca)
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_nisn_hash VARCHAR(64) NOT NULL REFERENCES students(nisn_hash) ON UPDATE CASCADE ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  total_read_minutes INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_student ON reading_history(student_nisn_hash);

-- 9. TABEL: visitor_logs (Audit & Event Activity)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id BIGSERIAL PRIMARY KEY,
  student_nisn_hash VARCHAR(64) NULL,
  event_type VARCHAR(50) NOT NULL,
  target_id UUID NULL,
  path VARCHAR(255) NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_logs_created ON visitor_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_nisn ON visitor_logs(student_nisn_hash) WHERE student_nisn_hash IS NOT NULL;

