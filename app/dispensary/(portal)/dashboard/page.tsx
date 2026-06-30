"use client";

import { useState } from "react";
import { Download, Users, Bell, Eye, TrendingUp } from "lucide-react";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { StatCard, Card, Badge, cn } from "@component/components/dispensary/ui";

const MOCK_STATS = {
  downloads:     12843,
  activeUsers:   4210,
  monthlyActive: 8940,
  pushOpenRate:  0.34,
  dealsViewed:   7621,
};

const RECENT_ACTIVITY = [
  { type: "push",  label: "Push sent to Ballard",           time: "2h ago",  status: "sent"    },
  { type: "deal",  label: "Weekend sale went live",          time: "4h ago",  status: "active"  },
  { type: "deal",  label: "Flash deal expired",              time: "1d ago",  status: "expired" },
  { type: "notif", label: "New feature: Multi-location push", time: "2d ago", status: "info"    },
];

type Period = "7d" | "30d" | "90d";

export default function DispensaryDashboardPage() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="flex flex-col h-full">
      <DispensaryHeader title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">

        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">Overview for your account</p>
          <div className="flex items-center gap-1 bg-surface-100 border border-border rounded p-0.5">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors",
                  period === p ? "bg-brand-700 text-brand-200" : "text-white/40 hover:text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Downloads"      value={MOCK_STATS.downloads.toLocaleString()}                    delta="+4.2%"  positive icon={<Download size={15} />} />
          <StatCard label="Active Users"   value={MOCK_STATS.activeUsers.toLocaleString()}                  delta="+1.8%"  positive icon={<Users size={15} />} />
          <StatCard label="Push Open Rate" value={`${(MOCK_STATS.pushOpenRate * 100).toFixed(1)}%`}         delta="+0.4pt" positive icon={<Bell size={15} />} />
          <StatCard label="Deals Viewed"   value={MOCK_STATS.dealsViewed.toLocaleString()}                  delta="-2.1%"           icon={<Eye size={15} />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 space-y-1" padding="none">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
              <TrendingUp size={14} className="text-white/30" />
            </div>
            <ul>
              {RECENT_ACTIVITY.map((item, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-0">
                  <span className="text-sm text-white/70">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      item.status === "active"  ? "success" :
                      item.status === "expired" ? "warning" :
                      item.status === "info"    ? "info"    : "default"
                    }>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-white/30">{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-white/50 uppercase tracking-wide">Monthly Active Users</p>
              <p className="mt-2 text-4xl font-display font-semibold text-white">
                {MOCK_STATS.monthlyActive.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-white/30 mt-4">
              Across all locations · last {period}.
            </p>
          </Card>
        </div>

      </div>
    </div>
  );
}
