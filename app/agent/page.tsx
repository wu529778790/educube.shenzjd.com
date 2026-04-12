import type { Metadata } from "next";
import AgentPageContent from "@/components/AgentPageContent";

export const metadata: Metadata = {
  title: "AI 助手 — 教立方",
  description: "通过对话生成和修改交互式教学工具",
};

export default function AgentPage() {
  return <AgentPageContent />;
}
