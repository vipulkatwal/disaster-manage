-- Step 2: Add necessary indexes
-- GIST index on location for spatial queries
CREATE INDEX IF NOT EXISTS idx_disasters_location ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_resources_location ON resources USING GIST (location);

-- GIN index on tags for array queries
CREATE INDEX IF NOT EXISTS idx_disasters_tags ON disasters USING GIN (tags);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_disasters_owner_id ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS idx_disasters_status ON disasters (status);
CREATE INDEX IF NOT EXISTS idx_disasters_priority ON disasters (priority);
CREATE INDEX IF NOT EXISTS idx_reports_disaster_id ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_resources_disaster_id ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources (type);
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);
