"use client";

import { useState, useEffect } from "react";
import { onSnapshot, updateDoc, writeBatch, doc } from "firebase/firestore";
import { dispensaryDb } from "@component/lib/dispensary/firebase/client";
import { platformNotificationsRef } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import type { PlatformNotification } from "@component/lib/dispensary/types";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { Button, Card, Badge, cn } from "@component/components/dispensary/ui";
import { Inbox, CreditCard, Tag, Zap, AlertTriangle, Info, CheckCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";

const TYPE_CONFIG: Record<PlatformNotification["type"], { icon: React.ElementType; variant: Parameters<typeof Badge>[0]["variant"]; label: string }> = {
  billing:      { icon: CreditCard,    variant: "warning", label: "Billing"  },
  deal_expired: { icon: Tag,           variant: "default", label: "Deal"     },
  new_feature:  { icon: Zap,           variant: "info",    label: "New"      },
  system:       { icon: Info,          variant: "default", label: "System"   },
  alert:        { icon: AlertTriangle, variant: "danger",  label: "Alert"    },
};

export default function DispensaryNotificationCenterPage() {
  const { organization } = useDispensaryAuthStore();
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!organization?.id) return;
    const q = platformNotificationsRef(organization.id);
    const unsub = onSnapshot(q, (snap) =>
      setNotifications(snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    );
    return unsub;
  }, [organization?.id]);

  const markRead = async (id: string) => {
    if (!organization?.id) return;
    await updateDoc(doc(dispensaryDb, "organizations", organization.id, "platformNotifications", id), { read: true });
  };

  const markAllRead = async () => {
    if (!organization?.id) return;
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(dispensaryDb);
    unread.forEach((n) =>
      batch.update(doc(dispensaryDb, "organizations", organization.id!, "platformNotifications", n.id), { read: true })
    );
    await batch.commit();
  };

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      <DispensaryHeader title="Notification Center" />
      <div className="flex-1 p-6 max-w-2xl space-y-4">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-surface-100 border border-border rounded p-0.5">
            {(["all", "unread"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1 rounded text-xs font-medium transition-colors capitalize", filter === f ? "bg-brand-700 text-brand-200" : "text-white/40 hover:text-white")}>
                {f} {f === "unread" && unreadCount > 0 && `(${unreadCount})`}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}><CheckCheck size={13} /> Mark all read</Button>
          )}
        </div>

        <div className="space-y-2">
          {visible.map((n) => {
            const cfg  = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;
            return (
              <Card key={n.id} padding="sm" className={cn("flex items-start gap-4 cursor-pointer transition-colors", !n.read && "border-brand-800/60 bg-brand-950/30")} onClick={() => !n.read && markRead(n.id)}>
                <div className={cn("mt-0.5 h-8 w-8 rounded flex items-center justify-center flex-shrink-0", !n.read ? "bg-brand-900/60 text-brand-400" : "bg-surface-300 text-white/40")}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", n.read ? "text-white/60" : "text-white")}>{n.title}</p>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-white/25" title={format(n.createdAt, "PPpp")}>
                      {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                    </span>
                    {n.actionLabel && n.actionHref && (
                      <Link href={n.actionHref} onClick={(e) => e.stopPropagation()} className="text-xs text-brand-400 hover:text-brand-300 underline underline-offset-2">
                        {n.actionLabel} →
                      </Link>
                    )}
                  </div>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-brand-400 flex-shrink-0 mt-2" />}
              </Card>
            );
          })}
          {visible.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Inbox size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{filter === "unread" ? "No unread notifications." : "Nothing here yet."}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
