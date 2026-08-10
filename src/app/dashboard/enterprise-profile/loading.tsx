import { ProfileSkeleton } from "@/components/ui/skeletons";

export default function EnterpriseProfileLoading() {
  return (
    <div className="p-6">
      <ProfileSkeleton />
    </div>
  );
}
