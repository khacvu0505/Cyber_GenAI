"use client";

import { Activity, CircleAlert, LoaderCircle, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { DashboardResponse, DataSourceConnectInput, MetaResponse, SchemaInfo, Widget } from "@/lib/types";
import { ChartWidget } from "./chart-widget";
import { CopilotBox } from "./copilot-box";
import { DataSourceForm } from "./data-source-form";
import { SchemaPanel } from "./schema-panel";

export function Dashboard() {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [title, setTitle] = useState("Data Augmented BI Copilot");
  const [message, setMessage] = useState("Connect a database to turn natural-language questions into safe SQL and visual dashboards.");
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => null);
  }, []);

  const applyDashboard = (dashboard: DashboardResponse) => {
    setTitle(dashboard.title);
    setMessage(dashboard.message);
    setWidgets(dashboard.widgets);
    setSchema(dashboard.schema);
  };

  const connect = async (input: DataSourceConnectInput) => {
    setConnecting(true);
    setError(null);
    try {
      const response = await api.connect(input);
      setConnectionId(response.connection_id);
      setSchema(response.schema);
      setSuggestions(response.suggested_questions);
      setPrompt(response.suggested_questions[0] ?? "");
      const dashboard = await api.dashboard(response.connection_id);
      applyDashboard(dashboard);
      return response;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not connect to data source");
      throw reason;
    } finally {
      setConnecting(false);
    }
  };

  const ask = async (value: string) => {
    if (!connectionId) {
      setError("Connect a data source first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      applyDashboard(await api.copilot(connectionId, value));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Copilot query failed");
    } finally {
      setLoading(false);
    }
  };

  const regenerateOverview = async () => {
    if (!connectionId) return;
    setLoading(true);
    setError(null);
    try {
      applyDashboard(await api.dashboard(connectionId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dashboard generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-5 md:px-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col justify-between gap-4 border-b border-[#2d3544] pb-5 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-[#f2c94c]">
              <Sparkles size={14} />
              Data Augmented Generation
            </div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9aa4b2]">{message}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill icon={<ShieldCheck size={14} />} label="Read-only SQL guard" />
            <StatusPill icon={<Activity size={14} />} label={meta?.copilot_mode === "openai" ? meta.model : "Heuristic mode"} />
            <button className="flex h-9 items-center gap-2 rounded-lg border border-[#334052] px-3 text-xs text-[#cbd3de] hover:border-[#63d5ca] hover:text-white" disabled={!connectionId || loading} onClick={regenerateOverview} type="button">
              <RefreshCcw size={14} />
              Overview
            </button>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-5">
            <DataSourceForm connecting={connecting} onConnect={connect} />
            <SchemaPanel schema={schema} suggestions={suggestions} onSuggestion={(value) => setPrompt(value)} />
          </div>

          <section className="min-w-0">
            <CopilotBox disabled={!connectionId || loading} prompt={prompt} onPromptChange={setPrompt} onSubmit={ask} />
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#6a3235] bg-[#351f25] px-3 py-3 text-sm text-[#ffb1b1]">
                <CircleAlert className="mt-0.5 shrink-0" size={16} />
                <span>{error}</span>
              </div>
            )}
            {loading && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#334052] bg-[#111721] px-3 py-3 text-sm text-[#cbd3de]">
                <LoaderCircle className="animate-spin text-[#f2c94c]" size={16} />
                Copilot is reading schema, generating safe SQL and building visuals.
              </div>
            )}

            {widgets.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                {widgets.map((widget) => (
                  <ChartWidget key={widget.id} widget={widget} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-[#334052] bg-[#121720] px-3 text-xs text-[#cbd3de]">
      <span className="text-[#63d5ca]">{icon}</span>
      {label}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 grid min-h-[520px] place-items-center rounded-lg border border-dashed border-[#334052] bg-[#111721] px-6 text-center">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-lg bg-[#63d5ca]/12 text-[#63d5ca]">
          <Sparkles size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">Waiting for your data</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#9aa4b2]">Connect PostgreSQL or MySQL, then ask for a dashboard, trend analysis, KPI overview or table exploration.</p>
      </div>
    </div>
  );
}
