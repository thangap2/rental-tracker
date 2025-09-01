-- Migration: Support Multiple Landlords and Tenants per Lease
-- File: 010_multiple_landlords_tenants.sql

-- First, create junction tables for the many-to-many relationships

-- Junction table for lease-tenant relationships
CREATE TABLE lease_tenants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    rent_responsibility DECIMAL(10,2), -- Optional: individual rent responsibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lease_id, tenant_id)
);

-- Junction table for lease-landlord relationships
CREATE TABLE lease_landlords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    ownership_percentage DECIMAL(5,2), -- Optional: ownership percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lease_id, landlord_id)
);

-- Add indexes for performance
CREATE INDEX idx_lease_tenants_lease_id ON lease_tenants(lease_id);
CREATE INDEX idx_lease_tenants_tenant_id ON lease_tenants(tenant_id);
CREATE INDEX idx_lease_landlords_lease_id ON lease_landlords(lease_id);
CREATE INDEX idx_lease_landlords_landlord_id ON lease_landlords(landlord_id);

-- Add RLS policies for the new junction tables
ALTER TABLE lease_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_landlords ENABLE ROW LEVEL SECURITY;

-- RLS policies for lease_tenants
CREATE POLICY "Users can view their lease tenants" ON lease_tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = lease_tenants.lease_id 
            AND leases.realtor_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their lease tenants" ON lease_tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = lease_tenants.lease_id 
            AND leases.realtor_id = auth.uid()
        )
    );

-- RLS policies for lease_landlords
CREATE POLICY "Users can view their lease landlords" ON lease_landlords
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = lease_landlords.lease_id 
            AND leases.realtor_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their lease landlords" ON lease_landlords
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM leases 
            WHERE leases.id = lease_landlords.lease_id 
            AND leases.realtor_id = auth.uid()
        )
    );

-- Migrate existing data from single tenant/landlord to junction tables
-- Insert existing tenant relationships
INSERT INTO lease_tenants (lease_id, tenant_id, is_primary, rent_responsibility)
SELECT 
    id,
    tenant_id,
    true, -- Mark as primary tenant
    monthly_rent -- Full rent responsibility for single tenant
FROM leases 
WHERE tenant_id IS NOT NULL;

-- Insert existing landlord relationships
INSERT INTO lease_landlords (lease_id, landlord_id, is_primary, ownership_percentage)
SELECT 
    id,
    landlord_id,
    true, -- Mark as primary landlord
    100.00 -- Full ownership for single landlord
FROM leases 
WHERE landlord_id IS NOT NULL;

-- Add a transition period where both old and new columns exist
-- We'll keep the old columns for backward compatibility during deployment
-- They can be dropped in a future migration once the application is updated

-- Add comments for documentation
COMMENT ON TABLE lease_tenants IS 'Junction table for many-to-many relationship between leases and tenants';
COMMENT ON TABLE lease_landlords IS 'Junction table for many-to-many relationship between leases and landlords';
COMMENT ON COLUMN lease_tenants.is_primary IS 'Indicates if this is the primary tenant contact for the lease';
COMMENT ON COLUMN lease_tenants.rent_responsibility IS 'Amount of rent this tenant is responsible for';
COMMENT ON COLUMN lease_landlords.is_primary IS 'Indicates if this is the primary landlord contact for the lease';
COMMENT ON COLUMN lease_landlords.ownership_percentage IS 'Percentage of property ownership for this landlord';

-- Create functions to get tenants and landlords for a lease
CREATE OR REPLACE FUNCTION get_lease_tenants(lease_uuid UUID)
RETURNS TABLE(
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    is_primary BOOLEAN,
    rent_responsibility DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        lt.is_primary,
        lt.rent_responsibility
    FROM lease_tenants lt
    JOIN contacts c ON c.id = lt.tenant_id
    WHERE lt.lease_id = lease_uuid
    ORDER BY lt.is_primary DESC, c.first_name, c.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_lease_landlords(lease_uuid UUID)
RETURNS TABLE(
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    is_primary BOOLEAN,
    ownership_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        ll.is_primary,
        ll.ownership_percentage
    FROM lease_landlords ll
    JOIN contacts c ON c.id = ll.landlord_id
    WHERE ll.lease_id = lease_uuid
    ORDER BY ll.is_primary DESC, c.first_name, c.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_lease_tenants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_lease_landlords(UUID) TO authenticated;
