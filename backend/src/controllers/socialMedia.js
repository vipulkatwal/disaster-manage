const axios = require("axios");
const cheerio = require("cheerio");
const { getCachedData, setCachedData } = require("../middleware/cache");
const { fetchSocialMediaData } = require("../services/socialMedia");
const logger = require("../utils/logger");
const socialMediaService = require("../services/socialMedia");
const priorityAlertSystem = require("../services/priorityAlert");

const mockSocialMediaData = [
	{
		id: "1",
		post: "#floodrelief Need food and water in Lower Manhattan. Families stranded!",
		user: "citizen_helper1",
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		priority: "high",
		verified: false,
	},
	{
		id: "2",
		post: "Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp",
		user: "brooklyn_resident",
		timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		priority: "medium",
		verified: false,
	},
	{
		id: "3",
		post: "URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp",
		user: "medical_volunteer",
		timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		priority: "urgent",
		verified: false,
	},
];

const getSocialMediaReports = async (req, res) => {
	try {
		const { id: disaster_id } = req.params;
		const { keywords, limit = 20, analyze = true } = req.query;

		logger.info(`Fetching social media reports for disaster ${disaster_id}`);

		const posts = await socialMediaService.fetchSocialMediaData(
			keywords,
			null,
			limit
		);

		let processedPosts = posts;
		let alerts = [];

		if (analyze === "true") {
			// Run priority analysis on posts
			const analysisResult = await priorityAlertSystem.batchAnalyzePosts(posts);
			processedPosts = analysisResult.analyses.map((analysis) => ({
				...analysis.originalPost,
				priority: analysis.priority,
				score: analysis.score,
				confidence: analysis.confidence,
				analysis: analysis.analysis,
			}));
			alerts = analysisResult.alerts;

			logger.info(
				`Social media analysis complete: ${analysisResult.summary.total} posts, ${analysisResult.summary.alertsGenerated} alerts`
			);
		}

		// Emit real-time updates
		req.io.emit("social_media_updated", {
			disaster_id,
			posts: processedPosts,
			alerts,
			timestamp: new Date().toISOString(),
		});

		res.json({
			posts: processedPosts,
			alerts,
			summary: {
				total: processedPosts.length,
				urgent: processedPosts.filter((p) => p.priority === "urgent").length,
				high: processedPosts.filter((p) => p.priority === "high").length,
				medium: processedPosts.filter((p) => p.priority === "medium").length,
				low: processedPosts.filter((p) => p.priority === "low").length,
			},
		});
	} catch (error) {
		logger.error("Error fetching social media reports:", error);
		res.status(500).json({
			error: "Failed to fetch social media reports",
			message: error.message,
		});
	}
};

const getMockSocialMedia = async (req, res) => {
	try {
		const { keywords, limit = 10 } = req.query;

		const posts = await socialMediaService.fetchMockSocialMediaData(
			keywords,
			null,
			limit
		);

		// Run priority analysis on mock posts
		const analysisResult = await priorityAlertSystem.batchAnalyzePosts(posts);
		const processedPosts = analysisResult.analyses.map((analysis) => ({
			...analysis.originalPost,
			priority: analysis.priority,
			score: analysis.score,
			confidence: analysis.confidence,
			analysis: analysis.analysis,
		}));

		res.json({
			posts: processedPosts,
			alerts: analysisResult.alerts,
			summary: analysisResult.summary,
		});
	} catch (error) {
		logger.error("Error fetching mock social media:", error);
		res.status(500).json({
			error: "Failed to fetch mock social media data",
			message: error.message,
		});
	}
};

const getOfficialUpdates = async (req, res) => {
	try {
		const { id: disaster_id } = req.params;
		const cacheKey = `official_updates_${disaster_id}`;

		const cachedData = await getCachedData(cacheKey);
		if (cachedData) {
			return res.json(cachedData);
		}

		const officialUpdates = await fetchOfficialUpdates();

		await setCachedData(cacheKey, officialUpdates);

		logger.info(`Official updates fetched for disaster ${disaster_id}`);
		res.json(officialUpdates);
	} catch (error) {
		logger.error("Error fetching official updates:", error);
		res.status(500).json({ error: "Failed to fetch official updates" });
	}
};

const fetchMockSocialMediaData = async (keywords) => {
	await new Promise((resolve) => setTimeout(resolve, 500));

	if (keywords) {
		const keywordArray = keywords.toLowerCase().split(",");
		return mockSocialMediaData.filter((post) =>
			keywordArray.some((keyword) =>
				post.post.toLowerCase().includes(keyword.trim())
			)
		);
	}

	return mockSocialMediaData;
};

const processSocialMediaData = (data, keywords) => {
	return data
		.map((post) => {
			let priority = "low";
			const postText = post.post.toLowerCase();

			if (
				postText.includes("urgent") ||
				postText.includes("sos") ||
				postText.includes("emergency")
			) {
				priority = "urgent";
			} else if (
				postText.includes("need") ||
				postText.includes("help") ||
				postText.includes("stranded")
			) {
				priority = "high";
			} else if (
				postText.includes("offering") ||
				postText.includes("volunteer")
			) {
				priority = "medium";
			}

			return {
				...post,
				priority,
				processed_at: new Date().toISOString(),
			};
		})
		.sort((a, b) => {
			const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
			return priorityOrder[b.priority] - priorityOrder[a.priority];
		});
};

const fetchOfficialUpdates = async () => {
	try {
		const mockOfficialUpdates = [
			{
				id: "1",
				source: "FEMA",
				title: "Emergency Shelter Locations Updated",
				content:
					"New emergency shelters have been opened in Manhattan and Brooklyn. See locations below.",
				url: "https://fema.gov/disaster-updates",
				published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
				severity: "high",
			},
			{
				id: "2",
				source: "NYC Emergency Management",
				title: "Water Distribution Points Active",
				content:
					"Water distribution is now active at Central Park and Prospect Park locations.",
				url: "https://nyc.gov/emergency",
				published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
				severity: "medium",
			},
			{
				id: "3",
				source: "Red Cross",
				title: "Volunteer Registration Open",
				content:
					"Red Cross is accepting volunteer registrations for disaster relief efforts.",
				url: "https://redcross.org/volunteer",
				published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
				severity: "low",
			},
		];

		return mockOfficialUpdates;
	} catch (error) {
		logger.error("Error fetching official updates:", error);
		throw error;
	}
};

const analyzeSocialMediaPost = async (req, res) => {
	try {
		const { post } = req.body;

		if (!post || !post.post) {
			return res.status(400).json({ error: "Post content is required" });
		}

		const analysis = await priorityAlertSystem.analyzeSocialMediaPost(post);
		const alert = await priorityAlertSystem.generateAlert(post, analysis);

		res.json({
			analysis,
			alert,
			recommendations: generateRecommendations(analysis),
		});
	} catch (error) {
		logger.error("Error analyzing social media post:", error);
		res.status(500).json({
			error: "Failed to analyze social media post",
			message: error.message,
		});
	}
};

const generateRecommendations = (analysis) => {
	const recommendations = [];

	if (analysis.priority === "urgent") {
		recommendations.push("Immediate response required");
		recommendations.push("Contact emergency services");
		recommendations.push("Verify location and situation");
	}

	if (analysis.analysis.disasterTypes.length > 0) {
		recommendations.push(
			`Prepare for ${analysis.analysis.disasterTypes[0]} response`
		);
	}

	if (analysis.analysis.locations.length > 0) {
		recommendations.push("Dispatch resources to identified locations");
	}

	if (analysis.confidence < 0.5) {
		recommendations.push("Verify information before taking action");
	}

	return recommendations;
};

module.exports = {
	getSocialMediaReports,
	getMockSocialMedia,
	getOfficialUpdates,
	analyzeSocialMediaPost,
};
