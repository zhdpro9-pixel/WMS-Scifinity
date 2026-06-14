-- ════════════════════════════════════════════════════════
--  WMS Scifinity · Supabase RLS Setup + Audit Trail
--  Jalankan script ini di: Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════

-- ─── 0. TABEL VENDOR (REVISI 3) ────────────────────────

CREATE TABLE IF NOT EXISTS wms_vendors (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  material        TEXT NOT NULL,          -- koma-separated: biang, botolP, box, dll.
  lead_time_days  INTEGER NOT NULL DEFAULT 3,
  contact         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO wms_vendors (name, material, lead_time_days, contact)
SELECT * FROM (VALUES
  ('PT Aroma Nusantara',    'biang',              3, '0812-xxxx-xxxx'),
  ('CV Botol Kaca Jaya',    'botolP,botolL',      5, '0813-xxxx-xxxx'),
  ('PT PackIndo Sejahtera', 'box,kardus,bubble',  2, '0819-xxxx-xxxx')
) AS v(name, material, lead_time_days, contact)
WHERE NOT EXISTS (SELECT 1 FROM wms_vendors LIMIT 1);

ALTER TABLE wms_vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_authenticated_vendors" ON wms_vendors;

CREATE POLICY "allow_authenticated_vendors"
  ON wms_vendors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON wms_vendors FROM anon;

-- ─── 1. TAMBAHKAN KOLUM AUDIT TRAIL (user_id, user_email) ───────────────────

-- Add audit columns to wms_logs
ALTER TABLE wms_logs 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Add audit columns to wms_sales
ALTER TABLE wms_sales 
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- ─── 2. AKTIFKAN ROW LEVEL SECURITY ───────────────────

ALTER TABLE wms_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_sales     ENABLE ROW LEVEL SECURITY;

-- ─── 3. HAPUS POLICY LAMA (kalau ada) ─────────────────

DROP POLICY IF EXISTS "allow_authenticated_inventory" ON wms_inventory;
DROP POLICY IF EXISTS "allow_authenticated_logs"      ON wms_logs;
DROP POLICY IF EXISTS "allow_authenticated_sales"     ON wms_sales;

-- ─── 4. BUAT POLICY BARU ──────────────────────────────
-- Hanya user yang sudah login (authenticated) yang boleh
-- membaca, menulis, mengubah, dan menghapus data.

-- wms_inventory
CREATE POLICY "allow_authenticated_inventory"
  ON wms_inventory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- wms_logs
CREATE POLICY "allow_authenticated_logs"
  ON wms_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- wms_sales
CREATE POLICY "allow_authenticated_sales"
  ON wms_sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── 5. BLOKIR AKSES ANONYMOUS ────────────────────────
-- Pastikan role "anon" tidak bisa akses tanpa login.

REVOKE ALL ON wms_inventory FROM anon;
REVOKE ALL ON wms_logs      FROM anon;
REVOKE ALL ON wms_sales     FROM anon;

-- ─── 6. VERIFIKASI ────────────────────────────────────
-- Jalankan query ini untuk cek RLS sudah aktif:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('wms_inventory', 'wms_logs', 'wms_sales', 'wms_vendors');
-- Kolom "rowsecurity" harus bernilai TRUE untuk semua tabel.
