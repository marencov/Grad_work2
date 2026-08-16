import TopPageV1 from "@/components/prototype/TopPageV1";

export const metadata = {
  title: "TopPage v1 Prototype",
  description: "Desktop-only prototype based on the Figma TopPagev1 and Scrollytelling general design.",
};

export default function Page() {
  // Next.js App Router note:
  // A file named app/top-page-v1/page.jsx automatically becomes the URL
  // /top-page-v1. This keeps the existing app/page.jsx untouched.
  return <TopPageV1 />;
}
