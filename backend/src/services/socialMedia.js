const axios = require("axios");
const { getCachedData, setCachedData } = require("../middleware/cache");
const logger = require("../utils/logger");

const mockSocialMediaData = [
	{
		id: "1",
		post: "#floodrelief Need food and water in South Mumbai. Families stranded due to heavy rains!",
		username: "mumbai_helper1",
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		priority: "high",
		verified: false,
		location: "South Mumbai, Maharashtra",
		hashtags: ["#floodrelief", "#emergency"],
	},
	{
		id: "2",
		post: "Offering shelter in Bandra for flood victims. Contact me! #disasterhelp",
		username: "bandra_resident",
		timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
		priority: "medium",
		verified: false,
		location: "Bandra, Mumbai",
		hashtags: ["#disasterhelp", "#shelter"],
	},
	{
		id: "3",
		post: "URGENT: Medical supplies needed at evacuation center in Andheri #emergencyhelp",
		username: "medical_volunteer",
		timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		priority: "urgent",
		verified: false,
		location: "Andheri, Mumbai",
		hashtags: ["#emergencyhelp", "#medical"],
	},
	{
		id: "4",
		post: "Earthquake felt in Koramangala area. Buildings shaking! #earthquake #help",
		username: "bangalore_witness",
		timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
		priority: "urgent",
		verified: false,
		location: "Koramangala, Bangalore",
		hashtags: ["#earthquake", "#help"],
	},
	{
		id: "5",
		post: "Fire spreading near Connaught Place. Evacuations needed! #fire #evacuate",
		username: "delhi_safety",
		timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
		priority: "urgent",
		verified: false,
		location: "Connaught Place, Delhi",
		hashtags: ["#fire", "#evacuate"],
	},
	{
		id: "6",
		post: "Have extra blankets and warm clothes for disaster victims in Chennai #donate #help",
		username: "chennai_helper",
		timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
		priority: "low",
		verified: false,
		location: "Chennai, Tamil Nadu",
		hashtags: ["#donate", "#help"],
	},
	{
		id: "7",
		post: "Cyclone warning: Heavy rains expected in Marina Beach area. Stay indoors! #cyclone #chennai",
		username: "weather_alert_chennai",
		timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
		priority: "high",
		verified: false,
		location: "Marina Beach, Chennai",
		hashtags: ["#cyclone", "#chennai"],
	},
	{
		id: "8",
		post: "Landslide blocking Shimla-Kalka highway. Traffic diverted! #landslide #himachal",
		username: "himachal_traffic",
		timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
		priority: "urgent",
		verified: false,
		location: "Shimla-Kalka Highway, Himachal Pradesh",
		hashtags: ["#landslide", "#himachal"],
	},
];

const fetchMockSocialMediaData = async (keywords, disasterType) => {
	try {
		await new Promise((resolve) => setTimeout(resolve, 500));

		let filteredData = [...mockSocialMediaData];

		if (keywords) {
			const keywordArray = keywords
				.toLowerCase()
				.split(",")
				.map((k) => k.trim());
			filteredData = filteredData.filter((post) =>
				keywordArray.some(
					(keyword) =>
						post.post.toLowerCase().includes(keyword) ||
						post.hashtags.some((hashtag) =>
							hashtag.toLowerCase().includes(keyword)
						)
				)
			);
		}

		if (disasterType) {
			const type = disasterType.toLowerCase();
			filteredData = filteredData.filter(
				(post) =>
					post.post.toLowerCase().includes(type) ||
					post.hashtags.some((hashtag) => hashtag.toLowerCase().includes(type))
			);
		}

		logger.info(`Mock social media data fetched: ${filteredData.length} posts`);
		return filteredData;
	} catch (error) {
		logger.error("Error fetching mock social media data:", error);
		throw error;
	}
};

const processSocialMediaData = (data, keywords) => {
	const processed = data.map((post) => {
		let priority = "low";
		const postText = post.post.toLowerCase();

		if (
			postText.includes("urgent") ||
			postText.includes("sos") ||
			postText.includes("emergency") ||
			postText.includes("evacuate")
		) {
			priority = "urgent";
		} else if (
			postText.includes("need") ||
			postText.includes("help") ||
			postText.includes("stranded") ||
			postText.includes("trapped")
		) {
			priority = "high";
		} else if (
			postText.includes("offering") ||
			postText.includes("volunteer") ||
			postText.includes("shelter") ||
			postText.includes("donate")
		) {
			priority = "medium";
		}

		return {
			...post,
			priority,
			processed_at: new Date().toISOString(),
			relevance_score: calculateRelevanceScore(post, keywords),
		};
	});

	return processed.sort((a, b) => {
		const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
		const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

		if (priorityDiff !== 0) return priorityDiff;

		return b.relevance_score - a.relevance_score;
	});
};

const calculateRelevanceScore = (post, keywords) => {
	if (!keywords) return 1;

	let score = 0;
	const keywordArray = keywords
		.toLowerCase()
		.split(",")
		.map((k) => k.trim());
	const postText = post.post.toLowerCase();

	keywordArray.forEach((keyword) => {
		if (postText.includes(keyword)) score += 3;

		if (
			post.hashtags.some((hashtag) => hashtag.toLowerCase().includes(keyword))
		) {
			score += 2;
		}

		if (post.location && post.location.toLowerCase().includes(keyword)) {
			score += 1;
		}
	});

	return score;
};

const fetchTwitterData = async (query, count = 20) => {
	try {
		const cacheKey = `twitter_${Buffer.from(query)
			.toString("base64")
			.substring(0, 50)}`;
		const cachedResult = await getCachedData(cacheKey);
		if (cachedResult) {
			logger.info("Twitter data served from cache");
			return cachedResult;
		}

		if (!process.env.TWITTER_BEARER_TOKEN) {
			logger.warn("Twitter API token not configured, using mock data");
			return await fetchMockSocialMediaData(query);
		}

		const response = await axios.get(
			"https://api.twitter.com/2/tweets/search/recent",
			{
				params: {
					query: `${query} -is:retweet`,
					max_results: count,
					"tweet.fields": "created_at,author_id,public_metrics",
					"user.fields": "username,name",
					expansions: "author_id",
				},
				headers: {
					Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
					"User-Agent": "DisasterResponsePlatform/1.0",
				},
				timeout: 10000,
			}
		);

		if (!response.data?.data) {
			throw new Error("No data received from Twitter API");
		}

		const tweets = response.data.data.map((tweet) => ({
			id: tweet.id,
			post: tweet.text,
			user: tweet.author_id,
			timestamp: tweet.created_at,
			priority: "low",
			verified: false,
			location: null,
			hashtags: extractHashtags(tweet.text),
			metrics: tweet.public_metrics,
		}));

		await setCachedData(cacheKey, tweets, 15 * 60 * 1000); // 15 minutes cache
		logger.info(
			`Twitter API: Fetched ${tweets.length} tweets for query: ${query}`
		);
		return tweets;
	} catch (error) {
		logger.error("Twitter API error:", error.message);
		if (error.response?.status === 429) {
			logger.warn("Twitter API rate limit exceeded, using cached data");
			const cachedResult = await getCachedData(
				`twitter_${Buffer.from(query).toString("base64").substring(0, 50)}`
			);
			return cachedResult || (await fetchMockSocialMediaData(query));
		}
		return await fetchMockSocialMediaData(query);
	}
};

const fetchBlueskyData = async (query, count = 20) => {
	try {
		const cacheKey = `bluesky_${Buffer.from(query)
			.toString("base64")
			.substring(0, 50)}`;
		const cachedResult = await getCachedData(cacheKey);
		if (cachedResult) {
			logger.info("Bluesky data served from cache");
			return cachedResult;
		}

		if (!process.env.BLUESKY_ACCESS_TOKEN) {
			logger.warn("Bluesky API token not configured, using mock data");
			return await fetchMockSocialMediaData(query);
		}

		const response = await axios.post(
			"https://bsky.social/xrpc/app.bsky.feed.searchPosts",
			{
				q: query,
				limit: count,
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.BLUESKY_ACCESS_TOKEN}`,
					"Content-Type": "application/json",
					"User-Agent": "DisasterResponsePlatform/1.0",
				},
				timeout: 10000,
			}
		);

		if (!response.data?.posts) {
			throw new Error("No data received from Bluesky API");
		}

		const posts = response.data.posts.map((post) => ({
			id: post.uri,
			post: post.record.text,
			user: post.author.handle,
			timestamp: post.indexedAt,
			priority: "low",
			verified: false,
			location: null,
			hashtags: extractHashtags(post.record.text),
		}));

		await setCachedData(cacheKey, posts, 15 * 60 * 1000); // 15 minutes cache
		logger.info(
			`Bluesky API: Fetched ${posts.length} posts for query: ${query}`
		);
		return posts;
	} catch (error) {
		logger.error("Bluesky API error:", error.message);
		return await fetchMockSocialMediaData(query);
	}
};

const fetchSocialMediaData = async (keywords, disasterType, limit = 20) => {
	try {
		let data = [];

		if (process.env.TWITTER_BEARER_TOKEN) {
			try {
				data = await fetchTwitterData(keywords, limit);
			} catch (error) {
				logger.warn("Twitter API failed, trying alternatives");
			}
		}

		if (data.length === 0 && process.env.BLUESKY_ACCESS_TOKEN) {
			try {
				data = await fetchBlueskyData(keywords, limit);
			} catch (error) {
				logger.warn("Bluesky API failed, using mock data");
			}
		}

		if (data.length === 0) {
			data = await fetchMockSocialMediaData(keywords, disasterType);
		}

		return processSocialMediaData(data, keywords);
	} catch (error) {
		logger.error("Error fetching social media data:", error);
		return processSocialMediaData(mockSocialMediaData, keywords);
	}
};

module.exports = {
	fetchSocialMediaData,
	fetchMockSocialMediaData,
	processSocialMediaData,
	calculateRelevanceScore,
};
