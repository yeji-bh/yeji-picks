import { redirect } from "next/navigation";

export default async function AdminDetailRedirect() {
  redirect("/my-submissions?status=pending");
}
