/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@utado/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
