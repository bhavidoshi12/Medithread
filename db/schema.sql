-- ==============================================================================
-- MediThread: AI-Enabled Health Memory Timeline Platform
-- PostgreSQL Database Schema Architecture & Security Policies
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Users & Authentication
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'patient_caregiver', -- 'patient_caregiver', 'doctor_specialist'
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. Households (Family Unit Container)
-- ------------------------------------------------------------------------------
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    primary_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. Household Member Profiles (Multi-Generational Profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE member_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- 'Self', 'Spouse', 'Son', 'Daughter', 'Father', 'Mother'
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL, -- 'Male', 'Female', 'Other'
    blood_group VARCHAR(10) NOT NULL, -- 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    avatar_color VARCHAR(50) DEFAULT '#0EA5E9',
    avatar_initials VARCHAR(4),
    
    -- Emergency Banner Core Vitals & Critical Alerts
    major_allergies JSONB DEFAULT '[]'::jsonb, -- e.g. ["Penicillin (Anaphylaxis)", "Peanuts"]
    chronic_conditions JSONB DEFAULT '[]'::jsonb, -- e.g. ["Type 2 Diabetes", "Essential Hypertension"]
    emergency_contacts JSONB DEFAULT '[]'::jsonb, -- [{"name": "David", "relation": "Spouse", "phone": "+1 555-0192"}]
    organ_donor BOOLEAN DEFAULT FALSE,
    dnr_order BOOLEAN DEFAULT FALSE,
    insurance_policy VARCHAR(100),
    primary_physician VARCHAR(150),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. Health Events (Chronological Timeline Store)
-- ------------------------------------------------------------------------------
CREATE TYPE event_category AS ENUM ('diagnosis', 'lab_report', 'medication', 'procedure_vaccine');
CREATE TYPE event_severity AS ENUM ('routine', 'monitoring_needed', 'critical', 'resolved');

CREATE TABLE health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category event_category NOT NULL,
    event_date DATE NOT NULL,
    severity event_severity DEFAULT 'routine',
    clinical_summary TEXT NOT NULL,
    provider_name VARCHAR(255),
    facility_name VARCHAR(255),
    
    -- Structured Metadata for specific event types
    structured_data JSONB DEFAULT '{}'::jsonb,
    -- Examples:
    -- Lab: {"markers": [{"name": "HbA1c", "value": 7.4, "unit": "%", "status": "elevated", "ref": "4.0-5.6"}]}
    -- Medication: {"drug": "Metformin", "dose": "500mg", "freq": "Twice daily with meals", "status": "active"}
    -- Procedure: {"anesthesia": "General", "recovery_days": 14, "implant_serial": "ST-9921"}
    
    source_document_url TEXT,
    source_document_name VARCHAR(255),
    ocr_raw_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. Longitudinal Biomarker Progression Series
-- ------------------------------------------------------------------------------
CREATE TABLE biomarker_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES health_events(id) ON DELETE SET NULL,
    marker_name VARCHAR(100) NOT NULL, -- e.g. 'HbA1c', 'Systolic BP', 'Diastolic BP', 'LDL', 'eGFR'
    marker_code VARCHAR(50), -- LOINC or standard taxonomy code
    marker_value NUMERIC(10,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    reference_low NUMERIC(10,2),
    reference_high NUMERIC(10,2),
    is_abnormal BOOLEAN DEFAULT FALSE,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. Multi-Context AI Clinical Summaries
-- ------------------------------------------------------------------------------
CREATE TYPE summary_context_type AS ENUM ('emergency_brief', 'doctor_consultation', 'travel_passport', 'custom_query');

CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    context_type summary_context_type NOT NULL,
    generated_content JSONB NOT NULL,
    ai_model_used VARCHAR(50) DEFAULT 'gemini-1.5-pro',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. Preventive Care Gaps & Clinical Reminders
-- ------------------------------------------------------------------------------
CREATE TYPE gap_urgency AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE gap_status AS ENUM ('open', 'scheduled', 'acknowledged', 'dismissed');

CREATE TABLE care_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    guideline_source VARCHAR(100) NOT NULL, -- 'USPSTF', 'ADA', 'CDC', 'AAP'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    urgency gap_urgency DEFAULT 'moderate',
    status gap_status DEFAULT 'open',
    overdue_months INT DEFAULT 0,
    due_date DATE,
    action_taken_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. Secure Doctor Sharing Tokens & Access Logs
-- ------------------------------------------------------------------------------
CREATE TABLE doctor_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    doctor_email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    access_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    clinical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 9. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX idx_member_profiles_household ON member_profiles(household_id);
CREATE INDEX idx_health_events_profile_date ON health_events(profile_id, event_date DESC);
CREATE INDEX idx_health_events_category ON health_events(category);
CREATE INDEX idx_biomarkers_profile_marker ON biomarker_series(profile_id, marker_name, recorded_date);
CREATE INDEX idx_care_gaps_profile_status ON care_gaps(profile_id, status);
CREATE INDEX idx_doctor_tokens_token ON doctor_access_tokens(token);

-- ------------------------------------------------------------------------------
-- 10. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarker_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY household_owner_all ON households
    FOR ALL USING (primary_owner_id = current_setting('app.current_user_id')::uuid);
