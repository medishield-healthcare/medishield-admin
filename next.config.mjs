/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images1.dentalkart.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "dentalkart-application-media.s3.ap-south-1.amazonaws.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8081",
        pathname: "**",
      },
      {
        protocol: 'https',
        hostname: 'medisheild-react-native-expo.vercel.app',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
