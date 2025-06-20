-- Step 2: Add PostgreSQL functions for spatial queries
CREATE OR REPLACE FUNCTION nearby_resources(
    lat FLOAT,
    lon FLOAT,
    radius_meters INTEGER DEFAULT 10000
)
RETURNS TABLE (
    id UUID,
    disaster_id UUID,
    name VARCHAR,
    type VARCHAR,
    location_name VARCHAR,
    status VARCHAR,
    capacity INTEGER,
    current_occupancy INTEGER,
    contact VARCHAR,
    hours VARCHAR,
    services TEXT[],
    distance_meters FLOAT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.disaster_id,
        r.name,
        r.type,
        r.location_name,
        r.status,
        r.capacity,
        r.current_occupancy,
        r.contact,
        r.hours,
        r.services,
        ST_Distance(r.location, ST_GeogFromText('POINT(' || lon || ' ' || lat || ')')) as distance_meters,
        r.created_at,
        r.updated_at
    FROM resources r
    WHERE ST_DWithin(r.location, ST_GeogFromText('POINT(' || lon || ' ' || lat || ')'), radius_meters)
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;

-- Function to get disasters within radius
CREATE OR REPLACE FUNCTION nearby_disasters(
    lat FLOAT,
    lon FLOAT,
    radius_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    location_name VARCHAR,
    description TEXT,
    tags TEXT[],
    status VARCHAR,
    priority VARCHAR,
    owner_id VARCHAR,
    verification_status VARCHAR,
    distance_meters FLOAT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.location_name,
        d.description,
        d.tags,
        d.status,
        d.priority,
        d.owner_id,
        d.verification_status,
        ST_Distance(d.location, ST_GeogFromText('POINT(' || lon || ' ' || lat || ')')) as distance_meters,
        d.created_at,
        d.updated_at
    FROM disasters d
    WHERE d.location IS NOT NULL
    AND ST_DWithin(d.location, ST_GeogFromText('POINT(' || lon || ' ' || lat || ')'), radius_meters)
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql;
