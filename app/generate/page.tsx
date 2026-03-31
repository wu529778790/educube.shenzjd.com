import GeneratePageContent from "@/components/GeneratePageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 生成教具 — 教立方 EduCube",
  description: "通过 AI 自动生成交互式教学工具",
};

export default function GeneratePage() {
  return <GeneratePageContent />;
}
