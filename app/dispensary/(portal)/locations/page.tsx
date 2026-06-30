"use client";

import { useState, useEffect } from "react";
import { onSnapshot, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Plus, MapPin, ChevronRight, Clock } from "lucide-react";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { Button, Card, Badge, Input, Textarea, cn } from "@component/components/dispensary/ui";
import { locationsRef, locationRef } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import type { Location, WeeklyHours } from "@component/lib/dispensary/types";

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
const DEFAULT_HOURS: WeeklyHours = Object.fromEntries(
  DAYS.map((d) => [d, { open: "09:00", close: "21:00", closed: d === "sunday" }])
) as WeeklyHours;

type DrawerMode = "edit" | "new" | null;

export default function DispensaryLocationsPage() {
  const { organization } = useDispensaryAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected]   = useState<Location | null>(null);
  const [drawer, setDrawer]       = useState<DrawerMode>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<Partial<Location>>({});

  useEffect(() => {
    if (!organization?.id) return;
    const unsub = onSnapshot(locationsRef(organization.id), (snap) =>
      setLocations(snap.docs.map((d) => d.data()))
    );
    return unsub;
  }, [organization?.id]);

  const openNew = () => {
    setForm({ hours: DEFAULT_HOURS, isActive: true, timezone: "America/Los_Angeles" });
    setSelected(null);
    setDrawer("new");
  };

  const openEdit = (loc: Location) => {
    setSelected(loc);
    setForm(loc);
    setDrawer("edit");
  };

  const handleSave = async () => {
    if (!organization?.id) return;
    setSaving(true);
    try {
      if (drawer === "new") {
        const slug = (form.name ?? "location").toLowerCase().replace(/\s+/g, "-");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await addDoc(locationsRef(organization.id) as any, {
          ...form,
          organizationId: organization.id,
          fcmTopic: `org_${organization.id}_loc_${slug}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (drawer === "edit" && selected) {
        await updateDoc(locationRef(organization.id, selected.id), { ...form, updatedAt: serverTimestamp() });
      }
      setDrawer(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <DispensaryHeader title="Locations" />
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">{locations.length} location{locations.length !== 1 && "s"}</p>
            <Button size="sm" onClick={openNew}><Plus size={14} /> Add location</Button>
          </div>

          <div className="space-y-2">
            {locations.map((loc) => (
              <Card key={loc.id} className="flex items-center gap-4 cursor-pointer hover:border-brand-700/60 transition-colors" padding="sm" onClick={() => openEdit(loc)}>
                <div className="h-10 w-10 rounded bg-surface-300 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{loc.name}</p>
                  <p className="text-xs text-white/40 truncate">{loc.address}, {loc.city}</p>
                </div>
                <Badge variant={loc.isActive ? "success" : "default"}>{loc.isActive ? "Active" : "Inactive"}</Badge>
                <ChevronRight size={14} className="text-white/30" />
              </Card>
            ))}

            {locations.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No locations yet. Add your first store.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {drawer && (
        <LocationDrawer
          mode={drawer}
          form={form}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onSave={handleSave}
          onClose={() => setDrawer(null)}
          saving={saving}
        />
      )}
    </div>
  );
}

function LocationDrawer({ mode, form, onChange, onSave, onClose, saving }: {
  mode: DrawerMode; form: Partial<Location>; saving: boolean;
  onChange: (p: Partial<Location>) => void; onSave: () => void; onClose: () => void;
}) {
  return (
    <aside className="w-96 border-l border-border flex flex-col bg-surface-50 h-full overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">{mode === "new" ? "New Location" : "Edit Location"}</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
      </div>

      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        <Input label="Location Name" value={form.name ?? ""}    onChange={(e) => onChange({ name: e.target.value })}    placeholder="Ballard" />
        <Input label="Address"       value={form.address ?? ""} onChange={(e) => onChange({ address: e.target.value })} placeholder="5419 Ballard Ave NW" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City"  value={form.city ?? ""}  onChange={(e) => onChange({ city: e.target.value })}  placeholder="Seattle" />
          <Input label="State" value={form.state ?? ""} onChange={(e) => onChange({ state: e.target.value })} placeholder="WA" />
        </div>
        <Input label="ZIP"   value={form.zip ?? ""}   onChange={(e) => onChange({ zip: e.target.value })}   placeholder="98107" />
        <Input label="Phone" value={form.phone ?? ""} onChange={(e) => onChange({ phone: e.target.value })} placeholder="(206) 000-0000" />
        <Input label="Email" value={form.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} type="email" />
        <Textarea label="Bio" value={form.bio ?? ""} onChange={(e) => onChange({ bio: e.target.value })} placeholder="Tell customers about this location…" />

        {/* Hours */}
        <div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Clock size={12} /> Hours
          </p>
          <div className="space-y-2">
            {DAYS.map((day) => {
              const h = (form.hours as WeeklyHours)?.[day] ?? { open: "09:00", close: "21:00", closed: false };
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-10 text-xs text-white/40 capitalize">{day.slice(0, 3)}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!h.closed}
                      onChange={(e) => onChange({ hours: { ...(form.hours as WeeklyHours), [day]: { ...h, closed: !e.target.checked } } })}
                      className="accent-brand-500"
                    />
                    <span className="text-xs text-white/50">Open</span>
                  </label>
                  {!h.closed && (
                    <>
                      <input type="time" value={h.open} onChange={(e) => onChange({ hours: { ...(form.hours as WeeklyHours), [day]: { ...h, open: e.target.value } } })} className="bg-surface-200 border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
                      <span className="text-xs text-white/30">–</span>
                      <input type="time" value={h.close} onChange={(e) => onChange({ hours: { ...(form.hours as WeeklyHours), [day]: { ...h, close: e.target.value } } })} className="bg-surface-200 border border-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    </>
                  )}
                  {h.closed && <span className="text-xs text-white/30">Closed</span>}
                </div>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => onChange({ isActive: !form.isActive })} className={cn("w-9 h-5 rounded-full transition-colors relative", form.isActive ? "bg-brand-500" : "bg-surface-400")}>
            <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", form.isActive && "translate-x-4")} />
          </div>
          <span className="text-sm text-white/70">Location is active</span>
        </label>
      </div>

      <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={onSave} loading={saving}>Save</Button>
      </div>
    </aside>
  );
}
