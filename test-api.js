const axios = require("axios");

// Test configuration
const API_BASE_URL =
	process.env.API_BASE_URL || "https://disaster-manage-backend.onrender.com";
const WS_URL =
	process.env.WS_URL || "wss://disaster-manage-backend.onrender.com";

console.log("🚀 Testing Disaster Response Platform API");
console.log("API Base URL:", API_BASE_URL);
console.log("WebSocket URL:", WS_URL);
console.log("");

// Test rate limiting and connection management
async function testRateLimiting() {
	console.log("🧪 Testing Rate Limiting...");

	const promises = [];
	for (let i = 0; i < 10; i++) {
		promises.push(
			axios
				.get(`${API_BASE_URL}/disasters`)
				.then(() => ({ success: true, index: i }))
				.catch((err) => ({ success: false, error: err.message, index: i }))
		);
	}

	const results = await Promise.all(promises);
	const successCount = results.filter((r) => r.success).length;
	const failureCount = results.filter((r) => !r.success).length;

	console.log(
		`✅ Rate limiting test: ${successCount} successful, ${failureCount} throttled`
	);
	return results;
}

// Test basic API endpoints
async function testBasicEndpoints() {
	console.log("🧪 Testing Basic Endpoints...");

	const endpoints = [
		{ name: "Disasters", url: "/disasters" },
		{ name: "Resources", url: "/resources" },
		{ name: "Social Media", url: "/social-media" },
		{ name: "Official Updates", url: "/official-updates" },
	];

	for (const endpoint of endpoints) {
		try {
			const response = await axios.get(`${API_BASE_URL}${endpoint.url}`);
			console.log(
				`✅ ${endpoint.name}: ${response.status} - ${
					response.data?.length || 0
				} items`
			);
		} catch (error) {
			console.log(
				`❌ ${endpoint.name}: ${
					error.response?.status || "Connection failed"
				} - ${error.message}`
			);
		}
	}
}

// Test WebSocket connection
async function testWebSocket() {
	console.log("🧪 Testing WebSocket Connection...");

	try {
		const WebSocket = require("ws");
		const ws = new WebSocket(
			WS_URL.replace("ws://", "http://").replace("wss://", "https://")
		);

		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				console.log("❌ WebSocket: Connection timeout");
				ws.close();
				resolve(false);
			}, 5000);

			ws.on("open", () => {
				console.log("✅ WebSocket: Connected successfully");
				clearTimeout(timeout);
				ws.close();
				resolve(true);
			});

			ws.on("error", (error) => {
				console.log("❌ WebSocket: Connection error -", error.message);
				clearTimeout(timeout);
				resolve(false);
			});
		});
	} catch (error) {
		console.log("❌ WebSocket: Test failed -", error.message);
		return false;
	}
}

// Main test function
async function runTests() {
	try {
		console.log("Starting comprehensive API tests...\n");

		// Test rate limiting first
		await testRateLimiting();
		console.log("");

		// Test basic endpoints
		await testBasicEndpoints();
		console.log("");

		// Test WebSocket
		await testWebSocket();
		console.log("");

		console.log("🎉 All tests completed!");
	} catch (error) {
		console.error("❌ Test suite failed:", error.message);
		process.exit(1);
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	runTests();
}

module.exports = {
	testRateLimiting,
	testBasicEndpoints,
	testWebSocket,
	runTests,
};
