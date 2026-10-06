-- ========================================================
-- Baliuag City Tricycle Franchise & MTOP Management System
-- Supabase PostgreSQL Database Schema
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT, -- Stored password or hash for direct custom auth
    role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'operator', 'president', 'toda_president', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    toda_name VARCHAR(150),
    profile_photo TEXT,
    account_status VARCHAR(50) DEFAULT 'approved' CHECK (account_status IN ('pending', 'approved', 'rejected')),
    admin_permissions JSONB DEFAULT '["security", "requirements", "payment", "analytics", "president"]'::jsonb,
    current_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username & role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(account_status);

-- 2. USER SESSIONS (For Single-Session Enforcement)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_role VARCHAR(50) NOT NULL CHECK (applicant_role IN ('driver', 'operator')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('new', 'renewal')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    
    -- Driver & Vehicle Information
    driver_name VARCHAR(255),
    license_number VARCHAR(100),
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    motor_number VARCHAR(100) NOT NULL,
    chassis_number VARCHAR(100) NOT NULL,
    vehicle_color VARCHAR(50) NOT NULL,
    
    -- Route / TODA Information
    toda_name VARCHAR(150) NOT NULL,
    route_area TEXT NOT NULL,
    
    -- Uploaded Requirements / Documents (JSONB array)
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Workflow Progress
    inspection JSONB,
    treasurer_payment JSONB,
    toda_approval JSONB,
    
    -- President Endorsement Workflow
    president_endorsed BOOLEAN DEFAULT FALSE,
    president_endorsed_at TIMESTAMPTZ,
    president_endorsed_by VARCHAR(255),
    president_remarks TEXT,
    
    -- Effectivity Dates (Start & End Date for Registration / Renewal period)
    start_date DATE,
    end_date DATE,
    
    -- Fees
    base_fee NUMERIC(10, 2) DEFAULT 0,
    toda_fee NUMERIC(10, 2) DEFAULT 0,
    late_penalty NUMERIC(10, 2) DEFAULT 0,
    total_fee NUMERIC(10, 2) DEFAULT 0,
    
    -- Admin Approval / Review
    admin_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    mtop_number VARCHAR(100),
    qr_code_url TEXT,
    
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_plate ON public.applications(plate_number);

-- 4. FRANCHISES TABLE
CREATE TABLE IF NOT EXISTS public.franchises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mtop_number VARCHAR(100) UNIQUE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    operator_name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    driver_name VARCHAR(255) NOT NULL,
    
    -- Vehicle Info
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    motor_number VARCHAR(100) NOT NULL,
    chassis_number VARCHAR(100) NOT NULL,
    vehicle_color VARCHAR(50) NOT NULL,
    
    -- Route
    toda_name VARCHAR(150) NOT NULL,
    route_area TEXT NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'pending')),
    start_date DATE,
    end_date DATE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    renewal_date TIMESTAMPTZ NOT NULL,
    qr_code_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_franchises_mtop ON public.franchises(mtop_number);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON public.franchises(status);

-- 5. DYNAMIC ADVERTISEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    category VARCHAR(50) DEFAULT 'announcement' CHECK (category IN ('sponsor', 'announcement', 'partner', 'promo')),
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    display_order INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DYNAMIC INFORMATION & ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.information_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('news', 'guideline', 'fare_matrix', 'toda_info', 'ordinance')),
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    published_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PENALTIES TABLE
CREATE TABLE IF NOT EXISTS public.penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    driver_name VARCHAR(255) NOT NULL,
    plate_number VARCHAR(50) NOT NULL,
    toda_name VARCHAR(150) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    issued_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    remarks TEXT,
    issued_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SMS NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.sms_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE
);

-- 9. PAYMENTS & RECEIPTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payer_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    qr_code_data TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FEE CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.fee_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mtop_base_fee NUMERIC(10, 2) DEFAULT 850.00,
    toda_route_fee NUMERIC(10, 2) DEFAULT 250.00,
    toda_membership_fee NUMERIC(10, 2) DEFAULT 150.00,
    stenciling_fee NUMERIC(10, 2) DEFAULT 100.00,
    late_penalty_per_month NUMERIC(10, 2) DEFAULT 150.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.information_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read of active advertisements & information items
CREATE POLICY "Public can view active advertisements"
    ON public.advertisements FOR SELECT
    USING (is_active = true);

CREATE POLICY "Public can view active information items"
    ON public.information_items FOR SELECT
    USING (is_active = true);

-- Allow public read of fee configs
CREATE POLICY "Public can view fee configs"
    ON public.fee_configs FOR SELECT
    USING (true);

-- Allow authenticated / service access (permissive policies for client-side API app)
CREATE POLICY "Full access for profiles"
    ON public.profiles FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for applications"
    ON public.applications FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for franchises"
    ON public.franchises FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for advertisements"
    ON public.advertisements FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for information items"
    ON public.information_items FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for penalties"
    ON public.penalties FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for sms notifications"
    ON public.sms_notifications FOR ALL
    USING (true) WITH CHECK (true);

CREATE POLICY "Full access for payments"
    ON public.payments FOR ALL
    USING (true) WITH CHECK (true);

-- ========================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION
-- Bucket Name: Files
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('Files', 'Files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Files bucket
CREATE POLICY "Public Read Access for Files Bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'Files');

CREATE POLICY "Public Insert Access for Files Bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'Files');

CREATE POLICY "Public Update Access for Files Bucket"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'Files');

CREATE POLICY "Public Delete Access for Files Bucket"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'Files');

-- ========================================================
-- SEED INITIAL DATA
-- ========================================================

-- Insert Default Fee Config
INSERT INTO public.fee_configs (mtop_base_fee, toda_route_fee, toda_membership_fee, stenciling_fee, late_penalty_per_month)
VALUES (850.00, 250.00, 150.00, 100.00, 150.00)
ON CONFLICT DO NOTHING;

-- Insert Default Admin User
INSERT INTO public.profiles (username, password_hash, role, first_name, last_name, email, phone, address, toda_name, account_status, admin_permissions)
VALUES 
('admin', 'admin123', 'admin', 'Super', 'Administrator', 'admin@baliuag.gov.ph', '0917-111-2222', 'Baliuag City Hall, Bulacan', 'BTTMO Baliuag', 'approved', '["security", "requirements", "payment", "analytics", "president"]'::jsonb),
('president_juan', 'pres123', 'president', 'Juan', 'dela Cruz', 'juan.pres@baliuag.gov.ph', '0918-222-3333', 'Poblacion, Baliuag, Bulacan', 'Poblacion TODA', 'approved', '["president"]'::jsonb),
('driver_pedro', 'driver123', 'driver', 'Pedro', 'Santos', 'pedro.santos@gmail.com', '0919-333-4444', 'Concepcion, Baliuag, Bulacan', 'Poblacion TODA', 'approved', '[]'::jsonb),
('operator_maria', 'operator123', 'operator', 'Maria', 'Reyes', 'maria.reyes@gmail.com', '0920-444-5555', 'Subic, Baliuag, Bulacan', 'Subic TODA', 'approved', '[]'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- Insert Initial Advertisements
INSERT INTO public.advertisements (title, description, category, is_active, display_order)
VALUES 
('City Traffic Advisory: Annual MTOP Renewal 2026', 'Ang taunang pagpaparehistro at renewal ng Tricycle Franchise para sa taong 2026 ay bukas na. Siguraduhing kumpleto ang mga requirements bago mag-submit.', 'announcement', true, 1),
('BTTMO Inspection Safety Protocol', 'Pinaaalalahanan ang lahat ng TODA members na dalhin ang orihinal na OR/CR at siguraduhing maayos ang ilaw, preno, at emission ng traysikel para sa stenciling.', 'announcement', true, 2),
('Libreng Stenciling & Emission Assistance', 'Handog ng Lokal na Pamahalaan ng Baliuag katuwang ang BTTMO tuwing Lunes hanggang Biyernes, 8:00 AM - 4:00 PM sa City Hall Grounds.', 'sponsor', true, 3);

-- Insert Initial Information Items
INSERT INTO public.information_items (title, category, content, is_active, published_date)
VALUES 
('Ordinansa Blg. 2024-08: Bagong Taripa ng Pamasahe', 'fare_matrix', 'Alinsunod sa City Ordinance, ang minimum regular fare para sa unang 2 kilometro ay Php 15.00 at Php 2.50 bawat dagdag na kilometro. 20% discount para sa Senior Citizen, PWD, at Estudyante.', true, CURRENT_DATE),
('Mga Kinakailangang Dokumento sa Pagpaparehistro', 'guideline', '1. Valid Driver''s License (Professional) 2. Latest LTO Official Receipt & Certificate of Registration (OR/CR) 3. Barangay Clearance mula sa nasasakupang barangay 4. TODA Certificate of Endorsement 5. 2x2 ID Picture.', true, CURRENT_DATE),
('Direktoryo ng mga Akreditadong TODA sa Baliuag', 'toda_info', 'Kasalukuyang may 12 rehistradong TODA sa Baliuag City kabilang ang Poblacion TODA, Subic TODA, Concepcion TODA, Tibag TODA, Tarcan TODA, at San Jose TODA.', true, CURRENT_DATE);
