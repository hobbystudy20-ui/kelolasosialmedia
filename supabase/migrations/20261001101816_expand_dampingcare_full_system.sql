/*
# Expand Dampingcare to full management system

## Overview
Expands the existing Dampingcare database from a simple sosmed manager into a complete internal management system. Adds new tables for users, services, areas, revenue, expenses, payments, transportation, inventory, documents, sosmed metrics, feedback, and activity logs. Also adds new columns to existing tables (teams, bookings, content_planner, content_schedule, captions).

## New Tables (12)
1. `users` - User/patient management (not auth users)
2. `services` - Service catalog with pricing
3. `service_areas` - Geographic service areas
4. `revenue` - Revenue/transactions
5. `operational_expenses` - Operational cost tracking
6. `payments` - Payment management
7. `transportation` - Transport records linked to bookings
8. `inventory` - Inventory items
9. `documents` - SOP & document management
10. `sosmed_metrics` - Social media performance metrics per content/date
11. `feedback` - User satisfaction feedback
12. `activity_log` - Global activity tracking

## Modified Tables (5)
- `teams`: Added photo, education, services_can_handle, notes, archived columns
- `bookings`: Added booking_id_code, user_id, team_member_id, service_id, start_time, end_time, financial fields, payment fields, notes, archived
- `content_planner`: Added topic, content_pillar, caption, cta, hashtags, target_audience, team_member_id, archived
- `content_schedule`: Added content_title, team_member_id, archived
- `captions`: Added cta, hashtags, archived

## Security
All new tables have RLS enabled with anon+authenticated access (no-auth single-tenant app).
All policies use USING (true) since data is intentionally shared.
*/

-- =============================================
-- 1. ALTER EXISTING TABLES (add columns only)
-- =============================================

-- teams: add new columns
ALTER TABLE teams ADD COLUMN IF NOT EXISTS photo text DEFAULT '';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS education_background text DEFAULT '';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS services_can_handle text DEFAULT '';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_notes text DEFAULT '';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- bookings: add new columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_id_code text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS team_member_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id uuid;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_fee numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transport_fee numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_fee numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dp_amount numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS remaining_balance numeric DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Belum Bayar';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_notes text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_notes text DEFAULT '';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- content_planner: add new columns
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS topic text DEFAULT '';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS content_pillar text DEFAULT '';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS caption text DEFAULT '';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS cta text DEFAULT '';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS hashtags text DEFAULT '';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS target_audience text DEFAULT '';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS team_member_id uuid;
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- content_schedule: add new columns
ALTER TABLE content_schedule ADD COLUMN IF NOT EXISTS content_title text DEFAULT '';
ALTER TABLE content_schedule ADD COLUMN IF NOT EXISTS team_member_id uuid;
ALTER TABLE content_schedule ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- captions: add new columns
ALTER TABLE captions ADD COLUMN IF NOT EXISTS cta text DEFAULT '';
ALTER TABLE captions ADD COLUMN IF NOT EXISTS hashtags text DEFAULT '';
ALTER TABLE captions ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- =============================================
-- 2. NEW TABLES
-- =============================================

-- users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  email text DEFAULT '',
  patient_name text DEFAULT '',
  patient_contact text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'Aktif',
  total_transactions numeric DEFAULT 0,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric DEFAULT 0,
  price_unit text DEFAULT 'per layanan',
  duration text DEFAULT '',
  status text DEFAULT 'Aktif',
  notes text DEFAULT '',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_services" ON services;
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_services" ON services;
CREATE POLICY "anon_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_services" ON services;
CREATE POLICY "anon_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_services" ON services;
CREATE POLICY "anon_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- service_areas table
CREATE TABLE IF NOT EXISTS service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  district text NOT NULL DEFAULT '',
  status text DEFAULT 'Aktif',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_service_areas" ON service_areas;
CREATE POLICY "anon_select_service_areas" ON service_areas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_service_areas" ON service_areas;
CREATE POLICY "anon_insert_service_areas" ON service_areas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_service_areas" ON service_areas;
CREATE POLICY "anon_update_service_areas" ON service_areas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_service_areas" ON service_areas;
CREATE POLICY "anon_delete_service_areas" ON service_areas FOR DELETE TO anon, authenticated USING (true);

-- revenue table
CREATE TABLE IF NOT EXISTS revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text DEFAULT '',
  date text NOT NULL,
  booking_id uuid,
  user_id uuid,
  service text DEFAULT '',
  service_fee numeric DEFAULT 0,
  transport_fee numeric DEFAULT 0,
  additional_fee numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  payment_status text DEFAULT 'Belum Bayar',
  payment_method text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_revenue" ON revenue;
CREATE POLICY "anon_select_revenue" ON revenue FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_revenue" ON revenue;
CREATE POLICY "anon_insert_revenue" ON revenue FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_revenue" ON revenue;
CREATE POLICY "anon_update_revenue" ON revenue FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_revenue" ON revenue;
CREATE POLICY "anon_delete_revenue" ON revenue FOR DELETE TO anon, authenticated USING (true);

-- operational_expenses table
CREATE TABLE IF NOT EXISTS operational_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id text DEFAULT '',
  date text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  amount numeric DEFAULT 0,
  payment_method text DEFAULT '',
  person text DEFAULT '',
  booking_id uuid,
  receipt text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_operational_expenses" ON operational_expenses;
CREATE POLICY "anon_select_operational_expenses" ON operational_expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_operational_expenses" ON operational_expenses;
CREATE POLICY "anon_insert_operational_expenses" ON operational_expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_operational_expenses" ON operational_expenses;
CREATE POLICY "anon_update_operational_expenses" ON operational_expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_operational_expenses" ON operational_expenses;
CREATE POLICY "anon_delete_operational_expenses" ON operational_expenses FOR DELETE TO anon, authenticated USING (true);

-- payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text DEFAULT '',
  booking_id uuid,
  user_id uuid,
  total_bill numeric DEFAULT 0,
  dp_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  remaining_balance numeric DEFAULT 0,
  payment_status text DEFAULT 'Belum Bayar',
  payment_date text DEFAULT '',
  payment_method text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- transportation table
CREATE TABLE IF NOT EXISTS transportation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_id text DEFAULT '',
  booking_id uuid,
  user_id uuid,
  team_member_id uuid,
  date text NOT NULL,
  transport_type text NOT NULL DEFAULT 'Motor',
  origin text DEFAULT '',
  destination text DEFAULT '',
  cost numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transportation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transportation" ON transportation;
CREATE POLICY "anon_select_transportation" ON transportation FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transportation" ON transportation;
CREATE POLICY "anon_insert_transportation" ON transportation FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transportation" ON transportation;
CREATE POLICY "anon_update_transportation" ON transportation FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transportation" ON transportation;
CREATE POLICY "anon_delete_transportation" ON transportation FOR DELETE TO anon, authenticated USING (true);

-- inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text DEFAULT '',
  item text NOT NULL,
  category text DEFAULT '',
  quantity integer DEFAULT 1,
  condition text DEFAULT 'Baik',
  location text DEFAULT '',
  responsible_person text DEFAULT '',
  purchase_date text DEFAULT '',
  purchase_price numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inventory" ON inventory;
CREATE POLICY "anon_select_inventory" ON inventory FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inventory" ON inventory;
CREATE POLICY "anon_insert_inventory" ON inventory FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inventory" ON inventory;
CREATE POLICY "anon_update_inventory" ON inventory FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory;
CREATE POLICY "anon_delete_inventory" ON inventory FOR DELETE TO anon, authenticated USING (true);

-- documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'SOP',
  version text DEFAULT '1.0',
  upload_date text DEFAULT '',
  updated_date text DEFAULT '',
  description text DEFAULT '',
  file_url text DEFAULT '',
  status text DEFAULT 'Aktif',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

-- sosmed_metrics table
CREATE TABLE IF NOT EXISTS sosmed_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  platform text NOT NULL,
  content_title text DEFAULT '',
  content_type text DEFAULT '',
  followers integer DEFAULT 0,
  followers_growth integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  profile_visits integer DEFAULT 0,
  link_clicks integer DEFAULT 0,
  dm_inquiries integer DEFAULT 0,
  service_inquiries integer DEFAULT 0,
  bookings_generated integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sosmed_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sosmed_metrics" ON sosmed_metrics;
CREATE POLICY "anon_select_sosmed_metrics" ON sosmed_metrics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sosmed_metrics" ON sosmed_metrics;
CREATE POLICY "anon_insert_sosmed_metrics" ON sosmed_metrics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sosmed_metrics" ON sosmed_metrics;
CREATE POLICY "anon_update_sosmed_metrics" ON sosmed_metrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sosmed_metrics" ON sosmed_metrics;
CREATE POLICY "anon_delete_sosmed_metrics" ON sosmed_metrics FOR DELETE TO anon, authenticated USING (true);

-- feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id text DEFAULT '',
  booking_id uuid,
  user_id uuid,
  user_name text DEFAULT '',
  service text DEFAULT '',
  team_member_id uuid,
  team_member_name text DEFAULT '',
  rating integer DEFAULT 5,
  what_went_well text DEFAULT '',
  what_could_improve text DEFAULT '',
  suggestion text DEFAULT '',
  complaint text DEFAULT '',
  feedback_type text DEFAULT 'Positif',
  date text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_feedback" ON feedback;
CREATE POLICY "anon_select_feedback" ON feedback FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback;
CREATE POLICY "anon_insert_feedback" ON feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_feedback" ON feedback;
CREATE POLICY "anon_update_feedback" ON feedback FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_feedback" ON feedback;
CREATE POLICY "anon_delete_feedback" ON feedback FOR DELETE TO anon, authenticated USING (true);

-- activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  time text DEFAULT '',
  actor text DEFAULT '',
  activity text NOT NULL,
  module text DEFAULT '',
  related_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activity_log" ON activity_log;
CREATE POLICY "anon_select_activity_log" ON activity_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_log" ON activity_log;
CREATE POLICY "anon_insert_activity_log" ON activity_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity_log" ON activity_log;
CREATE POLICY "anon_update_activity_log" ON activity_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_log" ON activity_log;
CREATE POLICY "anon_delete_activity_log" ON activity_log FOR DELETE TO anon, authenticated USING (true);

-- =============================================
-- 3. INSERT SAMPLE DATA
-- =============================================

-- Sample services
INSERT INTO services (name, category, description, price, price_unit, duration, status) VALUES
('Pendampingan Pasien di RS', 'Pendampingan Pasien', 'Pendampingan pasien selama perawatan di rumah sakit', 350000, 'per hari', '8 jam', 'Aktif'),
('Pendampingan Non-Pasien', 'Pendampingan Non-Pasien', 'Pendampingan untuk keperluan non-medis', 250000, 'per hari', '6 jam', 'Aktif'),
('Antar Jemput Motor', 'Anjem', 'Antar jemput menggunakan motor', 50000, 'per trip', '1 jam', 'Aktif'),
('Antar Jemput Mobil', 'Anjem', 'Antar jemput menggunakan mobil', 100000, 'per trip', '1 jam', 'Aktif'),
('Jastip Mobil', 'Jastip', 'Jasa titip belanja menggunakan mobil', 75000, 'per trip', '2 jam', 'Aktif'),
('Jastip Motor', 'Jastip', 'Jasa titip belanja menggunakan motor', 40000, 'per trip', '1 jam', 'Aktif'),
('Pendampingan Kontrol', 'Pendampingan Pasien', 'Pendampingan pasien untuk kontrol rutin', 200000, 'per kunjungan', '4 jam', 'Aktif'),
('Pendampingan Rawat Inap', 'Pendampingan Pasien', 'Pendampingan pasien rawat inap 24 jam', 500000, 'per hari', '24 jam', 'Aktif'),
('Pendampingan Rawat Jalan', 'Pendampingan Pasien', 'Pendampingan pasien rawat jalan', 175000, 'per kunjungan', '4 jam', 'Aktif'),
('Pasca Rawat Inap', 'Pendampingan Non-Pasien', 'Pendampingan pasca rawat inap di rumah', 300000, 'per hari', '8 jam', 'Aktif'),
('Minimal Care', 'Pendampingan Non-Pasien', 'Perawatan minimal di rumah', 275000, 'per hari', '6 jam', 'Aktif')
ON CONFLICT DO NOTHING;

-- Sample service areas
INSERT INTO service_areas (city, district, status) VALUES
('Solo', 'Laweyan', 'Aktif'),
('Solo', 'Serengan', 'Aktif'),
('Solo', 'Pasar Kliwon', 'Aktif'),
('Solo', 'Jebres', 'Aktif'),
('Solo', 'Banjarsari', 'Aktif'),
('Sukoharjo', 'Kartasura', 'Aktif'),
('Sukoharjo', 'Grogol', 'Aktif'),
('Karanganyar', 'Karanganyar Kota', 'Aktif'),
('Boyolali', 'Boyolali Kota', 'Aktif'),
('Klaten', 'Klaten Kota', 'Aktif'),
('Yogyakarta', 'Sleman', 'Aktif')
ON CONFLICT DO NOTHING;

-- Sample users
INSERT INTO users (name, whatsapp, email, patient_name, patient_contact, address, city, notes, status) VALUES
('Siti Aminah', '081234567890', 'siti.aminah@email.com', 'Bapak Sutrisno', '081298765432', 'Jl. Slamet Riyadi No. 45', 'Solo', 'Pasien jantung, perlu pendamping rutin', 'Aktif'),
('Budi Santoso', '082134567891', 'budi.santoso@email.com', 'Ibu Ratna', '082198765431', 'Jl. Adi Sucipto No. 12', 'Sukoharjo', 'Kontrol bulanan', 'Aktif'),
('Dewi Lestari', '083145678902', 'dewi.lestari@email.com', '', '', 'Jl. Gajah Mada No. 78', 'Karanganyar', 'Jastip rutin', 'Aktif'),
('Rudi Hartono', '081567891234', 'rudi.hartono@email.com', 'Ibu Sri', '081598761234', 'Jl. Diponegoro No. 23', 'Solo', 'Anjem ke RS Moewardi', 'Aktif'),
('Maya Sari', '087812345678', 'maya.sari@email.com', 'Bapak Wiyono', '087898765432', 'Jl. Ahmad Yani No. 56', 'Boyolali', 'Pendampingan rawat jalan', 'Aktif'),
('Joko Prabowo', '081345678901', 'joko.prabowo@email.com', '', '', 'Jl. Veteran No. 34', 'Klaten', 'Pendampingan non-pasien', 'Aktif'),
('Nur Hidayah', '085678901234', 'nur.hidayah@email.com', 'Bapak Slamet', '085698761234', 'Jl. Monginsidi No. 89', 'Solo', 'Pasca rawat inap', 'Aktif'),
('Agus Wijaya', '089012345678', 'agus.wijaya@email.com', 'Ibu Endang', '089098761234', 'Jl. Yos Sudarso No. 11', 'Yogyakarta', 'Pendampingan kontrol', 'Aktif')
ON CONFLICT DO NOTHING;

-- Sample operational expenses
INSERT INTO operational_expenses (expense_id, date, category, description, amount, payment_method, person, notes) VALUES
('EXP-20261001-001', '2026-10-01', 'BBM', 'Isi bensin motor pendamping', 25000, 'Cash', 'Rudi Hartono', 'Pendampingan ke RS Moewardi'),
('EXP-20261001-002', '2026-10-01', 'Makan', 'Uang makan tim pendamping', 50000, 'Cash', 'Siti Aminah', 'Makan siang'),
('EXP-20261002-001', '2026-10-02', 'Parkir', 'Parkir RS Moewardi', 5000, 'Cash', 'Rudi Hartono', 'Parkir 4 jam'),
('EXP-20261002-002', '2026-10-02', 'ATK', 'Print formulir consent', 15000, 'Cash', 'Admin', 'Print 10 lembar'),
('EXP-20261003-001', '2026-10-03', 'Advertising', 'Iklan Instagram', 100000, 'Transfer', 'Admin Sosmed', 'Promosi layanan'),
('EXP-20261003-002', '2026-10-03', 'Internet', 'Kuota internet tim', 50000, 'Transfer', 'Admin', 'Kuota bulanan'),
('EXP-20261004-001', '2026-10-04', 'Tol', 'Tol Solo-Klaten PP', 30000, 'Cash', 'Joko Prabowo', 'Anjem pasien'),
('EXP-20261005-001', '2026-10-05', 'Perlengkapan Caregiver', 'Sarung tangan steril', 35000, 'Cash', 'Admin', 'Box 100 pcs')
ON CONFLICT DO NOTHING;

-- Sample sosmed metrics
INSERT INTO sosmed_metrics (date, platform, content_title, content_type, followers, followers_growth, reach, impressions, views, likes, comments, shares, saves, profile_visits, link_clicks, dm_inquiries, service_inquiries, bookings_generated) VALUES
('2026-10-01', 'Instagram', 'Tips Pendampingan Pasien di RS', 'Educational', 1250, 15, 3200, 4500, 0, 180, 25, 12, 35, 89, 15, 8, 5, 2),
('2026-10-01', 'TikTok', 'Sehari Bersama Caregiver', 'Reels', 890, 32, 8500, 12000, 8500, 450, 60, 45, 80, 120, 25, 18, 12, 4),
('2026-10-02', 'Instagram', 'Testimoni: Pengalaman User Dampingcare', 'Testimonial', 1265, 12, 2800, 3900, 0, 210, 35, 18, 42, 95, 20, 15, 10, 3),
('2026-10-02', 'TikTok', 'Anjem Pasien Solo', 'TikTok', 922, 28, 6200, 8800, 6200, 380, 45, 30, 55, 85, 18, 14, 8, 2),
('2026-10-03', 'Instagram', 'Promo Layanan Pendampingan Kontrol', 'Promotional', 1277, 10, 2100, 3100, 0, 95, 12, 8, 15, 65, 30, 22, 15, 5),
('2026-10-03', 'Facebook', 'Informasi Layanan Dampingcare', 'Informational', 560, 5, 1500, 2200, 0, 45, 8, 5, 10, 30, 12, 6, 4, 1),
('2026-10-04', 'Instagram', 'Carousel: Cara Memilih Layanan Pendamping', 'Carousel', 1290, 13, 3500, 4800, 0, 195, 28, 15, 38, 92, 18, 12, 8, 3),
('2026-10-04', 'TikTok', 'Q&A: Jastip vs Anjem', 'TikTok', 950, 22, 7200, 10000, 7200, 410, 55, 38, 60, 78, 22, 16, 10, 3),
('2026-10-05', 'Instagram', 'Story: Sehari di Dampingcare', 'Story', 1305, 15, 2900, 4100, 0, 160, 20, 10, 25, 88, 14, 10, 6, 2),
('2026-10-05', 'TikTok', 'Behind the Scenes Tim Dampingcare', 'Reels', 975, 25, 9800, 13500, 9800, 520, 70, 50, 90, 135, 28, 20, 14, 5)
ON CONFLICT DO NOTHING;

-- Sample feedback
INSERT INTO feedback (feedback_id, booking_id, user_id, user_name, service, team_member_name, rating, what_went_well, what_could_improve, suggestion, complaint, feedback_type, date) VALUES
('FB-001', null, null, 'Siti Aminah', 'Pendampingan Pasien di RS', 'Siti Aminah', 5, 'Pendamping sangat sabar dan profesional', '', 'Tambahkan layanan malam', '', 'Positif', '2026-10-01'),
('FB-002', null, null, 'Budi Santoso', 'Pendampingan Kontrol', 'Rudi Hartono', 4, 'Tepat waktu', 'Mohon komunikasi lebih sering', '', '', 'Positif', '2026-10-02'),
('FB-003', null, null, 'Dewi Lestari', 'Jastip Motor', 'Joko Prabowo', 5, 'Cepat dan amanah', '', 'Saya sangat puas', '', 'Positif', '2026-10-03'),
('FB-004', null, null, 'Maya Sari', 'Pendampingan Rawat Jalan', 'Nur Hidayah', 3, 'Pendamping ramah', 'Waktu tunggu cukup lama', 'Mohon lebih tepat waktu', '', 'Saran', '2026-10-04'),
('FB-005', null, null, 'Agus Wijaya', 'Antar Jemput Mobil', 'Rudi Hartono', 5, 'Driver sangat profesional', '', '', '', 'Positif', '2026-10-05')
ON CONFLICT DO NOTHING;

-- Sample inventory
INSERT INTO inventory (item_id, item, category, quantity, condition, location, responsible_person, purchase_date, purchase_price, notes) VALUES
('INV-001', 'Kursi Roda Lipat', 'Peralatan', 2, 'Baik', 'Kantor Solo', 'Admin', '2026-08-15', 750000, 'Untuk pinjam ke user'),
('INV-002', 'Tensimeter Digital', 'Peralatan Medis', 3, 'Baik', 'Kantor Solo', 'Admin', '2026-08-15', 250000, 'Cek rutin'),
('INV-003', 'Sarung Tangan Steril', 'Perlengkapan Caregiver', 5, 'Baik', 'Kantor Solo', 'Admin', '2026-09-01', 35000, 'Box 100 pcs'),
('INV-004', 'Jas Hujan', 'Peralatan', 4, 'Baik', 'Kantor Solo', 'Admin', '2026-07-20', 45000, 'Untuk tim anjem'),
('INV-005', 'Kotak P3K', 'Peralatan Medis', 2, 'Perlu Perbaikan', 'Kantor Solo', 'Admin', '2026-06-10', 85000, 'Perlu restock isi')
ON CONFLICT DO NOTHING;

-- Sample documents
INSERT INTO documents (name, category, version, upload_date, updated_date, description, file_url, status) VALUES
('SOP Pendampingan Pasien', 'SOP', '1.0', '2026-08-01', '2026-08-01', 'Standar operasional pendampingan pasien', '', 'Aktif'),
('SOP Antar Jemput', 'SOP', '1.0', '2026-08-01', '2026-08-01', 'Standar operasional antar jemput', '', 'Aktif'),
('Consent Form Pendampingan', 'Consent', '1.0', '2026-08-01', '2026-08-01', 'Form persetujuan pendampingan', '', 'Aktif'),
('Agreement Layanan Dampingcare', 'Agreement', '1.0', '2026-08-01', '2026-08-01', 'Perjanjian layanan dengan user', '', 'Aktif'),
('Template Laporan Harian', 'Templates', '1.0', '2026-08-01', '2026-08-01', 'Template laporan harian pendamping', '', 'Aktif')
ON CONFLICT DO NOTHING;

-- Sample transportation
INSERT INTO transportation (transport_id, booking_id, user_id, team_member_id, date, transport_type, origin, destination, cost, notes) VALUES
('TRP-001', null, null, null, '2026-10-01', 'Motor', 'Kantor Dampingcare Solo', 'RS Moewardi Solo', 15000, 'Anjem pasien'),
('TRP-002', null, null, null, '2026-10-02', 'Mobil', 'RS Moewardi Solo', 'Jl. Slamet Riyadi No. 45', 25000, 'Pulang RS'),
('TRP-003', null, null, null, '2026-10-03', 'Motor', 'Jl. Adi Sucipto No. 12', 'RS PKU Muhammadiyah', 20000, 'Kontrol pasien')
ON CONFLICT DO NOTHING;

-- Sample activity log
INSERT INTO activity_log (date, time, actor, activity, module) VALUES
('2026-10-01', '08:30', 'Admin', 'Booking baru dibuat: Siti Aminah - Pendampingan Pasien di RS', 'Booking'),
('2026-10-01', '09:15', 'Admin', 'Pembayaran DP diterima: Rp 100.000', 'Pembayaran'),
('2026-10-01', '10:00', 'Admin', 'Tim ditugaskan: Siti Aminah untuk booking DC-20261001-001', 'Booking'),
('2026-10-02', '14:20', 'Admin', 'Booking selesai: Budi Santoso - Pendampingan Kontrol', 'Booking'),
('2026-10-03', '11:00', 'Admin Sosmed', 'Content diposting: Tips Pendampingan Pasien di RS', 'Sosmed'),
('2026-10-03', '15:30', 'Admin', 'Biaya operasional ditambahkan: BBM Rp 25.000', 'Keuangan'),
('2026-10-04', '09:45', 'Admin', 'Feedback User masuk: Maya Sari - rating 3', 'Evaluasi'),
('2026-10-05', '13:00', 'Admin', 'Booking dibatalkan: Agus Wijaya', 'Booking')
ON CONFLICT DO NOTHING;
