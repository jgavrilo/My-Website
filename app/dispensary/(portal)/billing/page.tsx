"use client";

import { useState, useEffect, Suspense } from "react";
import { onSnapshot } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { CreditCard, FileText, Settings, Check } from "lucide-react";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { Button, Card, Badge, Input, Divider } from "@component/components/dispensary/ui";
import { invoicesRef } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import type { Invoice } from "@component/lib/dispensary/types";
import { format } from "date-fns";

const PLANS = [
  { id: "starter",    name: "Starter",    price: 49,  features: ["1 location", "500 push/month", "Basic analytics", "Deals manager"],                           locationLimit: 1        },
  { id: "growth",     name: "Growth",     price: 129, features: ["Up to 5 locations", "5,000 push/month", "Advanced analytics", "Priority support"],             locationLimit: 5        },
  { id: "enterprise", name: "Enterprise", price: 349, features: ["Unlimited locations", "Unlimited push", "Custom analytics", "Dedicated support"],               locationLimit: Infinity },
] as const;

type Tab = "overview" | "settings";

function BillingPageInner() {
  const { organization } = useDispensaryAuthStore();
  const searchParams    = useSearchParams();
  const [tab, setTab]   = useState<Tab>(searchParams?.get("tab") === "settings" ? "settings" : "overview");
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!organization?.id) return;
    const unsub = onSnapshot(invoicesRef(organization.id), (snap) =>
      setInvoices(snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    );
    return unsub;
  }, [organization?.id]);

  const currentPlan = PLANS.find((p) => p.id === organization?.plan) ?? PLANS[0];

  return (
    <div className="flex flex-col h-full">
      <DispensaryHeader title="Billing" />
      <div className="flex-1 p-6 max-w-3xl space-y-6">

        <div className="flex items-center gap-1 bg-surface-100 border border-border rounded p-0.5 w-fit">
          {(["overview", "settings"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors capitalize ${tab === t ? "bg-brand-700 text-brand-200" : "text-white/40 hover:text-white"}`}>
              {t === "overview" ? <><CreditCard size={12} className="inline mr-1.5" />Overview</> : <><Settings size={12} className="inline mr-1.5" />Settings</>}
            </button>
          ))}
        </div>

        {tab === "overview" && <BillingOverview currentPlan={currentPlan} invoices={invoices} />}
        {tab === "settings" && <BillingSettings />}
      </div>
    </div>
  );
}

export default function DispensaryBillingPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-surface-0"><span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>}>
      <BillingPageInner />
    </Suspense>
  );
}

function BillingOverview({ currentPlan, invoices }: { currentPlan: typeof PLANS[number]; invoices: Invoice[] }) {
  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Current plan</p>
          <p className="text-xl font-display font-semibold text-white">{currentPlan.name}</p>
          <p className="text-sm text-white/50 mt-0.5">${currentPlan.price}/month</p>
        </div>
        <Button variant="secondary" size="sm">Manage plan</Button>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Plans</h2>
        <div className="grid grid-cols-3 gap-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan.id;
            return (
              <Card key={plan.id} className={isCurrent ? "border-brand-600/60 bg-brand-950/20" : ""} padding="sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white">{plan.name}</p>
                  {isCurrent && <Badge variant="success">Current</Badge>}
                </div>
                <p className="text-2xl font-display font-bold text-white mb-4">${plan.price}<span className="text-sm font-normal text-white/40">/mo</span></p>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-white/60">
                      <Check size={11} className="text-brand-400 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && <Button variant="secondary" size="sm" className="w-full">{plan.price > 49 ? "Upgrade" : "Downgrade"}</Button>}
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FileText size={14} className="text-white/40" /> Invoice history</h2>
        {invoices.length > 0 ? (
          <Card padding="none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-white/40">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-white/70">{format(inv.createdAt, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 text-white/50 text-xs">{format(inv.periodStart, "MMM d")} – {format(inv.periodEnd, "MMM d")}</td>
                    <td className="px-5 py-3 text-white">${(inv.amount / 100).toFixed(2)}</td>
                    <td className="px-5 py-3"><Badge variant={inv.status === "paid" ? "success" : "warning"}>{inv.status}</Badge></td>
                    <td className="px-5 py-3 text-right">{inv.pdfURL && <a href={inv.pdfURL} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300">PDF</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : <p className="text-sm text-white/30">No invoices yet.</p>}
      </div>
    </div>
  );
}

function BillingSettings() {
  const { organization } = useDispensaryAuthStore();
  const [billingEmail, setBillingEmail] = useState(organization?.billingEmail ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const { updateDoc } = await import("firebase/firestore");
    const { orgRef }    = await import("@component/lib/dispensary/firebase/collections");
    if (!organization?.id) return;
    await updateDoc(orgRef(organization.id), { billingEmail });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-white">Billing settings</h2>
        <Input label="Billing email" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} hint="Invoices and billing alerts are sent here." />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave}>Save</Button>
          {saved && <span className="text-xs text-brand-400">Saved</span>}
        </div>
      </Card>
      <Divider />
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Payment method</h2>
        <p className="text-sm text-white/40">Manage your payment method through the Stripe billing portal.</p>
        <Button variant="secondary" size="sm" onClick={() => window.open("/api/dispensary/billing/portal", "_blank")}>
          <CreditCard size={13} /> Open billing portal
        </Button>
      </Card>
      <Card className="space-y-3 border-red-900/40">
        <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
        <p className="text-sm text-white/40">Canceling your plan will disable push notifications and deal publishing at the end of your billing period.</p>
        <Button variant="danger" size="sm">Cancel subscription</Button>
      </Card>
    </div>
  );
}
