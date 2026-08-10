import { TableSkeleton } from "@/components/ui/skeletons";

export default function WorkforceLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-accent animate-pulse rounded" />
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}
