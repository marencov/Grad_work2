import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export const metadata = {
  title: "CrossTalk",
  description: "医療のちがいを集めて、よりよい対話をつくる参加型Webサイトです。",
  icons: {
    icon: "/CrossTalk/images/icons/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={notoSansJp.variable}>
      <body>{children}</body>
    </html>
  );
}
