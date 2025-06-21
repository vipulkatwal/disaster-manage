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
		source: "Mumbai Municipal Corporation",
		title: "Water Distribution Points Active",
		content:
			"Water distribution is now active at Bandra Kurla Complex and Andheri locations from 8 AM to 6 PM.",
		url: "https://mcgm.gov.in/emergency",
		published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		severity: "medium",
		category: "supplies",
		contact: "022-24937746",
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
		source: "Delhi Disaster Management Authority",
		title: "Mobile Food Units Deployed",
		content:
			"Mobile food units are serving hot meals in affected areas. Check locations on our website.",
		url: "https://ddma.delhi.gov.in/disaster-relief",
		published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
		severity: "medium",
		category: "food",
		contact: "011-23469000",
	},
	{
		id: "6",
		source: "Karnataka State Disaster Management Authority",
		title: "Earthquake Response Team Activated",
		content:
			"Earthquake response teams have been activated in Bangalore. Emergency helpline numbers updated.",
		url: "https://ksdma.karnataka.gov.in/earthquake-response",
		published_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
		severity: "high",
		category: "emergency",
		contact: "080-22221188",
	},
	{
		id: "7",
		source: "Tamil Nadu State Disaster Management Authority",
		title: "Coastal Evacuation Orders",
		content:
			"Evacuation orders issued for coastal areas in Chennai. Emergency shelters opened at Marina Beach.",
		url: "https://tnsdma.tn.gov.in/cyclone-alert",
		published_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
		severity: "urgent",
		category: "evacuation",
		contact: "044-28520100",
	},
	{
		id: "8",
		source: "Himachal Pradesh Disaster Management Authority",
		title: "Landslide Response Team Deployed",
		content:
			"Landslide response teams deployed to Shimla-Kalka highway. Traffic diversions in place.",
		url: "https://hpsdma.hp.gov.in/landslide-response",
		published_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		severity: "urgent",
		category: "rescue",
		contact: "0177-2658000",
	},
];

const scrapeNDMAUpdates = async () => {
	try {
		logger.warn("NDMA scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "NDMA");
	} catch (error) {
		logger.error("Error scraping NDMA updates:", error.message);
		return mockOfficialUpdates.filter((update) => update.source === "NDMA");
	}
};

const scrapeRedCrossUpdates = async () => {
	try {
		logger.warn("Indian Red Cross scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "Indian Red Cross Society"
		);
	} catch (error) {
		logger.error("Error scraping Indian Red Cross updates:", error.message);
		return mockOfficialUpdates.filter(
			(update) => update.source === "Indian Red Cross Society"
		);
	}
};

const scrapeMumbaiMunicipalUpdates = async () => {
	try {
		logger.warn("Mumbai Municipal scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "Mumbai Municipal Corporation"
		);
	} catch (error) {
		logger.error("Error scraping Mumbai Municipal updates:", error.message);
		return mockOfficialUpdates.filter(
			(update) => update.source === "Mumbai Municipal Corporation"
		);
	}
};

const scrapeIMDUpdates = async () => {
	try {
		logger.warn("IMD scraping not implemented, using mock data");
		return mockOfficialUpdates.filter((update) => update.source === "IMD");
	} catch (error) {
		logger.error("Error scraping IMD updates:", error.message);
		return mockOfficialUpdates.filter((update) => update.source === "IMD");
	}
};

const scrapeFEMAUpdates = async () => {
	try {
		const cacheKey = "fema_updates";
		const cachedResult = await getCachedData(cacheKey);
		if (cachedResult) {
			logger.info("FEMA updates served from cache");
			return cachedResult;
		}

		const response = await axios.get("https://www.fema.gov/disaster-updates", {
			timeout: 15000,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; DisasterResponseBot/1.0)",
			},
		});

		const $ = cheerio.load(response.data);
		const updates = [];

		// FEMA specific selectors
		$(".disaster-update, .alert, .news-item").each((index, element) => {
			const title = $(element).find("h2, h3, .title").text().trim();
			const content = $(element)
				.find(".content, .description, p")
				.text()
				.trim();
			const link = $(element).find("a").attr("href");
			const date = $(element).find(".date, time").text().trim();

			if (title && content) {
				updates.push({
					id: `fema_${Date.now()}_${index}`,
					source: "FEMA",
					title: title.substring(0, 200),
					content: content.substring(0, 500),
					url: link
						? link.startsWith("http")
							? link
							: `https://www.fema.gov${link}`
						: "https://www.fema.gov/disaster-updates",
					published_at: date
						? new Date(date).toISOString()
						: new Date().toISOString(),
					severity: determineSeverity(title + " " + content),
					category: determineCategory(title + " " + content),
					contact: "1-800-621-3362",
				});
			}
		});

		if (updates.length === 0) {
			logger.warn("No FEMA updates scraped, using mock data");
			return mockOfficialUpdates.filter((update) => update.source === "FEMA");
		}

		await setCachedData(cacheKey, updates, 60 * 60 * 1000); // 1 hour cache
		logger.info(`FEMA scraping: Found ${updates.length} updates`);
		return updates;
	} catch (error) {
		logger.error("Error scraping FEMA updates:", error.message);
		return mockOfficialUpdates.filter((update) => update.source === "FEMA");
	}
};

const scrapeNYCEmergencyUpdates = async () => {
	try {
		logger.warn("NYC Emergency scraping not implemented, using mock data");
		return mockOfficialUpdates.filter(
			(update) => update.source === "NYC Emergency Management"
		);
	} catch (error) {
		logger.error("Error scraping NYC Emergency updates:", error);
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
		logger.error("Error scraping Weather Service updates:", error);
		return mockOfficialUpdates.filter(
			(update) => update.source === "National Weather Service"
		);
	}
};

const scrapeGenericSite = async (url, selectors) => {
	try {
		const response = await axios.get(url, {
			timeout: 10000,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; DisasterResponseBot/1.0)",
			},
		});

		const $ = cheerio.load(response.data);
		const updates = [];

		$(selectors.container).each((index, element) => {
			const title = $(element).find(selectors.title).text().trim();
			const content = $(element).find(selectors.content).text().trim();
			const link = $(element).find(selectors.link).attr("href");
			const date = $(element).find(selectors.date).text().trim();

			if (title && content) {
				updates.push({
					id: `generic_${Date.now()}_${index}`,
					source: new URL(url).hostname,
					title,
					content: content.substring(0, 500),
					url: link
						? link.startsWith("http")
							? link
							: `${new URL(url).origin}${link}`
						: url,
					published_at: date
						? new Date(date).toISOString()
						: new Date().toISOString(),
					severity: "medium",
					category: "official",
				});
			}
		});

		return updates;
	} catch (error) {
		logger.error(`Error scraping ${url}:`, error);
		return [];
	}
};

const fetchOfficialUpdates = async (sources = ["all"]) => {
	try {
		const allUpdates = [];

		const shouldScrapeAll = sources.includes("all");

		if (shouldScrapeAll || sources.includes("fema")) {
			const femaUpdates = await scrapeFEMAUpdates();
			allUpdates.push(...femaUpdates);
		}

		if (shouldScrapeAll || sources.includes("redcross")) {
			const redCrossUpdates = await scrapeRedCrossUpdates();
			allUpdates.push(...redCrossUpdates);
		}

		if (shouldScrapeAll || sources.includes("nyc")) {
			const nycUpdates = await scrapeNYCEmergencyUpdates();
			allUpdates.push(...nycUpdates);
		}

		if (shouldScrapeAll || sources.includes("weather")) {
			const weatherUpdates = await scrapeWeatherServiceUpdates();
			allUpdates.push(...weatherUpdates);
		}

		if (allUpdates.length === 0) {
			logger.info("No official updates scraped, using mock data");
			return mockOfficialUpdates;
		}

		const sortedUpdates = allUpdates.sort((a, b) => {
			const severityOrder = { high: 3, medium: 2, low: 1 };
			const severityDiff =
				severityOrder[b.severity] - severityOrder[a.severity];

			if (severityDiff !== 0) return severityDiff;

			return new Date(b.published_at) - new Date(a.published_at);
		});

		logger.info(`Fetched ${sortedUpdates.length} official updates`);
		return sortedUpdates;
	} catch (error) {
		logger.error("Error fetching official updates:", error);
		return mockOfficialUpdates;
	}
};

const filterOfficialUpdates = (updates, category = null, severity = null) => {
	let filtered = [...updates];

	if (category) {
		filtered = filtered.filter(
			(update) =>
				update.category &&
				update.category.toLowerCase() === category.toLowerCase()
		);
	}

	if (severity) {
		filtered = filtered.filter(
			(update) =>
				update.severity &&
				update.severity.toLowerCase() === severity.toLowerCase()
		);
	}

	return filtered;
};

const searchOfficialUpdates = (updates, keywords) => {
	if (!keywords) return updates;

	const keywordArray = keywords
		.toLowerCase()
		.split(",")
		.map((k) => k.trim());

	return updates.filter((update) => {
		const searchText = `${update.title} ${update.content}`.toLowerCase();
		return keywordArray.some((keyword) => searchText.includes(keyword));
	});
};

module.exports = {
	fetchOfficialUpdates,
	filterOfficialUpdates,
	searchOfficialUpdates,
	scrapeFEMAUpdates,
	scrapeRedCrossUpdates,
	scrapeNYCEmergencyUpdates,
	scrapeWeatherServiceUpdates,
	scrapeGenericSite,
	scrapeNDMAUpdates,
	scrapeMumbaiMunicipalUpdates,
	scrapeIMDUpdates,
};
