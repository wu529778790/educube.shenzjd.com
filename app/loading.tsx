import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return <div role="status" aria-busy="true" aria-label="加载中"><Skeleton showCards /></div>;
}
