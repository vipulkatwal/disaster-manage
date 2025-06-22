const browseService = require("../services/browse");
const logger = require("../utils/logger");

const getOfficialUpdates = async (req, res) => {
	try {
		const { id: disaster_id } = req.params;
		const { sources = "all", category, limit = 20 } = req.query;

		logger.info(`Fetching official updates for disaster ${disaster_id}`);

		const updates = await browseService.fetchOfficialUpdates(
			sources.split(",")
		);

		let filteredUpdates = updates;

		if (category && category !== "all") {
			filteredUpdates = browseService.filterOfficialUpdates(updates, {
				category,
			});
		}

		filteredUpdates = filteredUpdates.slice(0, parseInt(limit));

		res.json({
			disaster_id,
			total_updates: filteredUpdates.length,
			sources_used: sources,
			category: category || "all",
			last_updated: new Date().toISOString(),
			updates: filteredUpdates,
		});
	} catch (error) {
		logger.error("Error fetching official updates:", error);
		res.status(500).json({ error: "Failed to fetch official updates" });
	}
};

const getAvailableSources = async (req, res) => {
	try {
		const sources = [
			{
				id: "ndma",
				name: "NDMA",
				description: "National Disaster Management Authority",
				url: "https://ndma.gov.in",
				categories: ["shelter", "official", "federal"],
				active: true,
			},
			{
				id: "indianredcross",
				name: "Indian Red Cross Society",
				description: "Indian Red Cross Society",
				url: "https://indianredcross.org",
				categories: ["volunteer", "shelter", "supplies"],
				active: true,
			},
			{
				id: "mumbai",
				name: "Mumbai Municipal Corporation",
				description: "Mumbai Municipal Corporation",
				url: "https://mcgm.gov.in",
				categories: ["local", "supplies", "official"],
				active: true,
			},
			{
				id: "imd",
				name: "IMD",
				description: "India Meteorological Department",
				url: "https://mausam.imd.gov.in",
				categories: ["weather", "alerts", "federal"],
				active: true,
			},
			{
				id: "delhi",
				name: "Delhi Disaster Management Authority",
				description: "Delhi Disaster Management Authority",
				url: "https://ddma.delhi.gov.in",
				categories: ["local", "emergency", "official"],
				active: true,
			},
			{
				id: "karnataka",
				name: "Karnataka State Disaster Management Authority",
				description: "Karnataka State Disaster Management Authority",
				url: "https://ksdma.karnataka.gov.in",
				categories: ["state", "emergency", "official"],
				active: true,
			},
			{
				id: "tamilnadu",
				name: "Tamil Nadu State Disaster Management Authority",
				description: "Tamil Nadu State Disaster Management Authority",
				url: "https://tnsdma.tn.gov.in",
				categories: ["state", "emergency", "official"],
				active: true,
			},
			{
				id: "himachal",
				name: "Himachal Pradesh Disaster Management Authority",
				description: "Himachal Pradesh Disaster Management Authority",
				url: "https://hpsdma.hp.gov.in",
				categories: ["state", "emergency", "official"],
				active: true,
			},
		];

		res.json({
			available_sources: sources,
			total_sources: sources.length,
		});
	} catch (error) {
		logger.error("Error getting available sources:", error);
		res.status(500).json({
			error: "Failed to get available sources",
			message: error.message,
		});
	}
};

const getUpdatesByCategory = async (req, res) => {
	try {
		const { category } = req.params;
		const { sources = "all", limit = 20 } = req.query;

		logger.info(`Fetching updates for category: ${category}`);

		const updates = await browseService.fetchOfficialUpdates(
			sources.split(",")
		);
		const filteredUpdates = browseService.filterOfficialUpdates(updates, {
			category,
		});

		res.json({
			category,
			total_updates: filteredUpdates.length,
			sources_used: sources,
			last_updated: new Date().toISOString(),
			updates: filteredUpdates.slice(0, parseInt(limit)),
		});
	} catch (error) {
		logger.error("Error fetching updates by category:", error);
		res.status(500).json({ error: "Failed to fetch updates by category" });
	}
};

const searchAllUpdates = async (req, res) => {
	try {
		const { q, sources = "all", limit = 50 } = req.query;

		if (!q) {
			return res.status(400).json({ error: "Search query is required" });
		}

		logger.info(`Searching updates for query: ${q}`);

		const updates = await browseService.fetchOfficialUpdates(
			sources.split(",")
		);
		const searchResults = browseService.searchOfficialUpdates(updates, q);

		res.json({
			query: q,
			total_results: searchResults.length,
			sources_used: sources,
			last_updated: new Date().toISOString(),
			results: searchResults.slice(0, parseInt(limit)),
		});
	} catch (error) {
		logger.error("Error searching updates:", error);
		res.status(500).json({ error: "Failed to search updates" });
	}
};

module.exports = {
	getOfficialUpdates,
	getAvailableSources,
	getUpdatesByCategory,
	searchAllUpdates,
};
