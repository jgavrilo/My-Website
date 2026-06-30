"use client";

import { useState, useEffect } from "react";
import { onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { Bell, Send, CheckCircle, XCircle } from "lucide-react";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { Button, Card, Badge, Input, Textarea } from "@component/components/dispensary/ui";
import { pushNotificationsRef, locationsRef } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import type { PushNotification, Location } from "@component/lib/dispensary/types";
import { format } from "date-fns";

export default function DispensaryNotificationsPage() {
  const { organization, user } = useDispensaryAuthStore();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [locations, setLocations]         = useState<Location[]>([]);
  const [form, setForm]   = useState({ title: "", body: "", locationIds: [] as string[] });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    const u1 = onSnapshot(pushNotificationsRef(organization.id), (snap) =>
      setNotifications(snap.docs.map((d) => d.data()).sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)))
    );
    const u2 = onSnapshot(locationsRef(organization.id), (snap) => setLocations(snap.docs.map((d) => d.data())));
    return () => { u1(); u2(); };
  }, [organization?.id]);

  const toggleLocation = (id: string) =>
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(id) ? f.locationIds.filter((x) => x !== id) : [...f.locationIds, id],
    }));

  const handleSend = async () => {
    if (!organization?.id || !user || !form.title || !form.body) return;
    setSending(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addDoc(pushNotificationsRef(organization.id) as any, {
        organizationId: organization.id, locationIds: form.locationIds,
        title: form.title, body: form.body, status: "sent",
        sentAt: serverTimestamp(), createdBy: user.uid, createdAt: serverTimestamp(),
      });

      await fetch("/api/dispensary/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id, locationIds: form.locationIds, title: form.title, body: form.body }),
      });

      setForm({ title: "", body: "", locationIds: [] });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally { setSending(false); }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <DispensaryHeader title="Push Notifications" />
        <div className="flex-1 p-6 space-y-6 max-w-3xl">

          <Card className="space-y-4">
            <h2 className="text-sm font-semibold text-white">Send a notification</h2>
            <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="New deal alert 🎉" />
            <Textarea label="Message" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Check out today's featured deals…" />

            <div>
              <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Target Locations</p>
              <p className="text-xs text-white/30 mb-3">Leave all unchecked to send to all locations.</p>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => {
                  const active = form.locationIds.includes(loc.id);
                  return (
                    <button key={loc.id} onClick={() => toggleLocation(loc.id)} className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${active ? "bg-brand-900/60 border-brand-600 text-brand-300" : "bg-surface-200 border-border text-white/50 hover:text-white"}`}>
                      {loc.name}
                    </button>
                  );
                })}
                {locations.length === 0 && <p className="text-xs text-white/30">No locations yet.</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSend} loading={sending} disabled={!form.title || !form.body}>
                <Send size={14} /> Send now
              </Button>
              {sent && <span className="flex items-center gap-1.5 text-sm text-brand-400"><CheckCircle size={14} /> Sent</span>}
            </div>
          </Card>

          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Sent history</h2>
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card key={n.id} padding="sm" className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {n.status === "sent" ? <CheckCircle size={15} className="text-brand-400" /> : <XCircle size={15} className="text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/30">{n.sentAt ? format(n.sentAt, "MMM d, h:mm a") : "—"}</span>
                      {n.locationIds.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {locations.filter((l) => n.locationIds.includes(l.id)).map((l) => <Badge key={l.id} variant="default">{l.name}</Badge>)}
                        </div>
                      ) : <Badge variant="info">All locations</Badge>}
                    </div>
                  </div>
                  <Badge variant={n.status === "sent" ? "success" : "danger"}>{n.status}</Badge>
                </Card>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12 text-white/30">
                  <Bell size={28} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications sent yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
