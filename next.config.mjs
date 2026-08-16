import createMDX from "@next/mdx";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const withMDX = createMDX();

export default (phase) => {
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    output: "export",
    basePath: "/CrossTalk",
    pageExtensions: ["js", "jsx", "md", "mdx"],
    // Next.js 15では dev と build が同じ .next を使うため、
    // 開発サーバー稼働中の本番ビルドでHot Reloadを壊さないよう分離する。
    ...(phase === PHASE_DEVELOPMENT_SERVER ? { distDir: ".next-dev" } : {}),
  };

  return withMDX(nextConfig);
};
