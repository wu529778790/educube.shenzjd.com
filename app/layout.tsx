import type { Metadata, Viewport } from "next";
import { Noto_Serif_SC } from "next/font/google";
import { validateRuntimeConfig } from "@/lib/runtime-config";
import "./globals.css";

const notoSerifSC = Noto_Serif_SC({
  weight: ["600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://educube.cn"),
  alternates: { canonical: "/" },
  title: "教立方 EduCube — 中小学数学交互教具平台",
  description:
    "为数学老师提供即用型交互式教具，拿来就能上课。浏览器打开即用，教具按年级与学期整理，便于课堂选用。",
  openGraph: {
    title: "教立方 EduCube — 中小学数学交互教具平台",
    description: "为数学老师提供即用型交互式教具，拿来就能上课。浏览器打开即用，无需安装。",
    type: "website",
    locale: "zh_CN",
    siteName: "教立方 EduCube",
  },
  twitter: {
    card: "summary",
    title: "教立方 EduCube — 中小学数学交互教具平台",
    description: "为数学老师提供即用型交互式教具，拿来就能上课。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  validateRuntimeConfig();

  return (
    <html lang="zh-CN" className={`h-full ${notoSerifSC.variable}`}>
      <body className="min-h-full antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded focus:shadow-lg">
          跳转到主要内容
        </a>
        {children}
      </body>
    </html>
  );
}
