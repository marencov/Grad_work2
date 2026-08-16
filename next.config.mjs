import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/CrossTalk",
  assetPrefix: "/CrossTalk/",
  pageExtensions: ["js", "jsx", "md", "mdx"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
