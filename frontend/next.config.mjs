/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	experimental: {
		optimizeCss: true,
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
	compress: true,
	images: {
		formats: ["image/webp", "image/avif"],
		minimumCacheTTL: 60,
	},
	swcMinify: true,
	webpack: (config, { dev, isServer }) => {
		if (!dev && !isServer) {
			config.optimization.splitChunks = {
				chunks: "all",
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						chunks: "all",
					},
					common: {
						name: "common",
						minChunks: 2,
						chunks: "all",
						enforce: true,
					},
				},
			};
		}

		return config;
	},
	trailingSlash: false,
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
				],
			},
			{
				source: "/api/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=300, s-maxage=600",
					},
				],
			},
		];
	},
};

export default nextConfig;
