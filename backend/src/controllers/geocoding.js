const { extractLocationFromDescription } = require("../services/gemini");
const { geocodeLocation } = require("../services/maps");
const logger = require("../utils/logger");

const geocodeLocationController = async (req, res) => {
	try {
		const { location_name, description } = req.body;

		if (!location_name && !description) {
			return res.status(400).json({
				error: "Either location_name or description is required",
			});
		}

		let finalLocationName = location_name;
		let extractedFromDescription = false;

		if (!location_name && description) {
			try {
				finalLocationName = await extractLocationFromDescription(description);
				extractedFromDescription = true;

				if (!finalLocationName) {
					return res.status(400).json({
						error:
							"Could not extract location from description. Please provide a specific location name.",
						suggestion:
							"Try including a city, town, or specific area name in your description.",
					});
				}
			} catch (error) {
				logger.error("Error extracting location from description:", error);
				return res.status(500).json({
					error: "Failed to extract location from description",
					suggestion: "Please provide a specific location name instead.",
				});
			}
		}

		// Validate that we have a location name to geocode
		if (!finalLocationName || finalLocationName.trim().length === 0) {
			return res.status(400).json({
				error: "No valid location name provided",
				suggestion: "Please provide a specific city, town, or area name.",
			});
		}

		try {
			const coordinates = await geocodeLocation(finalLocationName);

			if (!coordinates) {
				return res.status(400).json({
					error: "Could not find coordinates for the provided location",
					location_name: finalLocationName,
					suggestion:
						"Please check the spelling or try a more specific location name.",
				});
			}

			res.json({
				location_name: finalLocationName,
				coordinates: {
					lat: coordinates.lat,
					lng: coordinates.lng,
				},
				extracted_from_description: extractedFromDescription,
			});
		} catch (error) {
			logger.error("Error geocoding location:", error);
			res.status(500).json({
				error: "Failed to geocode location",
				location_name: finalLocationName,
				suggestion:
					"Please check the spelling or try a more specific location name.",
			});
		}
	} catch (error) {
		logger.error("Error in geocodeLocationController:", error);
		res.status(500).json({ error: "Failed to process geocoding request" });
	}
};

module.exports = {
	geocodeLocation: geocodeLocationController,
};
