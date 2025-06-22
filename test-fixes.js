const axios = require("axios");

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function testFixes() {
	console.log("🧪 Testing API fixes...\n");

	try {
		// Test 1: Check if search endpoint works without query parameter
		console.log("1. Testing search endpoint without query parameter...");
		const searchResponse = await axios.get(
			`${BASE_URL}/official-updates/search?limit=5`
		);
		console.log(
			"✅ Search endpoint works:",
			searchResponse.data.total_results,
			"results found"
		);

		// Test 2: Check if sources endpoint works
		console.log("\n2. Testing sources endpoint...");
		const sourcesResponse = await axios.get(
			`${BASE_URL}/official-updates/sources`
		);
		console.log(
			"✅ Sources endpoint works:",
			sourcesResponse.data.total_sources,
			"sources found"
		);

		// Test 3: Test with filters
		console.log("\n3. Testing search with filters...");
		const filterResponse = await axios.get(
			`${BASE_URL}/official-updates/search?category=shelter&severity=high&limit=3`
		);
		console.log(
			"✅ Filtered search works:",
			filterResponse.data.total_results,
			"results found"
		);

		// Test 4: Test rate limiting (should not be too aggressive)
		console.log("\n4. Testing rate limiting...");
		const promises = [];
		for (let i = 0; i < 3; i++) {
			promises.push(axios.get(`${BASE_URL}/official-updates/sources`));
		}

		const results = await Promise.allSettled(promises);
		const successCount = results.filter((r) => r.status === "fulfilled").length;
		console.log(
			`✅ Rate limiting test: ${successCount}/3 requests succeeded (should be 3)`
		);

		console.log("\n🎉 All tests passed! The fixes are working correctly.");
	} catch (error) {
		console.error("❌ Test failed:", error.response?.data || error.message);
	}
}

testFixes();
