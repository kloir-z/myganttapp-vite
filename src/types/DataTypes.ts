// DataTypes.ts
export type RowType = "Chart" | "Separator" | "Event";

export interface BaseRow {
  no: number;
  id: string;
  rowType: RowType;
  displayName: string;
}

export interface ChartRow extends BaseRow {
  rowType: "Chart";
  textColumn1: string;
  textColumn2: string;
  textColumn3: string;
  textColumn4: string;
  color: string;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedDays: number | null;
  actualStartDate: string;
  actualEndDate: string;
  dependentId: string;
  dependency: string;
  isIncludeHolidays: boolean;
}

export interface SeparatorRow extends BaseRow {
  rowType: "Separator";
}

export interface EventData {
  isPlanned: boolean;
  eachDisplayName: string;
  startDate: string;
  endDate: string;
}

export interface EventRow extends BaseRow {
  rowType: "Event";
  textColumn1: string;
  textColumn2: string;
  textColumn3: string;
  textColumn4: string;
  color: string;
  plannedStartDate: string;
  plannedEndDate: string;
  plannedDays: number | null;
  actualStartDate: string;
  actualEndDate: string;
  eventData: EventData[];
}

export type WBSData = ChartRow | SeparatorRow | EventRow;

export function isChartRow(entry: WBSData): entry is ChartRow {
  return entry.rowType === "Chart";
}

export function isSeparatorRow(entry: WBSData): entry is SeparatorRow {
  return entry.rowType === "Separator";
}

export function isEventRow(entry: WBSData): entry is EventRow {
  return entry.rowType === "Event";
}

export type RegularDaysOffSetting = {
  id: number;
  color: string;
  subColor: string;
  days: number[];
};