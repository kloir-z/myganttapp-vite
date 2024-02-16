import { assignIds } from "../components/Table/utils/wbsHelpers";
import { WBSData, ChartRow, SeparatorRow, EventRow } from "../types/DataTypes";

const createEmptySeparatorRow = (): SeparatorRow => ({
  rowType: "Separator",
  no: 0,
  id: "",
  displayName: ""
});

const createEmptyEventRow = (): EventRow => ({
  rowType: "Event",
  no: 0,
  id: "",
  displayName: "",
  textColumn1: "",
  textColumn2: "",
  textColumn3: "",
  textColumn4: "",
  color: "",
  plannedStartDate: "",
  plannedEndDate: "",
  plannedDays: null,
  actualStartDate: "",
  actualEndDate: "",
  eventData: []
});

const createEmptyChartRow = (): ChartRow => ({
  rowType: "Chart",
  no: 0,
  id: "",
  displayName: "",
  textColumn1: "",
  textColumn2: "",
  textColumn3: "",
  textColumn4: "",
  color: "",
  plannedStartDate: "",
  plannedEndDate: "",
  plannedDays: null,
  actualStartDate: "",
  actualEndDate: "",
  dependentId: "",
  dependency: "",
  isIncludeHolidays: false
});

const createStructuredDataArray = (): WBSData[] => {
  const data: WBSData[] = [];
  data.push(createEmptySeparatorRow());
  data.push(createEmptyEventRow());
  for (let i = 0; i < 38; i++) {
    data.push(createEmptyChartRow());
  }
  return data;
};

const structuredData: WBSData[] = createStructuredDataArray();

export const initializedEmptyData: { [id: string]: WBSData } = assignIds(structuredData);