"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { unreadPlatformNotifsQuery } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import { cn } from "@component/components/dispensary/ui";

export function DispensaryHeader({ title }: { title: string }) {
  const { organization } = useDispensaryAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!organization?.id) return;
    const q = unreadPlatformNotifsQuery(organization.id);
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
    return unsub;
  }, [organization?.id]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface-50 px-6 flex-shrink-0">
      <h1 className="text-sm font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <Link
          href="/dispensary/notification-center"
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded hover:bg-surface-300 transition-colors",
            "text-white/50 hover:text-white"
          )}
        >
          <Bell size={16} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand-400" />
          )}
        </Link>
      </div>
    </header>
  );
}
