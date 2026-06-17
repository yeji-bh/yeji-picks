"use client";

import { useRouter } from "next/navigation";
import RegisterModal from "@/components/RegisterModal";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <RegisterModal
      open
      onClose={() => router.push("/")}
      onLoginClick={() => router.push("/login")}
    />
  );
}
