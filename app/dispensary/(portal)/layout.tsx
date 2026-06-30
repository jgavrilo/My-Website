"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DispensarySidebar } from "@component/components/dispensary/layout/Sidebar";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import { useDispensaryAuthListener } from "@component/lib/dispensary/hooks/useAuthListener";

export default function DispensaryPortalLayout({ children }: { children: React.ReactNode }) {
  useDispensaryAuthListener();
  const { user, loading } = useDispensaryAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/dispensary/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      <DispensarySidebar />
      <main className="flex-1 overflow-y-auto bg-surface-0">{children}</main>
    </div>
  );
}
