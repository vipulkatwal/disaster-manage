const axios = require("axios");

const API_BASE_URL = "https://disaster-manage-backend.onrender.com";

async function testAPI() {
	console.log("🧪 Testing Disaster Management API...\n");

	try {
		// Test 1: Health Check
		console.log("1. Testing Health Check...");
		const healthResponse = await axios.get(`${API_BASE_URL}/health`);
		console.log("✅ Health Check:", healthResponse.data);
		console.log("");

		// Test 2: Root Endpoint
		console.log("2. Testing Root Endpoint...");
		const rootResponse = await axios.get(`${API_BASE_URL}/`);
		console.log("✅ Root Endpoint:", rootResponse.data);
		console.log("");

		// Test 3: API Disasters Endpoint
		console.log("3. Testing API Disasters Endpoint...");
		const disastersResponse = await axios.get(`${API_BASE_URL}/api/disasters`);
		console.log("✅ Disasters API:", {
			status: disastersResponse.status,
			dataLength: Array.isArray(disastersResponse.data)
				? disastersResponse.data.length
				: "Not an array",
			data: disastersResponse.data,
		});
		console.log("");

		console.log("🎉 All API tests passed! Your backend is working correctly.");
		console.log("");
		console.log("📋 Environment Variables for Frontend:");
		console.log(
			"REACT_APP_API_URL=https://disaster-manage-backend.onrender.com"
		);
		console.log("REACT_APP_WS_URL=wss://disaster-manage-backend.onrender.com");
		console.log("REACT_APP_DEFAULT_USER_ID=netrunnerX");
	} catch (error) {
		console.error("❌ API test failed:");

		if (error.response) {
			console.error("Status:", error.response.status);
			console.error("Data:", error.response.data);
			console.error("Headers:", error.response.headers);
		} else if (error.request) {
			console.error("No response received:", error.message);
		} else {
			console.error("Error:", error.message);
		}
	}
}

testAPI();
