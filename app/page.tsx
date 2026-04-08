import { Suspense } from "react";
import HomePageContent from "@/components/HomePageContent";
import { tools } from "@/data/tools";
import { loadGeneratedTools } from "@/data/generated-tools";

export const revalidate = 300;

export default async function HomePage() {
  const generated = await loadGeneratedTools();
  const allTools = [...tools, ...generated];
  return (
    <Suspense>
      <HomePageContent tools={allTools} />
    </Suspense>
  );
}
