/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@utado/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "coverartarchive.org" },
      { protocol: "http", hostname: "coverartarchive.org" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
