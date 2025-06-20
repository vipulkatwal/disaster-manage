-- Step 2: Seed initial data
INSERT INTO disasters (title, location_name, location, description, tags, status, priority, owner_id, verification_status) VALUES
('Manhattan Flooding Emergency', 'Manhattan, NYC', ST_GeogFromText('POINT(-73.9851 40.7589)'), 'Severe flooding in Lower Manhattan affecting subway systems and residential areas', ARRAY['flood', 'urgent', 'evacuation'], 'active', 'critical', 'netrunnerX', 'verified'),
('Brooklyn Bridge Fire', 'Brooklyn Bridge, NYC', ST_GeogFromText('POINT(-73.9969 40.7061)'), 'Small fire reported on Brooklyn Bridge walkway, emergency services responding', ARRAY['fire', 'infrastructure'], 'monitoring', 'medium', 'citizen_reporter', 'pending'),
('Queens Power Outage', 'Queens, NYC', ST_GeogFromText('POINT(-73.7949 40.7282)'), 'Widespread power outage affecting 50,000+ residents', ARRAY['power', 'infrastructure', 'urgent'], 'active', 'high', 'reliefAdmin', 'verified');

INSERT INTO resources (disaster_id, name, type, location_name, location, status, capacity, current_occupancy, contact, hours, services) VALUES
((SELECT id FROM disasters WHERE title = 'Manhattan Flooding Emergency'), 'Brooklyn Community Shelter', 'shelter', '123 Main St, Brooklyn, NY', ST_GeogFromText('POINT(-73.9442 40.6782)'), 'available', 200, 145, '(718) 555-0123', '24/7', ARRAY['Emergency Housing', 'Hot Meals', 'Medical Care']),
((SELECT id FROM disasters WHERE title = 'Manhattan Flooding Emergency'), 'Manhattan Emergency Medical Center', 'medical', '456 Hospital Ave, Manhattan, NY', ST_GeogFromText('POINT(-73.9851 40.7589)'), 'available', NULL, NULL, '(212) 555-0456', '24/7', ARRAY['Emergency Care', 'Trauma Unit', 'Pharmacy']);
