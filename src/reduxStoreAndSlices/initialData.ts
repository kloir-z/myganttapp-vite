import { assignIds } from "../components/Table/utils/wbsHelpers";
import { WBSData, ChartRow, SeparatorRow, EventRow } from "../types/DataTypes";
// import { addPlannedDays } from "../components/Chart/utils/CalendarUtil";

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

// const formatdate = (date: date): string => {
//   return `${date.getfullyear()}/${("0" + (date.getmonth() + 1)).slice(-2)}/${("0" + date.getdate()).slice(-2)}`;
// };

// const generateRandomDate = (): Date => {
//   const start = new Date();
//   const end = new Date();
//   end.setMonth(start.getMonth() + 5);
//   const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//   return randomDate;
// };

const createEmptyChartRow = (): ChartRow => {
  // const plannedStartDate = generateRandomDate();
  // const holidays: string[] = [];
  // const isIncludeHolidays = false;
  // const regularHolidays: number[] = [];
  // const plannedEndDate = addPlannedDays(plannedStartDate, 20, holidays, isIncludeHolidays, true, regularHolidays);

  return {
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
  };
};

const createStructuredDataArray = (): WBSData[] => {
  const data: WBSData[] = [];
  data.push(createEmptySeparatorRow());
  data.push(createEmptyEventRow());
  for (let i = 0; i < 500; i++) {
    data.push(createEmptyChartRow());
  }
  return data;
};

const structuredData: WBSData[] = createStructuredDataArray();

export const initializedEmptyData: { [id: string]: WBSData } = assignIds(structuredData);