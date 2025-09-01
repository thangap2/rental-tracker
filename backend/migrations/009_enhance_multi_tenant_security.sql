-- Migration: Enhanced Multi-Tenant Security and Isolation
-- File: 009_enhance_multi_tenant_security.sql

-- Enable Row Level Security for all tables if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Add tenant_id column to users table for explicit tenant tracking
-- This helps with admin queries and cross-tenant operations if needed in the future
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT uuid_generate_v4();

-- Update existing users to have their own tenant_id (each user is their own tenant)
UPDATE users SET tenant_id = id WHERE tenant_id IS NULL;

-- Add index for tenant operations
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- ========================================
-- USER TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Users can only view and update their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Allow new user registration (handled by auth.users)
CREATE POLICY "Allow user registration" ON users
    FOR INSERT WITH CHECK (true);

-- ========================================
-- CONTACTS TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

-- Contacts: Users can only access their own contacts
CREATE POLICY "Users can view their own contacts" ON contacts
    FOR SELECT USING (realtor_id = auth.uid());

CREATE POLICY "Users can create their own contacts" ON contacts
    FOR INSERT WITH CHECK (realtor_id = auth.uid());

CREATE POLICY "Users can update their own contacts" ON contacts
    FOR UPDATE USING (realtor_id = auth.uid());

CREATE POLICY "Users can delete their own contacts" ON contacts
    FOR DELETE USING (realtor_id = auth.uid());

-- ========================================
-- PROPERTIES TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own properties" ON properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

-- Properties: Users can only access properties they created
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (realtor_id = auth.uid());

CREATE POLICY "Users can create their own properties" ON properties
    FOR INSERT WITH CHECK (
        realtor_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = properties.owner_id 
            AND contacts.realtor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (
        realtor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = properties.owner_id 
            AND contacts.realtor_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (realtor_id = auth.uid());

-- ========================================
-- LEASES TABLE RLS POLICIES
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own leases" ON leases;
DROP POLICY IF EXISTS "Users can view their own leases" ON leases;
DROP POLICY IF EXISTS "Users can create leases" ON leases;
DROP POLICY IF EXISTS "Users can update their own leases" ON leases;
DROP POLICY IF EXISTS "Users can delete their own leases" ON leases;

-- Leases: Users can only access leases for their properties and contacts
CREATE POLICY "Users can view their own leases" ON leases
    FOR SELECT USING (realtor_id = auth.uid());

CREATE POLICY "Users can create their own leases" ON leases
    FOR INSERT WITH CHECK (
        realtor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = leases.property_id 
            AND properties.realtor_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = leases.tenant_id 
            AND contacts.realtor_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM contacts 
            WHERE contacts.id = leases.landlord_id 
            AND contacts.realtor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own leases" ON leases
    FOR UPDATE USING (
        realtor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = leases.property_id 
            AND properties.realtor_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own leases" ON leases
    FOR DELETE USING (realtor_id = auth.uid());

-- ========================================
-- ENHANCED TENANT ISOLATION VIEWS
-- ========================================

-- Create views for easier tenant-isolated queries
-- These views automatically filter data for the current user

CREATE OR REPLACE VIEW user_contacts AS
SELECT * FROM contacts 
WHERE realtor_id = auth.uid();

CREATE OR REPLACE VIEW user_properties AS
SELECT * FROM properties 
WHERE realtor_id = auth.uid();

CREATE OR REPLACE VIEW user_leases AS
SELECT * FROM leases 
WHERE realtor_id = auth.uid();

-- Create a comprehensive view that joins user data
CREATE OR REPLACE VIEW user_lease_details AS
SELECT 
    l.*,
    p.title as property_title,
    p.street as property_street,
    p.city as property_city,
    p.state as property_state,
    t.first_name as tenant_first_name,
    t.last_name as tenant_last_name,
    t.email as tenant_email,
    t.phone as tenant_phone,
    ll.first_name as landlord_first_name,
    ll.last_name as landlord_last_name,
    ll.email as landlord_email,
    ll.phone as landlord_phone
FROM leases l
JOIN properties p ON l.property_id = p.id
JOIN contacts t ON l.tenant_id = t.id
JOIN contacts ll ON l.landlord_id = ll.id
WHERE l.realtor_id = auth.uid()
    AND p.realtor_id = auth.uid()
    AND t.realtor_id = auth.uid()
    AND ll.realtor_id = auth.uid();

-- ========================================
-- TENANT STATISTICS FUNCTIONS
-- ========================================

-- Function to get tenant statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE(
    total_contacts INTEGER,
    total_properties INTEGER,
    total_leases INTEGER,
    active_leases INTEGER,
    expiring_leases INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM contacts WHERE realtor_id = auth.uid() AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM properties WHERE realtor_id = auth.uid() AND is_active = true),
        (SELECT COUNT(*)::INTEGER FROM leases WHERE realtor_id = auth.uid()),
        (SELECT COUNT(*)::INTEGER FROM leases WHERE realtor_id = auth.uid() AND status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM leases WHERE realtor_id = auth.uid() AND status = 'active' 
            AND end_date <= CURRENT_DATE + INTERVAL '90 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- AUDIT TRAIL ENHANCEMENTS
-- ========================================

-- Add user_id to all update triggers for audit trails
CREATE OR REPLACE FUNCTION update_updated_at_with_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- If the table has a realtor_id column, ensure it matches the current user
    IF TG_TABLE_NAME IN ('contacts', 'properties', 'leases') THEN
        IF NEW.realtor_id != auth.uid() THEN
            RAISE EXCEPTION 'Access denied: Cannot modify records for other users';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers to use the new function
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS update_leases_updated_at ON leases;

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_with_user();

CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON properties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_with_user();

CREATE TRIGGER update_leases_updated_at 
    BEFORE UPDATE ON leases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_with_user();

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify RLS is working
-- Run these queries to test tenant isolation:

/*
-- Test queries (run as different users to verify isolation):

-- 1. Check user can only see their own contacts
SELECT COUNT(*) FROM contacts;

-- 2. Check user can only see their own properties  
SELECT COUNT(*) FROM properties;

-- 3. Check user can only see their own leases
SELECT COUNT(*) FROM leases;

-- 4. Get user statistics
SELECT * FROM get_user_stats();

-- 5. Try to access another user's data (should return empty)
SELECT * FROM contacts WHERE realtor_id != auth.uid(); -- Should return empty

*/

-- Add comments for documentation
COMMENT ON VIEW user_contacts IS 'Automatically filtered view of contacts for the current authenticated user';
COMMENT ON VIEW user_properties IS 'Automatically filtered view of properties for the current authenticated user';
COMMENT ON VIEW user_leases IS 'Automatically filtered view of leases for the current authenticated user';
COMMENT ON VIEW user_lease_details IS 'Comprehensive view joining lease data with property and contact details for the current user';
COMMENT ON FUNCTION get_user_stats() IS 'Returns statistics for the current authenticated user';

-- Success message
SELECT 'Multi-tenant security enhancement completed successfully!' as status;
