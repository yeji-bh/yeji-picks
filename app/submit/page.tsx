import { redirect } from "next/navigation";
import AdminSubmitPanel from "@/components/AdminSubmitPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <AdminSubmitPanel />;
}
