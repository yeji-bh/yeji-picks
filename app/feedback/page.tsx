import { redirect } from "next/navigation";
import AdminFeedbackPanel from "@/components/AdminFeedbackPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <AdminFeedbackPanel />;
}
