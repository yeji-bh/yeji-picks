import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">404</h1>
      <Link href="/" className="mt-4 inline-block text-sm text-muted underline">
        Home
      </Link>
    </div>
  );
}
