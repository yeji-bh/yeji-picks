import LoadingSpinner from "@/components/LoadingSpinner";

export default function AppLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner label="Loading..." />
    </div>
  );
}
