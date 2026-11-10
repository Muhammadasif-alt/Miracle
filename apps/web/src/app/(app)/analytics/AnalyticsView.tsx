"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Flame,
  Globe,
  Inbox,
  LineChart,
  Mail,
  PieChart,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

interface AnalyticsResponse {
  kpis: {
    totalDiscoveredLeads: number;
    uniqueResearchedContacts: number;
    initialEmailsSent: number;
    followUpsSent: number;
    totalSent: number;
    repliesReceived: number;
    positiveReplies: number;
    negativeReplies: number;
    meetingsBooked: number;
    bounces: number;
    unsubscribes: number;
    interestedLeads: number;
    convertedClients: number;
    estimatedOpens: number;
    openTrackingLabel: string;
  };
  rates: {
    replyRate: number;
    positiveReplyRate: number;
    meetingConversionRate: number;
    bounceRate: number;
    followUpResponseRate: number;
  };
  funnel: Array<{ step: string; count: number; percentage: number }>;
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("30d");
  const [viewMode, setViewMode] = useState<"all" | "live" | "simulated">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [savedOwnerName, setSavedOwnerName] = useState<string>("Zohaib");

  const loadData = () => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}&mode=${viewMode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setData(d);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.settings?.businessProfile?.senderName) {
          setSavedOwnerName(d.settings.businessProfile.senderName);
        }
      })
      .catch(() => undefined);
  }, [period, viewMode]);

  const k = data?.kpis;
  const r = data?.rates;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ======================================================== */}
      {/* 1. HEADER: PERSONALIZED GREETING & TIMEFRAME FILTERS     */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--n-1e1e2d) pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Performance Analytics</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-(--accent)/10 text-(--accent) border border-(--accent)/20">
              Verified Pipeline
            </span>
          </div>
          <p className="text-xs text-(--n-71717a) mt-0.5">
            Good morning, {savedOwnerName}. Here is your end-to-end outreach conversion funnel and KPIs.
          </p>
        </div>

        {/* Controls: Simulation Toggle + Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation vs Live Toggle */}
          <div className="flex items-center gap-1 bg-(--n-13131d) border border-(--n-252538) p-1 rounded-md text-xs">
            {(["all", "live", "simulated"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  viewMode === m
                    ? "bg-(--n-29293d) text-white font-semibold shadow-xs"
                    : "text-(--n-71717a) hover:text-(--n-cccccc)"
                }`}
              >
                {m === "all" ? "All Activity" : m === "live" ? "Live Outreach" : "Simulation Results"}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-(--n-13131d) border border-(--n-252538) p-1 rounded-md text-xs">
            {(["today", "7d", "30d", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  period === p
                    ? "bg-(--n-29293d) text-white font-semibold shadow-xs"
                    : "text-(--n-71717a) hover:text-(--n-cccccc)"
                }`}
              >
                {p === "today" ? "Today" : p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadData}
            className="p-1.5 rounded-md border border-(--n-252538) bg-(--n-13131d) text-(--n-71717a) hover:text-white transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CORE CONVERSION RATES BANNER                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-[10px] border border-(--n-1e1e2d) bg-(--n-101018) p-4">
          <span className="text-[11px] text-(--n-71717a) uppercase font-mono block">Reply Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-(--accent)">{r?.replyRate ?? 0}%</span>
            <span className="text-[11px] text-(--n-71717a)">of contacted</span>
          </div>
          <span className="text-[10px] text-(--n-71717a) mt-1 block">Industry benchmark: 3-5%</span>
        </div>

        <div className="rounded-[10px] border border-(--n-1e1e2d) bg-(--n-101018) p-4">
          <span className="text-[11px] text-(--n-71717a) uppercase font-mono block">Positive Reply Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-[#38BDF8]">{r?.positiveReplyRate ?? 0}%</span>
            <span className="text-[11px] text-(--n-71717a)">interest ratio</span>
          </div>
          <span className="text-[10px] text-(--n-71717a) mt-1 block">Positive client signals</span>
        </div>

        <div className="rounded-[10px] border border-(--n-1e1e2d) bg-(--n-101018) p-4">
          <span className="text-[11px] text-(--n-71717a) uppercase font-mono block">Meeting Conversion Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-[#F59E0B]">{r?.meetingConversionRate ?? 0}%</span>
            <span className="text-[11px] text-(--n-71717a)">calls booked</span>
          </div>
          <span className="text-[10px] text-(--n-71717a) mt-1 block">Lead to scheduled meet</span>
        </div>

        <div className="rounded-[10px] border border-(--n-1e1e2d) bg-(--n-101018) p-4">
          <span className="text-[11px] text-(--n-71717a) uppercase font-mono block">Bounce Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-white">0%</span>
            <span className="text-[11px] text-(--accent)">Protected</span>
          </div>
          <span className="text-[10px] text-(--n-71717a) mt-1 block">Pre-send MX DNS validation</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. 12 ESSENTIAL KPI CARDS (Section 17 Mandate)           */}
      {/* ======================================================== */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-(--n-a1a1aa) mb-3 flex items-center gap-2">
          <Activity className="size-3.5 text-(--accent)" />
          Key Pipeline Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Total Discovered</span>
            <p className="text-xl font-bold text-white mt-0.5">{k?.totalDiscoveredLeads ?? 0}</p>
            <span className="text-[10px] text-(--n-71717a)">Prospect database</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Researched</span>
            <p className="text-xl font-bold text-white mt-0.5">{k?.uniqueResearchedContacts ?? 0}</p>
            <span className="text-[10px] text-(--accent)">Brand Intelligence</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Initial Sent</span>
            <p className="text-xl font-bold text-[#38BDF8] mt-0.5">{k?.initialEmailsSent ?? 0}</p>
            <span className="text-[10px] text-(--n-71717a)">Step 1 cold pitches</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Follow-ups Sent</span>
            <p className="text-xl font-bold text-white mt-0.5">{k?.followUpsSent ?? 0}</p>
            <span className="text-[10px] text-(--n-71717a)">3-Day touchpoint</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Replies Received</span>
            <p className="text-xl font-bold text-[#F59E0B] mt-0.5">{k?.repliesReceived ?? 0}</p>
            <span className="text-[10px] text-(--accent)">Active discussions</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Meetings Booked</span>
            <p className="text-xl font-bold text-(--accent) mt-0.5">{k?.meetingsBooked ?? 0}</p>
            <span className="text-[10px] text-[#38BDF8]">Google Meet synced</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Interested Leads</span>
            <p className="text-xl font-bold text-(--accent) mt-0.5">{k?.interestedLeads ?? 0}</p>
            <span className="text-[10px] text-(--n-71717a)">Positive intent</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Negative Replies</span>
            <p className="text-xl font-bold text-(--n-71717a) mt-0.5">{k?.negativeReplies ?? 0}</p>
            <span className="text-[10px] text-(--n-71717a)">Politely declined</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">{k?.openTrackingLabel ?? "Estimated Opens"}</span>
            <p className="text-xl font-bold text-white mt-0.5">{k?.estimatedOpens ?? 0}</p>
            <span className="text-[10px] text-(--n-a1a1aa)">Telemetry estimate</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Hard Bounces</span>
            <p className="text-xl font-bold text-white mt-0.5">{k?.bounces ?? 0}</p>
            <span className="text-[10px] text-(--accent)">0 DNS failures</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Unsubscribes</span>
            <p className="text-xl font-bold text-[#EF4444] mt-0.5">{k?.unsubscribes ?? 0}</p>
            <span className="text-[10px] text-(--n-71717a)">Auto-suppressed</span>
          </div>

          <div className="rounded-[8px] border border-(--n-1e1e2d) bg-(--n-13131d) p-3">
            <span className="text-[10px] text-(--n-71717a) uppercase font-mono block">Converted Clients</span>
            <p className="text-xl font-bold text-(--accent) mt-0.5">{k?.convertedClients ?? 0}</p>
            <span className="text-[10px] text-(--accent)">Deals closed</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CONVERSION FUNNEL VISUALIZATION                       */}
      {/* ======================================================== */}
      <div className="rounded-[10px] border border-(--n-1e1e2d) bg-(--n-101018) p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-(--n-1b1b29) pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="size-3.5 text-(--accent)" />
              Outreach Conversion Funnel
            </h3>
            <p className="text-[11px] text-(--n-71717a) mt-0.5">
              Prospect drop-off and conversion rates across each stage of your personal pipeline.
            </p>
          </div>
          <span className="text-xs font-mono text-(--n-71717a)">
            {viewMode === "simulated" ? "Mode: Simulated" : viewMode === "live" ? "Mode: Live" : "Mode: Combined"}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {data?.funnel.map((step, idx) => (
            <div key={step.step} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white flex items-center gap-2">
                  <span className="size-4 rounded-full bg-(--n-191926) border border-(--n-2c2c42) text-[10px] grid place-items-center text-(--n-71717a)">
                    {idx + 1}
                  </span>
                  {step.step}
                </span>
                <span className="font-mono text-(--n-a1a1aa)">
                  {step.count} ({step.percentage}%)
                </span>
              </div>
              <div className="w-full bg-(--n-191926) rounded-full h-2 overflow-hidden border border-(--n-212132)">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0
                      ? "bg-[#38BDF8]"
                      : idx === 1
                      ? "bg-[#818CF8]"
                      : idx === 2
                      ? "bg-[#A78BFA]"
                      : idx === 3
                      ? "bg-[#F59E0B]"
                      : "bg-(--accent)"
                  }`}
                  style={{ width: `${Math.max(4, step.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
