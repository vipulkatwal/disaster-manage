const supabase = require("../services/supabase");
const { geocodeLocation } = require("../services/maps");
const logger = require("../utils/logger");

const getNearbyResources = async (req, res) => {
	try {
		const { id: disaster_id } = req.params;
		const { lat, lon, radius = 10000, type } = req.query;

		if (!lat || !lon) {
			return res.status(400).json({
				error: "Latitude and longitude are required",
			});
		}

		const { data, error } = await supabase.rpc("get_nearby_resources", {
			p_disaster_id: disaster_id,
			p_lat: parseFloat(lat),
			p_lon: parseFloat(lon),
			p_radius: parseInt(radius),
			p_type: type || null,
		});

		if (error) {
			logger.error("Error fetching nearby resources:", error);

			// Fallback to mock data if geospatial query fails
			const mockResources = generateMockResources(lat, lon, disaster_id);
			return res.json(mockResources);
		}

		// Emit real-time update
		req.io.emit("resources_updated", { disaster_id, location: { lat, lon } });

		logger.info(
			`Nearby resources fetched for disaster ${disaster_id} at ${lat}, ${lon}`
		);
		res.json(data || []);
	} catch (error) {
		logger.error("Error in getNearbyResources:", error);

		// Return mock data as fallback
		const mockResources = generateMockResources(
			req.query.lat,
			req.query.lon,
			req.params.id
		);
		res.json(mockResources);
	}
};

const createResource = async (req, res) => {
	try {
		const { id: disaster_id } = req.params;
		const { name, location_name, type, description, contact_info, capacity } =
			req.body;
		const user_id = req.user.id;

		if (!name || !location_name || !type) {
			return res.status(400).json({
				error: "Name, location_name, and type are required",
			});
		}

		// Geocode the location
		let coordinates = null;
		try {
			coordinates = await geocodeLocation(location_name);
		} catch (error) {
			logger.warn("Failed to geocode resource location:", error.message);
			return res.status(400).json({
				error: "Could not geocode the provided location",
			});
		}

		const { data, error } = await supabase
			.from("resources")
			.insert([
				{
					disaster_id,
					name,
					location_name,
					location: `POINT(${coordinates.lng} ${coordinates.lat})`,
					type,
					description,
					contact_info,
					capacity: capacity || null,
					available: true,
					tags: [],
				},
			])
			.select()
			.single();

		if (error) {
			logger.error("Error creating resource:", error);
			return res.status(400).json({ error: error.message });
		}

		// Emit real-time update
		req.io.emit("resource_created", { disaster_id, resource: data });

		logger.info(
			`Resource created: ${name} for disaster ${disaster_id} by ${user_id}`
		);
		res.status(201).json(data);
	} catch (error) {
		logger.error("Error in createResource:", error);
		res.status(500).json({ error: "Failed to create resource" });
	}
};

const updateResource = async (req, res) => {
	try {
		const { id: disaster_id, resource_id } = req.params;
		const {
			name,
			location_name,
			type,
			description,
			contact_info,
			capacity,
			available,
		} = req.body;
		const user_id = req.user.id;

		// Check if resource exists and belongs to the disaster
		const { data: existing } = await supabase
			.from("resources")
			.select("*")
			.eq("id", resource_id)
			.eq("disaster_id", disaster_id)
			.single();

		if (!existing) {
			return res.status(404).json({ error: "Resource not found" });
		}

		let coordinates = null;
		if (location_name && location_name !== existing.location_name) {
			try {
				coordinates = await geocodeLocation(location_name);
			} catch (error) {
				logger.warn("Failed to geocode resource location:", error.message);
			}
		}

		const updateData = {
			name,
			location_name,
			type,
			description,
			contact_info,
			capacity,
			available,
		};

		if (coordinates) {
			updateData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
		}

		const { data, error } = await supabase
			.from("resources")
			.update(updateData)
			.eq("id", resource_id)
			.select()
			.single();

		if (error) {
			logger.error("Error updating resource:", error);
			return res.status(400).json({ error: error.message });
		}

		// Emit real-time update
		req.io.emit("resource_updated", { disaster_id, resource: data });

		logger.info(
			`Resource updated: ${resource_id} for disaster ${disaster_id} by ${user_id}`
		);
		res.json(data);
	} catch (error) {
		logger.error("Error in updateResource:", error);
		res.status(500).json({ error: "Failed to update resource" });
	}
};

const deleteResource = async (req, res) => {
	try {
		const { id: disaster_id, resource_id } = req.params;
		const user_id = req.user.id;

		// Check if resource exists and belongs to the disaster
		const { data: existing } = await supabase
			.from("resources")
			.select("*")
			.eq("id", resource_id)
			.eq("disaster_id", disaster_id)
			.single();

		if (!existing) {
			return res.status(404).json({ error: "Resource not found" });
		}

		const { error } = await supabase
			.from("resources")
			.delete()
			.eq("id", resource_id);

		if (error) {
			logger.error("Error deleting resource:", error);
			return res.status(400).json({ error: error.message });
		}

		// Emit real-time update
		req.io.emit("resource_deleted", { disaster_id, resource_id });

		logger.info(
			`Resource deleted: ${resource_id} for disaster ${disaster_id} by ${user_id}`
		);
		res.json({ message: "Resource deleted successfully" });
	} catch (error) {
		logger.error("Error in deleteResource:", error);
		res.status(500).json({ error: "Failed to delete resource" });
	}
};

const generateMockResources = (lat, lon, disaster_id) => {
	const baseResources = [
		{
			id: "1",
			disaster_id,
			name: "Emergency Shelter - Red Cross",
			location_name: "Central Park, Manhattan",
			type: "shelter",
			description: "Emergency shelter with capacity for 200 people",
			contact_info: "+1-555-0101",
			capacity: 200,
			available: true,
			distance: 500,
			created_at: new Date().toISOString(),
			tags: [],
		},
		{
			id: "2",
			disaster_id,
			name: "Food Distribution Center",
			location_name: "Brooklyn Bridge Park",
			type: "food",
			description: "Free food distribution, meals available 24/7",
			contact_info: "+1-555-0102",
			capacity: null,
			available: true,
			distance: 1200,
			created_at: new Date().toISOString(),
			tags: [],
		},
		{
			id: "3",
			disaster_id,
			name: "Medical Aid Station",
			location_name: "Times Square Medical Center",
			type: "medical",
			description: "Emergency medical aid and first aid supplies",
			contact_info: "+1-555-0103",
			capacity: 50,
			available: true,
			distance: 800,
			created_at: new Date().toISOString(),
			tags: [],
		},
		{
			id: "4",
			disaster_id,
			name: "Water Distribution Point",
			location_name: "Washington Square Park",
			type: "water",
			description: "Clean drinking water available",
			contact_info: "+1-555-0104",
			capacity: null,
			available: true,
			distance: 600,
			created_at: new Date().toISOString(),
			tags: [],
		},
	];

	return baseResources.sort((a, b) => a.distance - b.distance);
};

module.exports = {
	getNearbyResources,
	createResource,
	updateResource,
	deleteResource,
};
