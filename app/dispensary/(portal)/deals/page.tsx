"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { dispensaryStorage } from "@component/lib/dispensary/firebase/client";
import { Plus, Tag, ImageIcon, Trash2, ChevronRight } from "lucide-react";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { Button, Card, Badge, Input, Textarea, cn } from "@component/components/dispensary/ui";
import { dealsRef, dealRef, locationsRef } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import type { Deal, Location } from "@component/lib/dispensary/types";
import { format } from "date-fns";

const STATUS_VARIANT = { draft: "default", scheduled: "info", active: "success", expired: "warning" } as const;

export default function DispensaryDealsPage() {
  const { organization, user } = useDispensaryAuthStore();
  const [deals, setDeals]         = useState<Deal[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected]   = useState<Deal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNew, setIsNew]         = useState(false);
  const [form, setForm]           = useState<Partial<Deal>>({});
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    const u1 = onSnapshot(dealsRef(organization.id), (snap) => setDeals(snap.docs.map((d) => d.data())));
    const u2 = onSnapshot(locationsRef(organization.id), (snap) => setLocations(snap.docs.map((d) => d.data())));
    return () => { u1(); u2(); };
  }, [organization?.id]);

  const openNew = () => {
    setForm({ locationIds: [], status: "draft" });
    setSelected(null); setIsNew(true); setDrawerOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setSelected(deal); setForm(deal); setIsNew(false); setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!organization?.id || !user) return;
    setSaving(true);
    try {
      const now = new Date();
      const start = form.startDate ?? now;
      const end   = form.endDate   ?? now;
      const status: Deal["status"] = end < now ? "expired" : start > now ? "scheduled" : "active";
      const toTs = (d: Date | string) => Timestamp.fromDate(d instanceof Date ? d : new Date(d as string));

      if (isNew) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await addDoc(dealsRef(organization.id) as any, {
          ...form, id: undefined, status, organizationId: organization.id, createdBy: user.uid,
          startDate: toTs(start), endDate: toTs(end),
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      } else if (selected) {
        await updateDoc(dealRef(organization.id, selected.id), { ...form, status, updatedAt: serverTimestamp() });
      }
      setDrawerOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!organization?.id || !selected || !confirm("Delete this deal?")) return;
    await deleteDoc(dealRef(organization.id, selected.id));
    setDrawerOpen(false);
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (!organization?.id || !files[0]) return;
    setUploading(true);
    try {
      const storageRef = ref(dispensaryStorage, `orgs/${organization.id}/deals/${Date.now()}_${files[0].name}`);
      await uploadBytes(storageRef, files[0]);
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, imageURL: url }));
    } finally { setUploading(false); }
  }, [organization?.id]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <DispensaryHeader title="Deals" />
        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">{deals.length} deal{deals.length !== 1 && "s"}</p>
            <Button size="sm" onClick={openNew}><Plus size={14} /> New deal</Button>
          </div>

          <div className="space-y-2">
            {deals.map((deal) => (
              <Card key={deal.id} padding="sm" className="flex items-center gap-4 cursor-pointer hover:border-brand-700/60 transition-colors" onClick={() => openEdit(deal)}>
                {deal.imageURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={deal.imageURL} alt="" className="h-12 w-16 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="h-12 w-16 rounded bg-surface-300 flex items-center justify-center text-white/20 flex-shrink-0"><Tag size={16} /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{deal.title}</p>
                  <p className="text-xs text-white/40">
                    {deal.startDate ? format(deal.startDate, "MMM d") : "—"} – {deal.endDate ? format(deal.endDate, "MMM d, yyyy") : "—"}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[deal.status]}>{deal.status}</Badge>
                <ChevronRight size={14} className="text-white/30" />
              </Card>
            ))}

            {deals.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <Tag size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No deals yet. Create your first promotion.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <DealDrawer
          form={form} locations={locations} isNew={isNew} saving={saving} uploading={uploading}
          onChange={(p) => setForm((f) => ({ ...f, ...p }))}
          onSave={handleSave}
          onDelete={isNew ? undefined : handleDelete}
          onClose={() => setDrawerOpen(false)}
          onDrop={onDrop}
        />
      )}
    </div>
  );
}

function DealDrawer({ form, locations, isNew, saving, uploading, onChange, onSave, onDelete, onClose, onDrop }: {
  form: Partial<Deal>; locations: Location[]; isNew: boolean; saving: boolean; uploading: boolean;
  onChange: (p: Partial<Deal>) => void; onSave: () => void; onDelete?: () => void; onClose: () => void;
  onDrop: (files: File[]) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  const toggleLocation = (id: string) => {
    const ids = form.locationIds ?? [];
    onChange({ locationIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
  };

  const fmtDt = (d?: Date | string) =>
    d ? format(d instanceof Date ? d : new Date(d as string), "yyyy-MM-dd'T'HH:mm") : "";

  return (
    <aside className="w-96 border-l border-border flex flex-col bg-surface-50 h-full overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">{isNew ? "New Deal" : "Edit Deal"}</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
      </div>

      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        <div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Image</p>
          <div {...getRootProps()} className={cn("relative rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden", isDragActive ? "border-brand-500 bg-brand-900/20" : "border-border hover:border-border/80")}>
            <input {...getInputProps()} />
            {form.imageURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageURL} alt="" className="w-full h-40 object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-white/30">
                <ImageIcon size={24} className="mb-2" />
                <p className="text-xs">{isDragActive ? "Drop it" : "Drop image or click to upload"}</p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-surface-0/70 flex items-center justify-center">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        <Input label="Title" value={form.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} placeholder="Weekend Flash Sale" />
        <Textarea label="Description" value={form.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} placeholder="20% off all flower this weekend only…" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">Start Date</p>
            <input type="datetime-local" value={fmtDt(form.startDate)} onChange={(e) => onChange({ startDate: new Date(e.target.value) })} className="w-full bg-surface-200 border border-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">End Date</p>
            <input type="datetime-local" value={fmtDt(form.endDate)} onChange={(e) => onChange({ endDate: new Date(e.target.value) })} className="w-full bg-surface-200 border border-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Locations</p>
          <p className="text-xs text-white/30 mb-3">Leave all unchecked to show at every location.</p>
          <div className="space-y-2">
            {locations.map((loc) => (
              <label key={loc.id} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={(form.locationIds ?? []).includes(loc.id)} onChange={() => toggleLocation(loc.id)} className="accent-brand-500" />
                <span className="text-sm text-white/70 group-hover:text-white transition-colors">{loc.name}</span>
              </label>
            ))}
            {locations.length === 0 && <p className="text-xs text-white/30">No locations yet.</p>}
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
        {onDelete && <Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={13} /></Button>}
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={onSave} loading={saving}>Save</Button>
      </div>
    </aside>
  );
}
