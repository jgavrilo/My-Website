"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MapPin, Tag, Bell, Inbox, CreditCard, User, LogOut, ChevronDown, Settings,
} from "lucide-react";
import { cn } from "@component/components/dispensary/ui";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import { dispensaryAuth } from "@component/lib/dispensary/firebase/client";
import { signOut } from "firebase/auth";
import { useState } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dispensary/dashboard",           icon: LayoutDashboard, label: "Dashboard"          },
  { href: "/dispensary/locations",           icon: MapPin,          label: "Locations"           },
  { href: "/dispensary/deals",               icon: Tag,             label: "Deals"               },
  { href: "/dispensary/notifications",       icon: Bell,            label: "Push Notifications"  },
  { href: "/dispensary/notification-center", icon: Inbox,           label: "Notification Center" },
];

export function DispensarySidebar() {
  const pathname = usePathname();
  const { user, organization } = useDispensaryAuthStore();

  return (
    <aside className="flex h-screen w-60 flex-col bg-surface-50 border-r border-border flex-shrink-0">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-border">
        <div className="h-7 w-7 rounded bg-brand-600 flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
          {organization?.name?.[0] ?? "D"}
        </div>
        <span className="text-sm font-semibold text-white truncate">
          {organization?.name ?? "Dispensary Portal"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (pathname?.startsWith(href + "/") ?? false);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-900/60 text-brand-300"
                  : "text-white/50 hover:bg-surface-200 hover:text-white/90"
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <DispensaryUserMenu user={user} />
    </aside>
  );
}

import type { DispensaryUser } from "@component/lib/dispensary/types";

function DispensaryUserMenu({ user }: { user: DispensaryUser | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-surface-200 transition-colors"
      >
        <div className="h-7 w-7 rounded-full bg-surface-400 flex items-center justify-center text-xs text-white/70 overflow-hidden flex-shrink-0">
          {user?.photoURL ? (
            <Image src={user.photoURL} alt="" width={28} height={28} className="object-cover" />
          ) : (
            (user?.displayName?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-medium text-white truncate">{user?.displayName ?? "User"}</p>
          <p className="text-xs text-white/40 truncate">{user?.email}</p>
        </div>
        <ChevronDown size={14} className={cn("text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg bg-surface-300 border border-border shadow-xl overflow-hidden z-50">
          <Link href="/dispensary/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 hover:bg-surface-400 hover:text-white transition-colors">
            <User size={14} /> Profile
          </Link>
          <Link href="/dispensary/billing" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 hover:bg-surface-400 hover:text-white transition-colors">
            <CreditCard size={14} /> Billing
          </Link>
          <Link href="/dispensary/billing?tab=settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70 hover:bg-surface-400 hover:text-white transition-colors">
            <Settings size={14} /> Settings
          </Link>
          <div className="border-t border-border" />
          <button
            onClick={() => signOut(dispensaryAuth)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-surface-400 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
