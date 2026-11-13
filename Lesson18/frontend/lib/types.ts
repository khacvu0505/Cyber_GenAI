export type DatabaseKind = "postgresql" | "mysql";
export type ChartType = "kpi" | "bar" | "line" | "area" | "pie" | "scatter" | "table";
export type NumberFormat = "number" | "integer" | "decimal" | "percent" | "currency" | "compact";

export type ColumnInfo = {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key?: string | null;
};

export type TableInfo = {
  name: string;
  columns: ColumnInfo[];
};

export type SchemaInfo = {
  dialect: DatabaseKind;
  database: string;
  schema_name?: string | null;
  tables: TableInfo[];
};

export type DataSourceConnectInput = {
  kind: DatabaseKind;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema_name?: string | null;
  use_ssl: boolean;
};

export type DataSourceConnectResponse = {
  connection_id: string;
  status: "connected";
  schema: SchemaInfo;
  suggested_questions: string[];
};

export type Widget = {
  id: string;
  title: string;
  description: string;
  chart_type: ChartType;
  data: Record<string, unknown>[];
  sql?: string | null;
  x_field?: string | null;
  y_fields: string[];
  series_field?: string | null;
  value_field?: string | null;
  number_format: NumberFormat;
  layout: {
    col_span: number;
    row_span: number;
  };
};

export type DashboardResponse = {
  title: string;
  message: string;
  mode: "openai" | "heuristic";
  widgets: Widget[];
  schema: SchemaInfo;
};

export type MetaResponse = {
  app_name: string;
  model: string;
  copilot_mode: "openai" | "heuristic";
};
