const axios = require("axios");
const cheerio = require("cheerio");
const { getCachedData, setCachedData } = require("../middleware/cache");
const logger = require("../utils/logger");

const mockOfficialUpdates = [
	{
		id: "1",
		source: "NDMA",
		title: "Emergency Shelter Locations Updated",
		content:
			"New emergency shelters have been opened in Mumbai and Delhi. Capacity for 500+ people available.",
		url: "https://ndma.gov.in/disaster-updates",
		published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
		severity: "high",
		category: "shelter",
		contact: "011-26701728",
	},
	{
		id: "2",
		source: "NDRF",
		title: "Water Distribution Points Active",
		content:
			"Water distribution is now active at Bandra Kurla Complex and Andheri locations from 8 AM to 6 PM.",
		url: "https://ndrf.gov.in/emergency",
		published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		severity: "medium",
		category: "supplies",
		contact: "011-26107953",
	},
	{
		id: "3",
		source: "Indian Red Cross Society",
		title: "Volunteer Registration Open",
		content:
			"Indian Red Cross Society is accepting volunteer registrations for disaster relief efforts. Training provided.",
		url: "https://indianredcross.org/volunteer",
		published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		severity: "low",
		category: "volunteer",
		contact: "011-23716441",
	},
	{
		id: "4",
		source: "IMD",
		title: "Cyclone Alert Extended",
		content:
			"Cyclone conditions expected to continue through tomorrow evening. Stay indoors in coastal areas.",
		url: "https://mausam.imd.gov.in/alerts",
		published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		severity: "high",
		category: "weather",
		contact: "011-24631913",
	},
	{
		id: "5",
		source: "NIDM",
		title: "Mobile Food Units Deployed",
		content:
			"Mobile food units are serving hot meals in affected areas. Check locations on our website.",
		url: "https://nidm.gov.in/disaster-relief",
		published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
		severity: "medium",
		category: "food",
		contact: "011-23438285",
	},
];

const scrapeNDMAUpdates = async () => {
	try {
		logger.info("NDMA scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "NDMA");
	} catch (error) {
		logger.error("Error scraping NDMA updates:", error.message);
		return [];
	}
};

const scrapeNDRFUpdates = async () => {
	try {
		logger.info("NDRF scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "NDRF");
	} catch (error) {
		logger.error("Error scraping NDRF updates:", error.message);
		return [];
	}
};

const scrapeIndianRedCrossUpdates = async () => {
	try {
		logger.info("Indian Red Cross scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "Indian Red Cross Society"
		);
	} catch (error) {
		logger.error("Error scraping Indian Red Cross updates:", error.message);
		return [];
	}
};

const scrapeIMDUpdates = async () => {
	try {
		logger.info("IMD scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "IMD");
	} catch (error) {
		logger.error("Error scraping IMD updates:", error.message);
		return [];
	}
};

const scrapeNIDMUpdates = async () => {
	try {
		logger.info("NIDM scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "NIDM");
	} catch (error) {
		logger.error("Error scraping NIDM updates:", error.message);
		return [];
	}
};

const determineSeverity = (text) => {
	const keywords = {
		high: ["urgent", "severe", "critical", "evacuation", "emergency"],
		medium: ["warning", "alert", "moderate", "significant"],
		low: ["advisory", "information", "update", "precaution"],
	};
	const lowerText = text.toLowerCase();
	if (keywords.high.some((k) => lowerText.includes(k))) return "high";
	if (keywords.medium.some((k) => lowerText.includes(k))) return "medium";
	return "low";
};

const determineCategory = (text) => {
	const keywords = {
		shelter: ["shelter", "evacuation center", "housing"],
		supplies: ["supplies", "resources", "distribution"],
		medical: ["medical", "health", "hospital"],
		weather: ["weather", "forecast", "cyclone", "flood", "earthquake"],
		rescue: ["rescue", "search"],
	};
	const lowerText = text.toLowerCase();
	for (const category in keywords) {
		if (keywords[category].some((k) => lowerText.includes(k))) return category;
	}
	return "official";
};

const availableSources = [
	{ id: "ndma", name: "NDMA", scraper: scrapeNDMAUpdates },
	{ id: "ndrf", name: "NDRF", scraper: scrapeNDRFUpdates },
	{
		id: "redcross",
		name: "Indian Red Cross Society",
		scraper: scrapeIndianRedCrossUpdates,
	},
	{ id: "imd", name: "IMD", scraper: scrapeIMDUpdates },
	{ id: "nidm", name: "NIDM", scraper: scrapeNIDMUpdates },
];

const fetchOfficialUpdates = async (sources = ["all"]) => {
	const cacheKey = `official_updates_${sources.join("_")}`;
	const cachedResult = await getCachedData(cacheKey);
	if (cachedResult) {
		logger.info("Official updates served from cache");
		return cachedResult;
	}

	let scrapersToRun = [];
	if (sources.includes("all")) {
		scrapersToRun = availableSources.map((s) => s.scraper);
	} else {
		scrapersToRun = availableSources
			.filter((s) => sources.includes(s.id))
			.map((s) => s.scraper);
	}

	const results = await Promise.allSettled(scrapersToRun.map((s) => s()));

	const updates = results
		.filter((result) => result.status === "fulfilled" && result.value)
		.flatMap((result) => result.value);

	if (updates.length > 0) {
		await setCachedData(cacheKey, updates, 30 * 60 * 1000); // 30 min cache
	}

	logger.info(
		`Official updates scraping: Found ${updates.length} total updates`
	);
	return updates;
};

const getAvailableSources = () => {
	return availableSources.map(({ id, name }) => ({
		id,
		name,
		description: `Official updates from ${name}`,
		active: true, // In a real scenario, this would be dynamic
		url: `https://${name.toLowerCase().replace(/\s/g, "")}.gov.in`,
	}));
};

const filterOfficialUpdates = (updates, category = null, severity = null) => {
	let filtered = updates;
	if (category) {
		filtered = filtered.filter((u) => u.category === category);
	}
	if (severity) {
		filtered = filtered.filter((u) => u.severity === severity);
	}
	return filtered;
};

const searchOfficialUpdates = (updates, keywords) => {
	if (!keywords) return updates;
	const lowerKeywords = keywords.toLowerCase();
	return updates.filter(
		(u) =>
			u.title.toLowerCase().includes(lowerKeywords) ||
			u.content.toLowerCase().includes(lowerKeywords) ||
			u.source.toLowerCase().includes(lowerKeywords)
	);
};

module.exports = {
	fetchOfficialUpdates,
	getAvailableSources,
	filterOfficialUpdates,
	searchOfficialUpdates,
};
