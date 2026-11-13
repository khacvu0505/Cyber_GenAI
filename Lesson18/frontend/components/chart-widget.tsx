"use client";

import * as echarts from "echarts";
import { Braces, GripHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Widget } from "@/lib/types";

const palette = ["#f2c94c", "#63d5ca", "#7ba2ff", "#ff8c7a", "#b892ff", "#8dd87e"];

function formatValue(value: unknown, format: Widget["number_format"]) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "-");
  if (format === "compact") return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(number);
  if (format === "integer") return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(number);
  if (format === "decimal") return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(number);
  if (format === "percent") return `${number.toFixed(1)}%`;
  if (format === "currency") return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(number);
  return new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(number);
}

function chartOption(widget: Widget): echarts.EChartsOption {
  const xField = widget.x_field ?? "";
  const yFields = widget.y_fields ?? [];
  const labels = widget.data.map((row) => String(row[xField] ?? ""));
  const common: echarts.EChartsOption = {
    color: palette,
    backgroundColor: "transparent",
    textStyle: { color: "#aeb7c4", fontFamily: "Inter, system-ui, sans-serif" },
    tooltip: {
      trigger: widget.chart_type === "pie" ? "item" : "axis",
      backgroundColor: "#141922",
      borderColor: "#30394a",
      textStyle: { color: "#f5f7fb" },
    },
    grid: { left: 46, right: 18, top: 22, bottom: 42 },
  };

  if (widget.chart_type === "pie") {
    const valueField = yFields[0];
    return {
      ...common,
      legend: { bottom: 0, textStyle: { color: "#8d98a8", fontSize: 10 } },
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "43%"],
          label: { show: false },
          itemStyle: { borderColor: "#151922", borderWidth: 2, borderRadius: 4 },
          data: widget.data.map((row) => ({ name: String(row[xField]), value: Number(row[valueField]) || 0 })),
        },
      ],
    };
  }

  if (widget.chart_type === "scatter") {
    const valueField = yFields[0];
    return {
      ...common,
      xAxis: axis("value", xField),
      yAxis: axis("value", valueField),
      series: [{ type: "scatter", data: widget.data.map((row) => [Number(row[xField]), Number(row[valueField])]), symbolSize: 9 }],
    };
  }

  const seriesType = widget.chart_type === "bar" ? "bar" : "line";
  return {
    ...common,
    legend: yFields.length > 1 ? { top: 0, textStyle: { color: "#8d98a8", fontSize: 10 } } : undefined,
    xAxis: { ...axis("category", xField), data: labels, axisLabel: { color: "#8d98a8", fontSize: 10, rotate: labels.some((label) => label.length > 12) ? 25 : 0 } },
    yAxis: axis("value", ""),
    series: yFields.map((field, index) => ({
      name: field.replaceAll("_", " "),
      type: seriesType,
      data: widget.data.map((row) => Number(row[field]) || 0),
      smooth: widget.chart_type === "line" || widget.chart_type === "area",
      areaStyle: widget.chart_type === "area" ? { opacity: 0.18 } : undefined,
      symbolSize: 6,
      showSymbol: widget.data.length < 30,
      itemStyle: { borderRadius: widget.chart_type === "bar" ? [4, 4, 0, 0] : 0 },
      color: palette[index % palette.length],
    })) as echarts.SeriesOption[],
  };
}

function axis(type: "category" | "value", name: string) {
  return {
    type,
    name: name.replaceAll("_", " "),
    nameTextStyle: { color: "#748092", fontSize: 10 },
    axisLine: { lineStyle: { color: "#30394a" } },
    axisTick: { show: false },
    axisLabel: { color: "#8d98a8", fontSize: 10 },
    splitLine: { lineStyle: { color: "#283142", type: "dashed" as const } },
  };
}

function EChart({ widget }: { widget: Widget }) {
  const ref = useRef<HTMLDivElement>(null);
  const option = useMemo(() => chartOption(widget), [widget]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chart.setOption(option);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} className="h-full min-h-64 w-full" />;
}

function DataTable({ widget }: { widget: Widget }) {
  const columns = Object.keys(widget.data[0] ?? {});
  return (
    <div className="scrollbar-thin h-full overflow-auto rounded-md border border-[#283142]">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-[#1b2230] text-[10px] uppercase text-[#8d98a8]">
          <tr>{columns.map((column) => <th className="px-3 py-2.5 font-semibold" key={column}>{column.replaceAll("_", " ")}</th>)}</tr>
        </thead>
        <tbody>
          {widget.data.map((row, index) => (
            <tr className="border-t border-[#283142] text-[#d1d7e2]" key={index}>
              {columns.map((column) => <td className="whitespace-nowrap px-3 py-2" key={column}>{String(row[column] ?? "-")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartWidget({ widget }: { widget: Widget }) {
  const [showSql, setShowSql] = useState(false);
  const scalar = widget.data[0]?.[widget.value_field ?? "value"];
  const colSpan = widget.layout?.col_span === 3 ? "lg:col-span-3" : "lg:col-span-6";
  const minHeight = widget.chart_type === "kpi" ? "min-h-36" : "min-h-[360px]";

  return (
    <article className={`${colSpan} ${minHeight} relative flex flex-col rounded-lg border border-[#2d3544] bg-[#151922] p-4 shadow-lg`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{widget.title}</h3>
          {widget.description && <p className="mt-1 truncate text-xs text-[#8d98a8]">{widget.description}</p>}
        </div>
        <div className="flex items-center gap-1 text-[#748092]">
          {widget.sql && <button aria-label="View SQL" className="rounded-md p-1.5 hover:bg-[#263041] hover:text-[#f2c94c]" onClick={() => setShowSql(true)} type="button"><Braces size={15} /></button>}
          <GripHorizontal size={15} />
        </div>
      </header>

      <div className="mt-3 min-h-0 flex-1">
        {widget.chart_type === "kpi" ? (
          <div className="flex h-full items-end justify-between gap-4">
            <div className="min-w-0 text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-none text-white">{formatValue(scalar, widget.number_format)}</div>
            <div className="mb-1 h-10 w-1 rounded-full bg-[#f2c94c]" />
          </div>
        ) : widget.chart_type === "table" ? (
          <DataTable widget={widget} />
        ) : (
          <EChart widget={widget} />
        )}
      </div>

      {showSql && (
        <div className="absolute inset-0 z-10 flex flex-col rounded-lg border border-[#3d485d] bg-[#0f131a]/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#f2c94c]">Generated SQL</span>
            <button aria-label="Close SQL" className="rounded-md p-1 hover:bg-[#263041]" onClick={() => setShowSql(false)} type="button"><X size={16} /></button>
          </div>
          <pre className="scrollbar-thin mt-3 min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-md border border-[#2d3544] bg-[#090d13] p-3 text-[11px] leading-5 text-[#cbd3de]">{widget.sql}</pre>
        </div>
      )}
    </article>
  );
}
