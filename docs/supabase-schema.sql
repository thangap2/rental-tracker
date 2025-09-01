-- Rental Tracker Database Schema for Supabase (PostgreSQL)
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'realtor' CHECK (role IN ('realtor', 'admin')),
    phone VARCHAR(20),
    license_number VARCHAR(100),
    brokerage VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMP WITH TIME ZONE,
    google_id VARCHAR(255) UNIQUE,
    profile_picture TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    contact_type VARCHAR(20) DEFAULT 'tenant' CHECK (contact_type IN ('tenant', 'landlord', 'both')),
    notes TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'text')),
    is_active BOOLEAN DEFAULT true,
    realtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('apartment', 'house', 'condo', 'townhouse', 'duplex', 'studio', 'other')),
    bedrooms INTEGER CHECK (bedrooms >= 0 AND bedrooms <= 20),
    bathrooms DECIMAL(3,1) CHECK (bathrooms >= 0 AND bathrooms <= 20),
    square_footage INTEGER CHECK (square_footage >= 0),
    year_built INTEGER CHECK (year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM NOW()) + 1),
    amenities TEXT[], -- Array of text for amenities
    parking_spaces INTEGER DEFAULT 0 CHECK (parking_spaces >= 0),
    pet_allowed BOOLEAN DEFAULT false,
    pet_deposit DECIMAL(10,2),
    pet_restrictions TEXT,
    utilities_included TEXT[], -- Array of utilities
    utilities_notes TEXT,
    description TEXT,
    images JSONB, -- JSON array of image objects
    is_active BOOLEAN DEFAULT true,
    owner_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    realtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leases table
CREATE TABLE leases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent >= 0),
    security_deposit DECIMAL(10,2) DEFAULT 0 CHECK (security_deposit >= 0),
    lease_type VARCHAR(20) NOT NULL CHECK (lease_type IN ('fixed', 'month-to-month', 'yearly')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
    renewal_option BOOLEAN DEFAULT false,
    auto_renewal BOOLEAN DEFAULT false,
    notice_required INTEGER DEFAULT 30, -- days
    additional_terms TEXT,
    documents JSONB, -- JSON array of document objects
    payments JSONB, -- JSON array of payment objects
    reminders JSONB, -- JSON array of reminder objects
    realtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_lease_dates CHECK (end_date > start_date),
    CONSTRAINT valid_notice_period CHECK (notice_required >= 0)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_realtor_active ON users(id) WHERE is_active = true;

CREATE INDEX idx_contacts_realtor ON contacts(realtor_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_name ON contacts(first_name, last_name);
CREATE INDEX idx_contacts_active ON contacts(realtor_id) WHERE is_active = true;

CREATE INDEX idx_properties_realtor ON properties(realtor_id);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_location ON properties(city, state);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_active ON properties(realtor_id) WHERE is_active = true;

CREATE INDEX idx_leases_realtor ON leases(realtor_id);
CREATE INDEX idx_leases_property ON leases(property_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_landlord ON leases(landlord_id);
CREATE INDEX idx_leases_dates ON leases(start_date, end_date);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date) WHERE status = 'active';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (users can only see their own data)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (id = auth.uid()::uuid);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid()::uuid);

-- RLS Policies for contacts (realtors can only see their own contacts)
CREATE POLICY "Realtors can view their own contacts" ON contacts FOR SELECT USING (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can insert their own contacts" ON contacts FOR INSERT WITH CHECK (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can update their own contacts" ON contacts FOR UPDATE USING (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can delete their own contacts" ON contacts FOR DELETE USING (realtor_id = auth.uid()::uuid);

-- RLS Policies for properties (realtors can only see their own properties)
CREATE POLICY "Realtors can view their own properties" ON properties FOR SELECT USING (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can insert their own properties" ON properties FOR INSERT WITH CHECK (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can update their own properties" ON properties FOR UPDATE USING (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can delete their own properties" ON properties FOR DELETE USING (realtor_id = auth.uid()::uuid);

-- RLS Policies for leases (realtors can only see their own leases)
CREATE POLICY "Realtors can view their own leases" ON leases FOR SELECT USING (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can insert their own leases" ON leases FOR INSERT WITH CHECK (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can update their own leases" ON leases FOR UPDATE USING (realtor_id = auth.uid()::uuid);
CREATE POLICY "Realtors can delete their own leases" ON leases FOR DELETE USING (realtor_id = auth.uid()::uuid);

-- Create views for easier querying
CREATE VIEW lease_details AS
SELECT 
    l.*,
    p.title as property_title,
    p.street || ', ' || p.city || ', ' || p.state || ' ' || p.zip_code as property_address,
    t.first_name || ' ' || t.last_name as tenant_name,
    t.email as tenant_email,
    t.phone as tenant_phone,
    ll.first_name || ' ' || ll.last_name as landlord_name,
    ll.email as landlord_email,
    ll.phone as landlord_phone,
    CASE 
        WHEN l.end_date < CURRENT_DATE THEN 'expired'
        WHEN l.start_date > CURRENT_DATE THEN 'pending'
        ELSE l.status
    END as computed_status,
    l.end_date - CURRENT_DATE as days_until_expiration
FROM leases l
JOIN properties p ON l.property_id = p.id
JOIN contacts t ON l.tenant_id = t.id
JOIN contacts ll ON l.landlord_id = ll.id;
