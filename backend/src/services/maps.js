const axios = require("axios");
const { getCachedData, setCachedData } = require("../middleware/cache");
const logger = require("../utils/logger");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

const geocodeLocation = async (locationName) => {
	try {
		const cacheKey = `geocode_${Buffer.from(locationName)
			.toString("base64")
			.substring(0, 50)}`;
		const cachedResult = await getCachedData(cacheKey);
		if (cachedResult) {
			logger.info(`Geocoding cache hit for: ${locationName}`);
			return cachedResult;
		}

		// Try Google Maps first
		if (GOOGLE_MAPS_API_KEY) {
			try {
				const result = await geocodeWithGoogleMaps(locationName);
				if (result) {
					await setCachedData(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
					return result;
				}
			} catch (error) {
				logger.warn("Google Maps geocoding failed, trying alternatives");
			}
		}

		// Try Mapbox second
		if (MAPBOX_ACCESS_TOKEN) {
			try {
				const result = await geocodeWithMapbox(locationName);
				if (result) {
					await setCachedData(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
					return result;
				}
			} catch (error) {
				logger.warn("Mapbox geocoding failed, trying OpenStreetMap");
			}
		}

		// Fallback to OpenStreetMap (Nominatim)
		try {
			const result = await geocodeWithOpenStreetMap(locationName);
			if (result) {
				await setCachedData(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
				return result;
			}
		} catch (error) {
			logger.error("All geocoding services failed");
		}

		return null;
	} catch (error) {
		logger.error("Error in geocodeLocation:", error.message);
		return null;
	}
};

const geocodeWithGoogleMaps = async (locationName) => {
	try {
		const response = await axios.get(
			"https://maps.googleapis.com/maps/api/geocode/json",
			{
				params: {
					address: locationName,
					key: GOOGLE_MAPS_API_KEY,
				},
				timeout: 10000,
			}
		);

		if (response.data.status === "OK" && response.data.results.length > 0) {
			const result = response.data.results[0];
			const location = result.geometry.location;

			logger.info(
				`Google Maps geocoding successful: ${locationName} -> ${location.lat}, ${location.lng}`
			);
			return {
				lat: location.lat,
				lng: location.lng,
				formatted_address: result.formatted_address,
				provider: "google_maps",
			};
		}

		throw new Error(`Google Maps geocoding failed: ${response.data.status}`);
	} catch (error) {
		logger.error("Google Maps geocoding error:", error.message);
		throw error;
	}
};

const geocodeWithMapbox = async (locationName) => {
	try {
		const response = await axios.get(
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
				locationName
			)}.json`,
			{
				params: {
					access_token: MAPBOX_ACCESS_TOKEN,
					limit: 1,
					types: "place,address",
				},
				timeout: 10000,
			}
		);

		if (response.data.features && response.data.features.length > 0) {
			const feature = response.data.features[0];
			const [lng, lat] = feature.center;

			logger.info(
				`Mapbox geocoding successful: ${locationName} -> ${lat}, ${lng}`
			);
			return {
				lat,
				lng,
				formatted_address: feature.place_name,
				provider: "mapbox",
			};
		}

		throw new Error("Mapbox geocoding returned no results");
	} catch (error) {
		logger.error("Mapbox geocoding error:", error.message);
		throw error;
	}
};

const geocodeWithOpenStreetMap = async (locationName) => {
	try {
		const response = await axios.get(
			"https://nominatim.openstreetmap.org/search",
			{
				params: {
					q: locationName,
					format: "json",
					limit: 1,
					addressdetails: 1,
				},
				headers: {
					"User-Agent": "DisasterResponsePlatform/1.0",
				},
				timeout: 15000,
			}
		);

		if (response.data && response.data.length > 0) {
			const result = response.data[0];

			logger.info(
				`OpenStreetMap geocoding successful: ${locationName} -> ${result.lat}, ${result.lon}`
			);
			return {
				lat: parseFloat(result.lat),
				lng: parseFloat(result.lon),
				formatted_address: result.display_name,
				provider: "openstreetmap",
			};
		}

		throw new Error("OpenStreetMap geocoding returned no results");
	} catch (error) {
		logger.error("OpenStreetMap geocoding error:", error.message);
		throw error;
	}
};

const reverseGeocode = async (lat, lng) => {
	try {
		const cacheKey = `reverse_geocode_${lat}_${lng}`;
		const cachedResult = await getCachedData(cacheKey);
		if (cachedResult) {
			return cachedResult;
		}

		// Try OpenStreetMap for reverse geocoding (no API key required)
		try {
			const response = await axios.get(
				"https://nominatim.openstreetmap.org/reverse",
				{
					params: {
						lat,
						lon: lng,
						format: "json",
						addressdetails: 1,
					},
					headers: {
						"User-Agent": "DisasterResponsePlatform/1.0",
					},
					timeout: 10000,
				}
			);

			if (response.data && response.data.display_name) {
				const result = {
					address: response.data.display_name,
					city: response.data.address?.city || response.data.address?.town,
					state: response.data.address?.state,
					country: response.data.address?.country,
					provider: "openstreetmap",
				};

				await setCachedData(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours
				return result;
			}
		} catch (error) {
			logger.error("Reverse geocoding error:", error.message);
		}

		return null;
	} catch (error) {
		logger.error("Error in reverseGeocode:", error.message);
		return null;
	}
};

module.exports = {
	geocodeLocation,
	geocodeWithGoogleMaps,
	geocodeWithMapbox,
	geocodeWithOpenStreetMap,
	reverseGeocode,
};
