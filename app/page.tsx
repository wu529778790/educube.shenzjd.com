import HomePageContent from "@/components/HomePageContent";
import { tools } from "@/data/tools";
import { loadGeneratedTools } from "@/data/generated-tools";
import { Suspense } from "react";
import Skeleton from "@/components/Skeleton";

export const revalidate = 300;

export default async function HomePage() {
  const generated = await loadGeneratedTools();
  const allTools = [...tools, ...generated];
  return (
    <Suspense fallback={<Skeleton />}>
      <HomePageContent tools={allTools} />
    </Suspense>
  );
}
