#!/usr/bin/env node

/**
 * Backend Deployment Test Script
 * Run this after deploying your backend to verify everything works
 */

const https = require("https");
const http = require("http");

// Configuration
const BACKEND_URL =
	process.env.BACKEND_URL || "https://your-backend-service.onrender.com";

console.log("🧪 Testing Backend Deployment");
console.log("=============================");
console.log(`Backend URL: ${BACKEND_URL}`);
console.log("");

// Test function
function testEndpoint(path, method = "GET", data = null) {
	return new Promise((resolve, reject) => {
		const url = new URL(path, BACKEND_URL);
		const isHttps = url.protocol === "https:";
		const client = isHttps ? https : http;

		const options = {
			hostname: url.hostname,
			port: url.port || (isHttps ? 443 : 80),
			path: url.pathname + url.search,
			method: method,
			headers: {
				"Content-Type": "application/json",
				"User-Agent": "Backend-Test-Script/1.0",
			},
		};

		const req = client.request(options, (res) => {
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});
			res.on("end", () => {
				try {
					const response = JSON.parse(body);
					resolve({
						status: res.statusCode,
						headers: res.headers,
						data: response,
					});
				} catch (e) {
					resolve({
						status: res.statusCode,
						headers: res.headers,
						data: body,
					});
				}
			});
		});

		req.on("error", (err) => {
			reject(err);
		});

		if (data) {
			req.write(JSON.stringify(data));
		}

		req.end();
	});
}

// Test cases
async function runTests() {
	const tests = [
		{
			name: "Health Check",
			path: "/health",
			expectedStatus: 200,
		},
		{
			name: "API Root",
			path: "/",
			expectedStatus: 200,
		},
		{
			name: "API Info",
			path: "/api",
			expectedStatus: 200,
		},
		{
			name: "Disasters List",
			path: "/api/disasters",
			expectedStatus: 200,
		},
		{
			name: "Social Media Posts",
			path: "/api/social-media/posts",
			expectedStatus: 200,
		},
		{
			name: "Official Updates",
			path: "/api/browse/official-updates",
			expectedStatus: 200,
		},
	];

	let passed = 0;
	let failed = 0;

	for (const test of tests) {
		try {
			console.log(`Testing: ${test.name}`);
			const result = await testEndpoint(test.path);

			if (result.status === test.expectedStatus) {
				console.log(`✅ ${test.name} - Status: ${result.status}`);
				passed++;
			} else {
				console.log(
					`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${result.status}`
				);
				failed++;
			}

			// Add a small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 500));
		} catch (error) {
			console.log(`❌ ${test.name} - Error: ${error.message}`);
			failed++;
		}
	}

	console.log("");
	console.log("📊 Test Results:");
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(
		`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
	);

	if (failed === 0) {
		console.log("");
		console.log("🎉 All tests passed! Your backend is working correctly.");
		console.log("");
		console.log("Next steps:");
		console.log("1. Update your Vercel frontend environment variables");
		console.log("2. Test the full application");
		console.log("3. Monitor logs for any issues");
	} else {
		console.log("");
		console.log(
			"⚠️  Some tests failed. Check your deployment and environment variables."
		);
	}
}

// Run tests
if (require.main === module) {
	runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
