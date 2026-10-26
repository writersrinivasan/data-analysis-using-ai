/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@langchain/langgraph", "@langchain/groq", "@langchain/core"],
};
export default nextConfig;
