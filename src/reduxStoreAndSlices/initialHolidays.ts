import { updateHolidays } from "../components/Setting/utils/settingHelpers";
import { RegularDaysOffSettingsType } from "../types/DataTypes";
import { adjustColorOpacity } from "../utils/CommonUtils";

export const initialHolidayInput = '2023/1/1 日 元日\n2023/1/2 月 振替休日 祝日法第3条第2項による休日\n2023/1/9 月 成人の日\n2023/2/11 土 建国記念の日\n2023/2/23 木 天皇誕生日\n2023/3/21 火 春分の日\n2023/4/29 土 昭和の日\n2023/5/3 水 憲法記念日\n2023/5/4 木 みどりの日\n2023/5/5 金 こどもの日\n2023/7/17 月 海の日\n2023/8/11 金 山の日\n2023/9/18 月 敬老の日\n2023/9/23 土 秋分の日\n2023/10/9 月 スポーツの日\n2023/11/3 金 文化の日\n2023/11/23 木 勤労感謝の日\n2024/1/1 月 元日\n2024/1/8 月 成人の日\n2024/2/11 日 建国記念の日\n2024/2/12 月 振替休日 祝日法第3条第2項による休日\n2024/2/23 金 天皇誕生日\n2024/3/20 水 春分の日\n2024/4/29 月 昭和の日\n2024/5/3 金 憲法記念日\n2024/5/4 土 みどりの日\n2024/5/5 日 こどもの日\n2024/5/6 月 振替休日 祝日法第3条第2項による休日\n2024/7/15 月 海の日\n2024/8/11 日 山の日\n2024/8/12 月 振替休日 祝日法第3条第2項による休日\n2024/9/16 月 敬老の日\n2024/9/22 日 秋分の日\n2024/9/23 月 振替休日 祝日法第3条第2項による休日\n2024/10/14 月 スポーツの日\n2024/11/3 日 文化の日\n2024/11/4 月 振替休日 祝日法第3条第2項による休日\n2024/11/23 土 勤労感謝の日\n2025/1/1 水 元日\n2025/1/13 月 成人の日\n2025/2/11 火 建国記念の日\n2025/2/23 日 天皇誕生日\n2025/2/24 月 振替休日 祝日法第3条第2項による休日\n2025/3/20 木 春分の日\n2025/4/29 火 昭和の日\n2025/5/3 土 憲法記念日\n2025/5/4 日 みどりの日\n2025/5/5 月 こどもの日\n2025/5/6 火 振替休日 祝日法第3条第2項による休日\n2025/7/21 月 海の日\n2025/8/11 月 山の日\n2025/9/15 月 敬老の日\n2025/9/23 火 秋分の日\n2025/10/13 月 スポーツの日\n2025/11/3 月 文化の日\n2025/11/23 日 勤労感謝の日\n2025/11/24 月 振替休日 祝日法第3条第2項による休日';

export const initialHolidays = updateHolidays(initialHolidayInput, 'yyyy/MM/dd');

export const initialRegularDaysOffSetting: RegularDaysOffSettingsType = {
  1: { color: '#d9e6ff', subColor: adjustColorOpacity('#d9e6ff'), days: [6] },
  2: { color: '#ffdcdc', subColor: adjustColorOpacity('#ffdcdc'), days: [0] },
  3: { color: '#EFEFEF', subColor: adjustColorOpacity('#EFEFEF'), days: [] },
};