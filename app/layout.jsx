import "./globals.css";

export const metadata = {
  title: "Scrollytelling Survey Prototype",
  description: "Survey, Supabase, AI analysis, and information visualization.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
