import { create } from "zustand";

import type { Widget } from "./types";


interface DashboardState {
  title: string;
  subtitle: string;
  widgets: Widget[];
  initialTitle: string;
  initialSubtitle: string;
  initialWidgets: Widget[];
  loading: boolean;
  error: string | null;
  copilotMessage: string | null;
  setOverview: (title: string, subtitle: string, widgets: Widget[]) => void;
  replaceDashboard: (title: string, widgets: Widget[], message: string) => void;
  updateLayout: (layouts: Array<{ i: string; x: number; y: number; w: number; h: number }>) => void;
  removeWidget: (id: string) => void;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}


function arrangeWidgets(widgets: Widget[]): Widget[] {
  const kpis = widgets.filter((widget) => widget.chart_type === "kpi");
  const visuals = widgets.filter((widget) => widget.chart_type !== "kpi");
  const kpiWidth = kpis.length <= 2 ? 6 : kpis.length === 3 ? 4 : 3;
  const kpiRows = Math.ceil(kpis.length / 4);
  const visualStartY = kpiRows * 3;

  const arrangedKpis = kpis.map((widget, index) => ({
    ...widget,
    layout: {
      x: kpis.length <= 4 ? index * kpiWidth : (index % 4) * 3,
      y: Math.floor(index / 4) * 3,
      w: kpis.length <= 4 ? kpiWidth : 3,
      h: 3,
    },
  }));
  const arrangedVisuals = visuals.map((widget, index) => {
    const isLastOdd = visuals.length % 2 === 1 && index === visuals.length - 1;
    return {
      ...widget,
      layout: {
        x: isLastOdd ? 0 : (index % 2) * 6,
        y: visualStartY + Math.floor(index / 2) * 6,
        w: isLastOdd ? 12 : 6,
        h: 6,
      },
    };
  });
  return [...arrangedKpis, ...arrangedVisuals];
}


export const useDashboardStore = create<DashboardState>((set) => ({
  title: "TV Shows Intelligence",
  subtitle: "Interactive overview of catalog, ratings, genres and releases",
  widgets: [],
  initialTitle: "TV Shows Intelligence",
  initialSubtitle: "Interactive overview of catalog, ratings, genres and releases",
  initialWidgets: [],
  loading: true,
  error: null,
  copilotMessage: null,
  setOverview: (title, subtitle, widgets) =>
    set({
      title,
      subtitle,
      widgets: arrangeWidgets(widgets),
      initialTitle: title,
      initialSubtitle: subtitle,
      initialWidgets: arrangeWidgets(widgets),
      loading: false,
      error: null,
    }),
  replaceDashboard: (title, widgets, message) =>
    set({
      title,
      subtitle: "AI-generated analysis based on your question and live query results",
      widgets: arrangeWidgets(widgets),
      copilotMessage: message,
      loading: false,
      error: null,
    }),
  updateLayout: (layouts) =>
    set((state) => ({
      widgets: state.widgets.map((widget) => {
        const item = layouts.find((layout) => layout.i === widget.id);
        return item
          ? { ...widget, layout: { x: item.x, y: item.y, w: item.w, h: item.h } }
          : widget;
      }),
    })),
  removeWidget: (id) =>
    set((state) => ({ widgets: state.widgets.filter((widget) => widget.id !== id) })),
  reset: () =>
    set((state) => ({
      widgets: state.initialWidgets,
      title: state.initialTitle,
      subtitle: state.initialSubtitle,
      copilotMessage: null,
      error: null,
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
