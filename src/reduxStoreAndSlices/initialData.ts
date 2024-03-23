import { assignIds } from "../components/Table/utils/wbsHelpers";
import { WBSData, ChartRow, SeparatorRow, EventRow } from "../types/DataTypes";
import { addPlannedDays, calculatePlannedDays } from "../components/utils/CommonUtils";
import { initialHolidayInput } from "./initialHolidays";
import { updateHolidays } from "../components/Setting/utils/settingHelpers";
import { cdate } from "cdate";

const createEmptySeparatorRow = (): SeparatorRow => ({
  rowType: "Separator",
  no: 0,
  id: "",
  displayName: "testSeparator Lorem ipsum dolor sit amet, consectetur adipiscing elit",
  isCollapsed: false
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

const generateRandomDate = (): string => {
  const start = cdate();
  const end = start.add(24, "months");
  const startTime = start.toDate().getTime();
  const endTime = end.toDate().getTime();
  const randomTimeDiff = Math.random() * (endTime - startTime);
  const randomDate = cdate(new Date(startTime + randomTimeDiff));
  return randomDate.format("YYYY/MM/DD");
};

const createDummyChartRow = (): ChartRow => {
  const plannedStartDate = generateRandomDate();
  const holidays: string[] = updateHolidays(initialHolidayInput);
  const isIncludeHolidays = false;
  const regularDaysOff: number[] = [0, 6];
  const plannedEndDate = addPlannedDays(plannedStartDate, 5, holidays, isIncludeHolidays, true, regularDaysOff);
  const plannedDays = calculatePlannedDays(plannedStartDate, plannedEndDate, holidays, false, regularDaysOff);

  return {
    rowType: "Chart",
    no: 0,
    id: "",
    displayName: "test",
    textColumn1: "test",
    textColumn2: "",
    textColumn3: "",
    textColumn4: "",
    color: "test",
    plannedStartDate: cdate(plannedStartDate).format('YYYY/MM/DD'),
    plannedEndDate: cdate(plannedEndDate).format('YYYY/MM/DD'),
    plannedDays: plannedDays,
    actualStartDate: "",
    actualEndDate: "",
    dependentId: "",
    dependency: "",
    isIncludeHolidays: false
  };
};

const createStructuredDummyDataArray = (): WBSData[] => {
  const data: WBSData[] = [];
  data.push(createEmptySeparatorRow());
  data.push(createEmptyEventRow());

  let rowCount = 0;

  for (let i = 0; i < 500; i++) {
    data.push(createDummyChartRow());
    rowCount++;

    if (rowCount % 10 === 0) {
      data.push(createEmptySeparatorRow());
    }
  }

  return data;
};

const structuredDummyData: WBSData[] = createStructuredDummyDataArray();

export const initializedDummyData: { [id: string]: WBSData } = assignIds(structuredDummyData);


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

const createStructuredEmptyDataArray = (): WBSData[] => {
  const data: WBSData[] = [];
  data.push(createEmptySeparatorRow());
  data.push(createEmptyEventRow());
  for (let i = 0; i < 50; i++) {
    data.push(createEmptyChartRow());
  }
  return data;
};

const structuredEmptyData: WBSData[] = createStructuredEmptyDataArray();

export const initializedEmptyData: { [id: string]: WBSData } = assignIds(structuredEmptyData);