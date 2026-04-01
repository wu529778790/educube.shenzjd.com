import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "教立方 EduCube — 中小学数学交互教具平台",
  description: "为数学老师提供即用型交互式教具，拿来就能上课。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
