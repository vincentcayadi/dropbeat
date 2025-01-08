import { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native-fs": false, // Ignore react-native-fs
    };
    return config;
  },
};

export default nextConfig;
