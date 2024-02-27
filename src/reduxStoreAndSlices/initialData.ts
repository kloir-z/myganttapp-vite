// import { assignIds } from "../components/Table/utils/wbsHelpers";
// import { WBSData, ChartRow, SeparatorRow, EventRow } from "../types/DataTypes";
// import { addPlannedDays, calculatePlannedDays } from "../components/Chart/utils/CalendarUtil";
// import { initialHolidayInput } from "./initialHolidays";
// import { updateHolidays } from "../components/Setting/utils/settingHelpers";

// const createEmptySeparatorRow = (): SeparatorRow => ({
//   rowType: "Separator",
//   no: 0,
//   id: "",
//   displayName: "test sep"
// });

// const createEmptyEventRow = (): EventRow => ({
//   rowType: "Event",
//   no: 0,
//   id: "",
//   displayName: "",
//   textColumn1: "",
//   textColumn2: "",
//   textColumn3: "",
//   textColumn4: "",
//   color: "",
//   plannedStartDate: "",
//   plannedEndDate: "",
//   plannedDays: null,
//   actualStartDate: "",
//   actualEndDate: "",
//   eventData: []
// });

// const formatDate = (date: Date): string => {
//   return `${date.getFullYear()}/${("0" + (date.getMonth() + 1)).slice(-2)}/${("0" + date.getDate()).slice(-2)}`;
// };

// const generateRandomDate = (): Date => {
//   const start = new Date();
//   const end = new Date();
//   end.setMonth(start.getMonth() + 5);
//   const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
//   return randomDate;
// };

// const createEmptyChartRow = (): ChartRow => {
//   const plannedStartDate = generateRandomDate();
//   const holidays: string[] = updateHolidays(initialHolidayInput);
//   const isIncludeHolidays = false;
//   const regularHolidays: number[] = [0, 6];
//   const plannedEndDate = addPlannedDays(plannedStartDate, 20, holidays, isIncludeHolidays, true, regularHolidays);
//   const plannedDays = calculatePlannedDays(plannedStartDate, plannedEndDate, holidays, false, regularHolidays)

//   return {
//     rowType: "Chart",
//     no: 0,
//     id: "",
//     displayName: "test",
//     textColumn1: "test",
//     textColumn2: "",
//     textColumn3: "",
//     textColumn4: "",
//     color: "test",
//     plannedStartDate: formatDate(plannedStartDate),
//     plannedEndDate: formatDate(plannedEndDate),
//     plannedDays: plannedDays,
//     actualStartDate: "",
//     actualEndDate: "",
//     dependentId: "",
//     dependency: "",
//     isIncludeHolidays: false
//   };
// };

// const createStructuredDataArray = (): WBSData[] => {
//   const data: WBSData[] = [];
//   data.push(createEmptySeparatorRow());
//   data.push(createEmptyEventRow());

//   let rowCount = 0;

//   for (let i = 0; i < 500; i++) {
//     data.push(createEmptyChartRow());
//     rowCount++;

//     if (rowCount % 10 === 0) {
//       data.push(createEmptySeparatorRow());
//     }
//   }

//   return data;
// };

// const structuredData: WBSData[] = createStructuredDataArray();

// export const initializedEmptyData: { [id: string]: WBSData } = assignIds(structuredData);







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
  for (let i = 0; i < 500; i++) {
    data.push(createEmptyChartRow());
  }
  return data;
};

const structuredData: WBSData[] = createStructuredDataArray();

export const initializedEmptyData: { [id: string]: WBSData } = assignIds(structuredData);