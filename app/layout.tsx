import type { Metadata } from "next";
import {
  Manrope,
  Newsreader,
  Noto_Sans_KR,
  Noto_Serif_KR,
} from "next/font/google";

import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-display-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-display-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-sans-latin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SweetBook Studio | Editorial Monograph",
  description:
    "Premium photobook publishing platform with an editorial experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${newsreader.variable} ${notoSerifKr.variable} ${manrope.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
