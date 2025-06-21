const { getCachedData, setCachedData } = require("../middleware/cache");
const logger = require("../utils/logger");

// Priority classification keywords and weights
const PRIORITY_KEYWORDS = {
	urgent: {
		keywords: [
			"urgent",
			"sos",
			"emergency",
			"evacuate",
			"evacuation",
			"immediate",
			"critical",
			"life-threatening",
		],
		weight: 10,
		color: "red",
	},
	high: {
		keywords: [
			"need",
			"help",
			"stranded",
			"trapped",
			"injured",
			"medical",
			"rescue",
			"missing",
			"danger",
		],
		weight: 7,
		color: "orange",
	},
	medium: {
		keywords: [
			"offering",
			"volunteer",
			"shelter",
			"donate",
			"available",
			"assistance",
			"support",
		],
		weight: 4,
		color: "yellow",
	},
	low: {
		keywords: [
			"update",
			"information",
			"status",
			"report",
			"news",
			"announcement",
		],
		weight: 1,
		color: "green",
	},
};

// Disaster type classification
const DISASTER_TYPES = {
	flood: [
		"flood",
		"flooding",
		"water",
		"rain",
		"storm",
		"hurricane",
		"tsunami",
	],
	fire: ["fire", "burning", "smoke", "blaze", "wildfire", "arson"],
	earthquake: ["earthquake", "quake", "tremor", "seismic", "shaking"],
	tornado: ["tornado", "twister", "funnel", "storm"],
	hurricane: ["hurricane", "cyclone", "typhoon", "storm"],
	landslide: ["landslide", "mudslide", "avalanche", "rockfall"],
	explosion: ["explosion", "blast", "bomb", "detonation"],
	chemical: ["chemical", "spill", "leak", "toxic", "hazardous"],
};

// Location-based urgency indicators
const LOCATION_URGENCY = {
	hospital: 8,
	school: 7,
	residential: 6,
	downtown: 5,
	highway: 4,
	airport: 3,
};

class PriorityAlertSystem {
	constructor() {
		this.classifier = this.buildClassifier();
	}

	buildClassifier() {
		return {
			// Machine learning-like scoring system
			scoreText: (text) => {
				const lowerText = text.toLowerCase();
				let totalScore = 0;
				let maxScore = 0;

				// Score by priority keywords
				Object.entries(PRIORITY_KEYWORDS).forEach(([priority, config]) => {
					const matches = config.keywords.filter((keyword) =>
						lowerText.includes(keyword)
					).length;

					if (matches > 0) {
						totalScore += matches * config.weight;
						maxScore = Math.max(maxScore, config.weight);
					}
				});

				// Score by disaster type urgency
				const disasterScore = this.getDisasterTypeScore(lowerText);
				totalScore += disasterScore;

				// Score by location urgency
				const locationScore = this.getLocationUrgencyScore(lowerText);
				totalScore += locationScore;

				// Score by time indicators
				const timeScore = this.getTimeUrgencyScore(lowerText);
				totalScore += timeScore;

				// Score by user credibility (if available)
				const credibilityScore = this.getCredibilityScore(text);
				totalScore += credibilityScore;

				return {
					score: totalScore,
					maxScore,
					normalizedScore: totalScore / Math.max(maxScore, 1),
				};
			},

			classifyPriority: (score) => {
				if (score >= 15) return "urgent";
				if (score >= 10) return "high";
				if (score >= 5) return "medium";
				return "low";
			},
		};
	}

	getDisasterTypeScore(text) {
		let score = 0;
		Object.entries(DISASTER_TYPES).forEach(([type, keywords]) => {
			const matches = keywords.filter((keyword) =>
				text.includes(keyword)
			).length;
			if (matches > 0) {
				// Different disaster types have different urgency levels
				const typeScores = {
					fire: 8,
					earthquake: 7,
					flood: 6,
					tornado: 7,
					hurricane: 6,
					explosion: 9,
					chemical: 8,
					landslide: 5,
				};
				score += matches * (typeScores[type] || 3);
			}
		});
		return score;
	}

	getLocationUrgencyScore(text) {
		let score = 0;
		Object.entries(LOCATION_URGENCY).forEach(([location, urgency]) => {
			if (text.includes(location)) {
				score += urgency;
			}
		});
		return score;
	}

	getTimeUrgencyScore(text) {
		let score = 0;
		const timeIndicators = [
			{ keywords: ["now", "immediately", "asap"], weight: 5 },
			{ keywords: ["today", "tonight", "this hour"], weight: 3 },
			{ keywords: ["yesterday", "last night"], weight: 1 },
		];

		timeIndicators.forEach((indicator) => {
			if (indicator.keywords.some((keyword) => text.includes(keyword))) {
				score += indicator.weight;
			}
		});
		return score;
	}

	getCredibilityScore(text) {
		let score = 0;

		// Check for official indicators
		const officialIndicators = [
			"official",
			"authority",
			"government",
			"police",
			"fire",
			"emergency",
		];
		if (
			officialIndicators.some((indicator) =>
				text.toLowerCase().includes(indicator)
			)
		) {
			score += 3;
		}

		// Check for specific details (more details = more credible)
		const detailIndicators = [
			"street",
			"avenue",
			"building",
			"room",
			"floor",
			"block",
		];
		const detailCount = detailIndicators.filter((indicator) =>
			text.toLowerCase().includes(indicator)
		).length;
		score += detailCount * 0.5;

		return score;
	}

	async analyzeSocialMediaPost(post) {
		try {
			const cacheKey = `priority_analysis_${Buffer.from(post.id).toString(
				"base64"
			)}`;
			const cachedResult = await getCachedData(cacheKey);

			if (cachedResult) {
				return cachedResult;
			}

			const text = `${post.post} ${post.location || ""} ${
				post.hashtags?.join(" ") || ""
			}`;
			const analysis = this.classifier.scoreText(text);
			const priority = this.classifier.classifyPriority(analysis.score);

			const result = {
				originalPost: post,
				priority,
				score: analysis.score,
				normalizedScore: analysis.normalizedScore,
				confidence: this.calculateConfidence(analysis),
				analysis: {
					disasterTypes: this.extractDisasterTypes(text),
					locations: this.extractLocations(text),
					urgencyIndicators: this.extractUrgencyIndicators(text),
					credibilityFactors: this.extractCredibilityFactors(text),
				},
				timestamp: new Date().toISOString(),
				requiresImmediateAction: priority === "urgent" && analysis.score >= 20,
			};

			// Cache for 1 hour
			await setCachedData(cacheKey, result, 60 * 60 * 1000);

			logger.info(
				`Priority analysis: ${post.id} -> ${priority} (score: ${analysis.score})`
			);
			return result;
		} catch (error) {
			logger.error("Error analyzing social media post:", error.message);
			return {
				originalPost: post,
				priority: "low",
				score: 0,
				confidence: 0,
				analysis: {},
				timestamp: new Date().toISOString(),
				requiresImmediateAction: false,
			};
		}
	}

	calculateConfidence(analysis) {
		// Higher scores and more balanced indicators = higher confidence
		const baseConfidence = Math.min(analysis.normalizedScore * 0.8, 1);
		const scoreConfidence = Math.min(analysis.score / 20, 1);
		return Math.max(baseConfidence, scoreConfidence);
	}

	extractDisasterTypes(text) {
		const lowerText = text.toLowerCase();
		return Object.entries(DISASTER_TYPES)
			.filter(([type, keywords]) =>
				keywords.some((keyword) => lowerText.includes(keyword))
			)
			.map(([type]) => type);
	}

	extractLocations(text) {
		const locationPatterns = [
			/\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/gi,
			/\b[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/gi,
			/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/gi,
		];

		const locations = [];
		locationPatterns.forEach((pattern) => {
			const matches = text.match(pattern);
			if (matches) {
				locations.push(...matches);
			}
		});

		return [...new Set(locations)];
	}

	extractUrgencyIndicators(text) {
		const lowerText = text.toLowerCase();
		const indicators = [];

		Object.entries(PRIORITY_KEYWORDS).forEach(([priority, config]) => {
			const matches = config.keywords.filter((keyword) =>
				lowerText.includes(keyword)
			);
			if (matches.length > 0) {
				indicators.push({
					priority,
					keywords: matches,
					weight: config.weight,
				});
			}
		});

		return indicators;
	}

	extractCredibilityFactors(text) {
		const factors = [];
		const lowerText = text.toLowerCase();

		if (lowerText.includes("official") || lowerText.includes("authority")) {
			factors.push("official_source");
		}

		if (lowerText.includes("police") || lowerText.includes("fire")) {
			factors.push("emergency_service");
		}

		const detailCount = [
			"street",
			"avenue",
			"building",
			"room",
			"floor",
		].filter((detail) => lowerText.includes(detail)).length;

		if (detailCount > 0) {
			factors.push(`specific_details_${detailCount}`);
		}

		return factors;
	}

	async generateAlert(post, analysis) {
		if (!analysis.requiresImmediateAction) {
			return null;
		}

		const alert = {
			id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: "priority_alert",
			priority: analysis.priority,
			title: `URGENT: ${
				analysis.analysis.disasterTypes[0] || "Emergency"
			} Alert`,
			message: `High-priority social media report: ${post.post.substring(
				0,
				100
			)}...`,
			source: "social_media",
			sourceId: post.id,
			location: post.location,
			disasterTypes: analysis.analysis.disasterTypes,
			score: analysis.score,
			confidence: analysis.confidence,
			timestamp: new Date().toISOString(),
			requiresAcknowledgment: true,
			actions: [
				"Verify location",
				"Contact emergency services",
				"Update disaster record",
				"Notify response team",
			],
		};

		logger.warn(
			`Priority alert generated: ${alert.title} (score: ${analysis.score})`
		);
		return alert;
	}

	async batchAnalyzePosts(posts) {
		const results = [];
		const alerts = [];

		for (const post of posts) {
			const analysis = await this.analyzeSocialMediaPost(post);
			results.push(analysis);

			if (analysis.requiresImmediateAction) {
				const alert = await this.generateAlert(post, analysis);
				if (alert) {
					alerts.push(alert);
				}
			}
		}

		return {
			analyses: results,
			alerts,
			summary: {
				total: results.length,
				urgent: results.filter((r) => r.priority === "urgent").length,
				high: results.filter((r) => r.priority === "high").length,
				medium: results.filter((r) => r.priority === "medium").length,
				low: results.filter((r) => r.priority === "low").length,
				alertsGenerated: alerts.length,
			},
		};
	}
}

module.exports = new PriorityAlertSystem();
