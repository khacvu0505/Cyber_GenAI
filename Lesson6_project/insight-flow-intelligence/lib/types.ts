export type ChartType = "bar" | "line" | "area" | "pie" | "scatter" | "table" | "kpi";
export type NumberFormat = "number" | "integer" | "decimal" | "percent" | "compact";

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  title: string;
  description: string;
  chart_type: ChartType;
  x_field?: string | null;
  y_fields: string[];
  series_field?: string | null;
  value_field?: string | null;
  number_format: NumberFormat;
  data: Record<string, unknown>[];
  sql?: string | null;
  layout: WidgetLayout;
}

export interface DashboardResponse {
  title: string;
  subtitle: string;
  widgets: Widget[];
}

export interface CopilotResponse {
  title: string;
  message: string;
  mode: "openai" | "demo";
  widgets: Widget[];
}

export interface MetaResponse {
  app_name: string;
  model: string;
  copilot_mode: "openai" | "demo";
  dataset: string;
}
