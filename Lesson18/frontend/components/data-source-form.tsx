"use client";

import { Database, KeyRound, LoaderCircle, Lock, PlugZap, Server } from "lucide-react";
import { useState } from "react";

import type { DataSourceConnectInput, DataSourceConnectResponse, DatabaseKind } from "@/lib/types";

const defaults: Record<DatabaseKind, Pick<DataSourceConnectInput, "kind" | "port" | "use_ssl">> = {
  postgresql: { kind: "postgresql", port: 5432, use_ssl: true },
  mysql: { kind: "mysql", port: 3306, use_ssl: true },
};

export function DataSourceForm({
  connecting,
  onConnect,
}: {
  connecting: boolean;
  onConnect: (input: DataSourceConnectInput) => Promise<DataSourceConnectResponse>;
}) {
  const [kind, setKind] = useState<DatabaseKind>("postgresql");
  const [form, setForm] = useState<DataSourceConnectInput>({
    ...defaults.postgresql,
    host: "",
    database: "",
    username: "",
    password: "",
    schema_name: "",
  });
  const [error, setError] = useState<string | null>(null);

  const updateKind = (nextKind: DatabaseKind) => {
    setKind(nextKind);
    setForm((current) => ({ ...current, ...defaults[nextKind] }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await onConnect({
        ...form,
        kind,
        schema_name: form.schema_name?.trim() || null,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connection failed");
    }
  };

  return (
    <form className="rounded-lg border border-[#2d3544] bg-[#151922] p-4 shadow-xl" onSubmit={submit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Connect data source</h2>
          <p className="mt-1 text-xs text-[#9aa4b2]">Credentials are kept in backend memory for this running session.</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-[#f2c94c]/12 text-[#f2c94c]">
          <PlugZap size={18} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-[#2d3544] bg-[#10141b] p-1">
        {(["postgresql", "mysql"] as const).map((option) => (
          <button
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${kind === option ? "bg-[#f2c94c] text-[#141414]" : "text-[#9aa4b2] hover:bg-[#202735] hover:text-white"}`}
            key={option}
            onClick={() => updateKind(option)}
            type="button"
          >
            {option === "postgresql" ? "PostgreSQL" : "MySQL"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field icon={<Server size={14} />} label="Host">
          <input required value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} placeholder="db.example.com" />
        </Field>
        <Field icon={<Database size={14} />} label="Port">
          <input required type="number" value={form.port} onChange={(event) => setForm({ ...form, port: Number(event.target.value) })} />
        </Field>
        <Field icon={<Database size={14} />} label="Database">
          <input required value={form.database} onChange={(event) => setForm({ ...form, database: event.target.value })} placeholder="analytics" />
        </Field>
        <Field icon={<Database size={14} />} label="Schema">
          <input value={form.schema_name ?? ""} onChange={(event) => setForm({ ...form, schema_name: event.target.value })} placeholder={kind === "postgresql" ? "public" : "optional"} />
        </Field>
        <Field icon={<KeyRound size={14} />} label="Username">
          <input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="readonly_user" />
        </Field>
        <Field icon={<Lock size={14} />} label="Password">
          <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" />
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-xs text-[#aeb7c4]">
        <input checked={form.use_ssl} onChange={(event) => setForm({ ...form, use_ssl: event.target.checked })} type="checkbox" />
        Require SSL/TLS
      </label>

      {error && <div className="mt-3 rounded-md border border-[#6a3235] bg-[#351f25] px-3 py-2 text-xs text-[#ffb1b1]">{error}</div>}

      <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#f2c94c] text-sm font-semibold text-[#161616] hover:bg-[#f7d968]" disabled={connecting} type="submit">
        {connecting ? <LoaderCircle className="animate-spin" size={16} /> : <PlugZap size={16} />}
        Connect and read schema
      </button>
    </form>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#8d98a8]">
        {icon}
        {label}
      </span>
      {children && (
        <div className="[&_input]:h-10 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-[#334052] [&_input]:bg-[#0f131a] [&_input]:px-3 [&_input]:text-sm [&_input]:text-white [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#596272] focus-within:[&_input]:border-[#63d5ca]">
          {children}
        </div>
      )}
    </label>
  );
}
