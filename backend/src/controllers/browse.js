const browseService = require("../services/browse");
const logger = require("../utils/logger");

const getOfficialUpdates = async (req, res) => {
	const { sources } = req.query;
	try {
		const updates = await browseService.fetchOfficialUpdates(sources);
		res.json({
			results: updates,
			count: updates.length,
		});
	} catch (error) {
		logger.error("Error in getOfficialUpdates controller:", error);
		res.status(500).json({ error: "Failed to fetch official updates." });
	}
};

const getAvailableSources = (req, res) => {
	try {
		const sources = browseService.getAvailableSources();
		res.json({
			available_sources: sources,
			count: sources.length,
		});
	} catch (error) {
		logger.error("Error in getAvailableSources controller:", error);
		res.status(500).json({ error: "Failed to fetch available sources." });
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

const searchOfficialUpdates = async (req, res) => {
	const { q, sources, category, severity, limit = 50, offset = 0 } = req.query;
	try {
		let updates = await browseService.fetchOfficialUpdates(
			sources ? sources.split(",") : ["all"]
		);

		if (q) {
			const keywords = q.toLowerCase();
			updates = updates.filter(
				(update) =>
					update.title.toLowerCase().includes(keywords) ||
					update.content.toLowerCase().includes(keywords) ||
					update.source.toLowerCase().includes(keywords)
			);
		}

		if (category) {
			updates = updates.filter((update) => update.category === category);
		}

		if (severity) {
			updates = updates.filter((update) => update.severity === severity);
		}

		const paginatedUpdates = updates.slice(
			parseInt(offset),
			parseInt(offset) + parseInt(limit)
		);

		res.json({
			results: paginatedUpdates,
			count: updates.length,
		});
	} catch (error) {
		logger.error("Error in searchOfficialUpdates controller:", error);
		res.status(500).json({ error: "Failed to search official updates." });
	}
};

module.exports = {
	getOfficialUpdates,
	getAvailableSources,
	getUpdatesByCategory,
	searchAllUpdates,
	searchOfficialUpdates,
};
