-- Disaster Response Platform Database Schema
-- Run this in your Supabase SQL editor

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Disasters table
CREATE TABLE IF NOT EXISTS disasters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    audit_trail JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active',
    priority TEXT DEFAULT 'medium',
    verified BOOLEAN DEFAULT false
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    verification_status TEXT DEFAULT 'pending',
    verification_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    priority TEXT DEFAULT 'low',
    location GEOGRAPHY(POINT, 4326),
    tags TEXT[] DEFAULT '{}'
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location_name TEXT,
    location GEOGRAPHY(POINT, 4326),
    type TEXT NOT NULL,
    description TEXT,
    contact_info TEXT,
    capacity INTEGER,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}'
);

-- Cache table for API responses
CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media posts table
CREATE TABLE IF NOT EXISTS social_media_posts (
    id TEXT PRIMARY KEY,
    disaster_id UUID REFERENCES disasters(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    post TEXT NOT NULL,
    username TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    priority TEXT DEFAULT 'low',
    verified BOOLEAN DEFAULT false,
    location TEXT,
    hashtags TEXT[] DEFAULT '{}',
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Official updates table
CREATE TABLE IF NOT EXISTS official_updates (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    severity TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'official',
    contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}'
);

-- Priority alerts table
CREATE TABLE IF NOT EXISTS priority_alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL,
    source_id TEXT,
    location TEXT,
    disaster_types TEXT[] DEFAULT '{}',
    score FLOAT,
    confidence FLOAT,
    requires_acknowledgment BOOLEAN DEFAULT false,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actions JSONB DEFAULT '[]'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_disasters_location ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_disasters_tags ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_disasters_owner ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS idx_disasters_created_at ON disasters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disasters_priority ON disasters (priority);

CREATE INDEX IF NOT EXISTS idx_reports_disaster_id ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports (priority);
CREATE INDEX IF NOT EXISTS idx_reports_verification_status ON reports (verification_status);

CREATE INDEX IF NOT EXISTS idx_resources_disaster_id ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS idx_resources_location ON resources USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources (type);
CREATE INDEX IF NOT EXISTS idx_resources_available ON resources (available);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_social_media_disaster_id ON social_media_posts (disaster_id);
CREATE INDEX IF NOT EXISTS idx_social_media_priority ON social_media_posts (priority);
CREATE INDEX IF NOT EXISTS idx_social_media_timestamp ON social_media_posts (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_social_media_hashtags ON social_media_posts USING GIN (hashtags);

CREATE INDEX IF NOT EXISTS idx_official_updates_source ON official_updates (source);
CREATE INDEX IF NOT EXISTS idx_official_updates_severity ON official_updates (severity);
CREATE INDEX IF NOT EXISTS idx_official_updates_category ON official_updates (category);
CREATE INDEX IF NOT EXISTS idx_official_updates_published_at ON official_updates (published_at DESC);

CREATE INDEX IF NOT EXISTS idx_priority_alerts_priority ON priority_alerts (priority);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_type ON priority_alerts (type);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_created_at ON priority_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_priority_alerts_acknowledged ON priority_alerts (acknowledged_at);

-- Create geospatial functions
CREATE OR REPLACE FUNCTION get_nearby_resources(
    p_disaster_id UUID,
    p_lat FLOAT,
    p_lon FLOAT,
    p_radius INTEGER DEFAULT 10000,
    p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    disaster_id UUID,
    name TEXT,
    location_name TEXT,
    type TEXT,
    description TEXT,
    contact_info TEXT,
    created_at TIMESTAMPTZ,
    distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.disaster_id,
        r.name,
        r.location_name,
        r.type,
        r.description,
        r.contact_info,
        r.created_at,
        ST_Distance(r.location, ST_SetSRID(ST_Point(p_lon, p_lat), 4326)) as distance
    FROM resources r
    WHERE r.disaster_id = p_disaster_id
    AND ST_DWithin(r.location, ST_SetSRID(ST_Point(p_lon, p_lat), 4326), p_radius)
    AND (p_type IS NULL OR r.type = p_type)
    AND r.available = true
    ORDER BY distance ASC;
END;
$$;

-- Function to find disasters within a radius
CREATE OR REPLACE FUNCTION get_nearby_disasters(
    p_lat FLOAT,
    p_lon FLOAT,
    p_radius INTEGER DEFAULT 50000,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    location_name TEXT,
    description TEXT,
    tags TEXT[],
    priority TEXT,
    distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.location_name,
        d.description,
        d.tags,
        d.priority,
        ST_Distance(d.location, ST_SetSRID(ST_Point(p_lon, p_lat), 4326)) as distance
    FROM disasters d
    WHERE ST_DWithin(d.location, ST_SetSRID(ST_Point(p_lon, p_lat), 4326), p_radius)
    AND (p_tags IS NULL OR d.tags && p_tags)
    AND d.status = 'active'
    ORDER BY distance ASC;
END;
$$;

-- Function to get disaster statistics
CREATE OR REPLACE FUNCTION get_disaster_stats()
RETURNS TABLE (
    total_disasters BIGINT,
    active_disasters BIGINT,
    urgent_disasters BIGINT,
    total_reports BIGINT,
    total_resources BIGINT,
    avg_response_time INTERVAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_disasters,
        COUNT(*) FILTER (WHERE status = 'active') as active_disasters,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_disasters,
        (SELECT COUNT(*) FROM reports) as total_reports,
        (SELECT COUNT(*) FROM resources WHERE available = true) as total_resources,
        AVG(updated_at - created_at) as avg_response_time
    FROM disasters;
END;
$$;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_disasters_updated_at BEFORE UPDATE ON disasters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a scheduled job to clean expired cache (if using pg_cron)
-- SELECT cron.schedule('clean-cache', '0 */6 * * *', 'SELECT clean_expired_cache();');

-- Insert sample data for testing with Indian locations
INSERT INTO disasters (title, location_name, location, description, tags, owner_id, priority) VALUES
('Flood in Mumbai', 'Mumbai, Maharashtra', ST_SetSRID(ST_Point(72.8777, 19.0760), 4326), 'Severe flooding affecting South Mumbai area due to heavy monsoon rains', ARRAY['flood', 'urgent'], 'netrunnerX', 'urgent'),
('Fire in Delhi', 'Delhi, National Capital Territory', ST_SetSRID(ST_Point(77.2090, 28.6139), 4326), 'Large fire in residential area of Old Delhi', ARRAY['fire', 'high'], 'netrunnerX', 'high'),
('Earthquake in Bangalore', 'Bangalore, Karnataka', ST_SetSRID(ST_Point(77.5946, 12.9716), 4326), 'Minor earthquake felt in Bangalore city area', ARRAY['earthquake', 'medium'], 'netrunnerX', 'medium'),
('Cyclone in Chennai', 'Chennai, Tamil Nadu', ST_SetSRID(ST_Point(80.2707, 13.0827), 4326), 'Cyclone warning issued for Chennai coastal areas', ARRAY['cyclone', 'high'], 'netrunnerX', 'high'),
('Landslide in Shimla', 'Shimla, Himachal Pradesh', ST_SetSRID(ST_Point(77.1734, 31.1048), 4326), 'Landslide blocking major highway in Shimla district', ARRAY['landslide', 'urgent'], 'netrunnerX', 'urgent')
ON CONFLICT DO NOTHING;

INSERT INTO resources (disaster_id, name, location_name, location, type, description, contact_info) VALUES
((SELECT id FROM disasters WHERE title = 'Flood in Mumbai' LIMIT 1), 'Emergency Shelter', 'Bandra Kurla Complex', ST_SetSRID(ST_Point(72.8647, 19.0596), 4326), 'shelter', 'Emergency shelter for flood victims in Mumbai', '022-24937746'),
((SELECT id FROM disasters WHERE title = 'Flood in Mumbai' LIMIT 1), 'Medical Center', 'JJ Hospital', ST_SetSRID(ST_Point(72.8333, 18.9750), 4326), 'medical', 'Emergency medical services for flood affected', '022-23735555'),
((SELECT id FROM disasters WHERE title = 'Fire in Delhi' LIMIT 1), 'Fire Station', 'Connaught Place Fire Station', ST_SetSRID(ST_Point(77.2090, 28.6139), 4326), 'fire', 'Fire department response unit for Delhi', '011-23469000'),
((SELECT id FROM disasters WHERE title = 'Earthquake in Bangalore' LIMIT 1), 'Emergency Response Center', 'Koramangala', ST_SetSRID(ST_Point(77.6245, 12.9352), 4326), 'emergency', 'Emergency response coordination center', '080-22221188'),
((SELECT id FROM disasters WHERE title = 'Cyclone in Chennai' LIMIT 1), 'Coastal Shelter', 'Marina Beach Area', ST_SetSRID(ST_Point(80.2833, 13.0827), 4326), 'shelter', 'Coastal evacuation shelter for cyclone victims', '044-28520100'),
((SELECT id FROM disasters WHERE title = 'Landslide in Shimla' LIMIT 1), 'Mountain Rescue', 'Shimla Ridge', ST_SetSRID(ST_Point(77.1734, 31.1048), 4326), 'rescue', 'Mountain rescue team for landslide response', '0177-2658000')
ON CONFLICT DO NOTHING;