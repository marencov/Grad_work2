import "./globals.css";

export const metadata = {
  title: "CrossTalk",
  description: "医療のちがいを集めて、よりよい対話をつくる参加型Webサイトです。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
