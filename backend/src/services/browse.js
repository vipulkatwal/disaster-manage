const axios = require("axios");
const cheerio = require("cheerio");
const { getCachedData, setCachedData } = require("../middleware/cache");
const logger = require("../utils/logger");

const mockOfficialUpdates = [
	{
		id: "fema-1",
		source: "FEMA",
		title: "Emergency Shelter Locations Updated",
		content:
			"New emergency shelters have been opened in Manhattan and Brooklyn.",
		url: "https://www.fema.gov/disaster-updates",
		published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
		severity: "high",
		category: "shelter",
	},
	{
		id: "redcross-1",
		source: "American Red Cross",
		title: "Volunteer Registration Open",
		content:
			"The Red Cross is accepting volunteer registrations for disaster relief efforts.",
		url: "https://www.redcross.org/volunteer",
		published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		severity: "low",
		category: "volunteer",
	},
	{
		id: "nyc-1",
		source: "NYC Emergency Management",
		title: "Water Distribution Points Active",
		content:
			"Water distribution is now active at Central Park and Prospect Park locations.",
		url: "https://www.nyc.gov/site/em/index.page",
		published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		severity: "medium",
		category: "supplies",
	},
	{
		id: "weather-1",
		source: "National Weather Service",
		title: "Flash Flood Warning Issued",
		content:
			"A flash flood warning is in effect for the tri-state area until 8 PM.",
		url: "https://www.weather.gov/alerts",
		published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		severity: "high",
		category: "weather",
	},
];

const scrapeFEMAUpdates = async () => {
	try {
		logger.warn("FEMA scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "FEMA");
	} catch (error) {
		logger.error("Error scraping FEMA updates:", error.message);
		return mockOfficialUpdates.filter((update) => update.source === "FEMA");
	}
};

const scrapeRedCrossUpdates = async () => {
	try {
		logger.warn("Red Cross scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "American Red Cross"
		);
	} catch (error) {
		logger.error("Error scraping Red Cross updates:", error.message);
		return mockOfficialUpdates.filter(
			(update) => update.source === "American Red Cross"
		);
	}
};

const scrapeNYCEmergencyUpdates = async () => {
	try {
		logger.warn("NYC Emergency scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "NYC Emergency Management"
		);
	} catch (error) {
		logger.error("Error scraping NYC Emergency updates:", error.message);
		return mockOfficialUpdates.filter(
			(update) => update.source === "NYC Emergency Management"
		);
	}
};

const scrapeWeatherServiceUpdates = async () => {
	try {
		logger.warn("Weather Service scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "National Weather Service"
		);
	} catch (error) {
		logger.error("Error scraping Weather Service updates:", error.message);
		return mockOfficialUpdates.filter(
			(update) => update.source === "National Weather Service"
		);
	}
};

const fetchOfficialUpdates = async (sources = ["all"]) => {
	try {
		if (sources.includes("all")) {
			return mockOfficialUpdates;
		}
		return mockOfficialUpdates.filter((update) =>
			sources.includes(update.source)
		);
	} catch (error) {
		logger.error("Error fetching official updates:", error);
		return mockOfficialUpdates;
	}
};

const filterOfficialUpdates = (updates, { category }) => {
	return updates.filter((update) => update.category === category);
};

const OFFICIAL_SOURCES = [
	{
		id: "fema",
		name: "FEMA",
		description: "Federal Emergency Management Agency",
		url: "https://www.fema.gov/disaster-updates",
		categories: ["shelter", "official", "federal"],
		active: true,
	},
	{
		id: "redcross",
		name: "American Red Cross",
		description: "Humanitarian organization providing emergency assistance",
		url: "https://www.redcross.org/get-help/disaster-relief-and-recovery-services.html",
		categories: ["volunteer", "shelter", "supplies"],
		active: true,
	},
	{
		id: "nyc",
		name: "NYC Emergency Management",
		description: "New York City's emergency management agency",
		url: "https://www.nyc.gov/site/em/index.page",
		categories: ["local", "supplies", "official"],
		active: true,
	},
	{
		id: "weather",
		name: "National Weather Service",
		description: "Weather forecasts and warnings",
		url: "https://www.weather.gov/alerts",
		categories: ["weather", "alerts", "federal"],
		active: true,
	},
];

const getAvailableSources = () => {
	return OFFICIAL_SOURCES;
};

const determineSeverity = (text) => {
	const lowerText = text.toLowerCase();
	if (
		lowerText.includes("urgent") ||
		lowerText.includes("immediate") ||
		lowerText.includes("warning")
	) {
		return "high";
	}
	if (
		lowerText.includes("advisory") ||
		lowerText.includes("update") ||
		lowerText.includes("watch")
	) {
		return "medium";
	}
	return "low";
};

module.exports = {
	fetchOfficialUpdates,
	filterOfficialUpdates,
	scrapeFEMAUpdates,
	scrapeRedCrossUpdates,
	scrapeNYCEmergencyUpdates,
	scrapeWeatherServiceUpdates,
	getAvailableSources,
	determineSeverity,
};
