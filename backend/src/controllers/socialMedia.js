const axios = require("axios");
const cheerio = require("cheerio");
const supabase = require("../services/supabase");
const { getCachedData, setCachedData } = require("../middleware/cache");
const { fetchSocialMediaData } = require("../services/socialMedia");
const logger = require("../utils/logger");
const socialMediaService = require("../services/socialMedia");
const priorityAlertSystem = require("../services/priorityAlert");

const mockSocialMediaData = [
	{
		id: "1",
		platform: "twitter",
		post: "#floodrelief Need food and water in Lower Manhattan. Families stranded!",
		username: "citizen_helper1",
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		priority: "high",
		verified: false,
		location: "Lower Manhattan, NYC",
		hashtags: ["floodrelief", "emergency"],
		analysis: null,
	},
	{
		id: "2",
		platform: "twitter",
		post: "Offering shelter in Brooklyn Heights for flood victims. Contact me! #disasterhelp",
		username: "brooklyn_resident",
		timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		priority: "medium",
		verified: false,
		location: "Brooklyn Heights, NYC",
		hashtags: ["disasterhelp", "shelter"],
		analysis: null,
	},
	{
		id: "3",
		platform: "twitter",
		post: "URGENT: Medical supplies needed at evacuation center on 42nd Street #emergencyhelp",
		username: "medical_volunteer",
		timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		priority: "urgent",
		verified: false,
		location: "42nd Street, NYC",
		hashtags: ["emergencyhelp", "medical"],
		analysis: null,
	},
];

const getSocialMediaReports = async (req, res) => {
	try {
		const { id: disaster_id } = req.params;
		const { keywords, limit = 20, analyze = true } = req.query;

		logger.info(`Fetching social media reports for disaster ${disaster_id}`);

		// First try to get cached data
		const cacheKey = `social_media_${disaster_id}_${keywords || "all"}`;
		const cachedData = await getCachedData(cacheKey);

		if (cachedData) {
			logger.info(
				`Returning cached social media data for disaster ${disaster_id}`
			);
			return res.json(cachedData);
		}

		const posts = await socialMediaService.fetchSocialMediaData(
			keywords,
			disaster_id,
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

		// Store processed posts in database
		if (processedPosts.length > 0) {
			try {
				const postsToInsert = processedPosts.map((post) => ({
					id: post.id,
					disaster_id,
					platform: post.platform || "twitter",
					post: post.post,
					username: post.username,
					timestamp: post.timestamp,
					priority: post.priority || "low",
					verified: post.verified || false,
					location: post.location,
					hashtags: post.hashtags || [],
					analysis: post.analysis,
				}));

				const { error: insertError } = await supabase
					.from("social_media_posts")
					.upsert(postsToInsert, { onConflict: "id" });

				if (insertError) {
					logger.warn("Failed to store social media posts:", insertError);
				}
			} catch (error) {
				logger.warn("Error storing social media posts:", error);
			}
		}

		const response = {
			posts: processedPosts,
			alerts,
			summary: {
				total: processedPosts.length,
				urgent: processedPosts.filter((p) => p.priority === "urgent").length,
				high: processedPosts.filter((p) => p.priority === "high").length,
				medium: processedPosts.filter((p) => p.priority === "medium").length,
				low: processedPosts.filter((p) => p.priority === "low").length,
			},
		};

		// Cache the response for 15 minutes
		await setCachedData(cacheKey, response, 15 * 60 * 1000);

		// Emit real-time updates
		req.io.emit("social_media_updated", {
			disaster_id,
			posts: processedPosts,
			alerts,
			timestamp: new Date().toISOString(),
		});

		res.json(response);
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
	const sources = [
		{
			name: "FEMA",
			url: "https://www.fema.gov/news-disasters",
			selector: ".news-item",
		},
		{
			name: "Red Cross",
			url: "https://www.redcross.org/news",
			selector: ".news-item",
		},
		{
			name: "NYC Emergency",
			url: "https://www1.nyc.gov/site/em/index.page",
			selector: ".alert-item",
		},
	];

	const updates = [];

	for (const source of sources) {
		try {
			const response = await axios.get(source.url, {
				timeout: 5000,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				},
			});

			const $ = cheerio.load(response.data);
			const items = $(source.selector).slice(0, 5);

			items.each((i, element) => {
				const title = $(element).find("h3, h4, .title").first().text().trim();
				const content = $(element).find("p, .content").first().text().trim();
				const url = $(element).find("a").first().attr("href");

				if (title && content) {
					updates.push({
						id: `${source.name}_${i}_${Date.now()}`,
						source: source.name,
						title,
						content,
						url: url ? new URL(url, source.url).href : null,
						published_at: new Date().toISOString(),
						severity: "medium",
						category: "official",
						contact: null,
						tags: [],
					});
				}
			});
		} catch (error) {
			logger.warn(
				`Failed to fetch updates from ${source.name}:`,
				error.message
			);
		}
	}

	return updates;
};

const analyzeSocialMediaPost = async (req, res) => {
	try {
		const { post, image_url } = req.body;

		if (!post && !image_url) {
			return res.status(400).json({
				error: "Post content or image URL is required",
			});
		}

		const analysis = await priorityAlertSystem.analyzePost({
			post,
			image_url,
		});

		res.json(analysis);
	} catch (error) {
		logger.error("Error analyzing social media post:", error);
		res.status(500).json({
			error: "Failed to analyze post",
			message: error.message,
		});
	}
};

const generateRecommendations = (analysis) => {
	const recommendations = [];

	if (analysis.priority === "urgent") {
		recommendations.push("Immediate response required");
		recommendations.push("Contact emergency services");
		recommendations.push("Verify location and needs");
	}

	if (analysis.priority === "high") {
		recommendations.push("High priority response needed");
		recommendations.push("Coordinate with local authorities");
		recommendations.push("Assess resource requirements");
	}

	if (analysis.confidence < 0.7) {
		recommendations.push("Low confidence - manual verification recommended");
	}

	return recommendations;
};

module.exports = {
	getSocialMediaReports,
	getMockSocialMedia,
	getOfficialUpdates,
	analyzeSocialMediaPost,
};
