import { redirect } from "next/navigation";
import AdminGalleryPanel from "@/components/AdminGalleryPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <AdminGalleryPanel />;
}
