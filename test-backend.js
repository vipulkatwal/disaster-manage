const axios = require("axios");

const BACKEND_URL = "https://disaster-manage-backend.onrender.com";

async function testBackend() {
	console.log("🧪 Testing backend connectivity...\n");

	try {
		// Test 1: Health check
		console.log("1. Testing health endpoint...");
		const healthResponse = await axios.get(`${BACKEND_URL}/health`);
		console.log("✅ Health check passed:", healthResponse.data);
	} catch (error) {
		console.log("❌ Health check failed:", error.message);
	}

	try {
		// Test 2: Root endpoint
		console.log("\n2. Testing root endpoint...");
		const rootResponse = await axios.get(`${BACKEND_URL}/`);
		console.log("✅ Root endpoint passed:", rootResponse.data);
	} catch (error) {
		console.log("❌ Root endpoint failed:", error.message);
	}

	try {
		// Test 3: CORS preflight (OPTIONS request)
		console.log("\n3. Testing CORS preflight...");
		const corsResponse = await axios.options(`${BACKEND_URL}/api/disasters`, {
			headers: {
				Origin: "https://geo-aid.vercel.app",
				"Access-Control-Request-Method": "GET",
				"Access-Control-Request-Headers": "Content-Type",
			},
		});
		console.log("✅ CORS preflight passed");
		console.log("CORS headers:", {
			"Access-Control-Allow-Origin":
				corsResponse.headers["access-control-allow-origin"],
			"Access-Control-Allow-Methods":
				corsResponse.headers["access-control-allow-methods"],
			"Access-Control-Allow-Headers":
				corsResponse.headers["access-control-allow-headers"],
		});
	} catch (error) {
		console.log("❌ CORS preflight failed:", error.message);
	}

	try {
		// Test 4: Actual API request
		console.log("\n4. Testing API request...");
		const apiResponse = await axios.get(`${BACKEND_URL}/api/disasters`, {
			headers: {
				Origin: "https://geo-aid.vercel.app",
			},
		});
		console.log("✅ API request passed");
		console.log("Response status:", apiResponse.status);
		console.log(
			"Response data length:",
			Array.isArray(apiResponse.data) ? apiResponse.data.length : "Not an array"
		);
	} catch (error) {
		console.log("❌ API request failed:", error.message);
		if (error.response) {
			console.log("Response status:", error.response.status);
			console.log("Response data:", error.response.data);
		}
	}

	console.log("\n🏁 Backend test completed");
}

testBackend().catch(console.error);
