-- ═══════════════════════════════════════════════════════
--  WMS Scifinity · Supabase RLS Setup
--  Jalankan script ini di: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─── 1. AKTIFKAN ROW LEVEL SECURITY ───────────────────

ALTER TABLE wms_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_sales     ENABLE ROW LEVEL SECURITY;

-- ─── 2. HAPUS POLICY LAMA (kalau ada) ─────────────────

DROP POLICY IF EXISTS "allow_authenticated_inventory" ON wms_inventory;
DROP POLICY IF EXISTS "allow_authenticated_logs"      ON wms_logs;
DROP POLICY IF EXISTS "allow_authenticated_sales"     ON wms_sales;

-- ─── 3. BUAT POLICY BARU ──────────────────────────────
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

-- ─── 4. BLOKIR AKSES ANONYMOUS ────────────────────────
-- Pastikan role "anon" tidak bisa akses tanpa login.

REVOKE ALL ON wms_inventory FROM anon;
REVOKE ALL ON wms_logs      FROM anon;
REVOKE ALL ON wms_sales     FROM anon;

-- ─── 5. VERIFIKASI ────────────────────────────────────
-- Jalankan query ini untuk cek RLS sudah aktif:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('wms_inventory', 'wms_logs', 'wms_sales');
-- Kolom "rowsecurity" harus bernilai TRUE untuk semua tabel.
