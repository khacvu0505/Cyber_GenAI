"use client";

import { Columns3, Database, Key, Link2 } from "lucide-react";

import type { SchemaInfo } from "@/lib/types";

export function SchemaPanel({ schema, suggestions, onSuggestion }: { schema: SchemaInfo | null; suggestions: string[]; onSuggestion: (value: string) => void }) {
  return (
    <aside className="rounded-lg border border-[#2d3544] bg-[#121720] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Database size={16} className="text-[#63d5ca]" />
        Schema explorer
      </div>

      {!schema ? (
        <p className="mt-3 text-xs leading-5 text-[#8d98a8]">Connect PostgreSQL or MySQL to inspect tables and generate dashboard queries.</p>
      ) : (
        <>
          <div className="mt-3 rounded-md border border-[#2d3544] bg-[#0e131b] px-3 py-2 text-xs text-[#aeb7c4]">
            <div className="font-semibold text-white">{schema.database}</div>
            <div className="mt-0.5 text-[#7f8a99]">{schema.dialect} · {schema.tables.length} tables</div>
          </div>

          <div className="scrollbar-thin mt-3 max-h-[420px] space-y-2 overflow-auto pr-1">
            {schema.tables.map((table) => (
              <details className="rounded-md border border-[#263041] bg-[#111721]" key={table.name}>
                <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[#f5f7fb]">{table.name}</summary>
                <div className="border-t border-[#263041] px-3 py-2">
                  {table.columns.map((column) => (
                    <div className="flex items-start justify-between gap-2 py-1.5 text-[11px]" key={column.name}>
                      <span className="flex min-w-0 items-center gap-1.5 text-[#c8d0dc]">
                        {column.primary_key ? <Key size={11} className="shrink-0 text-[#f2c94c]" /> : column.foreign_key ? <Link2 size={11} className="shrink-0 text-[#7ba2ff]" /> : <Columns3 size={11} className="shrink-0 text-[#697587]" />}
                        <span className="truncate">{column.name}</span>
                      </span>
                      <span className="shrink-0 text-[#748092]">{column.type}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-[11px] font-semibold uppercase text-[#8d98a8]">Suggested prompts</div>
            {suggestions.map((suggestion) => (
              <button className="block w-full rounded-md border border-[#2d3544] bg-[#0e131b] px-3 py-2 text-left text-xs leading-5 text-[#cbd3de] transition hover:border-[#63d5ca] hover:text-white" key={suggestion} onClick={() => onSuggestion(suggestion)} type="button">
                {suggestion}
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
