// chartHelpers.ts

/**
 * 日付を YYYY/MM/DD 形式にフォーマットする関数。
 * @param {Date} date フォーマットする日付
 * @returns {string} フォーマットされた日付文字列
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;
  return `${year}/${formattedMonth}/${formattedDay}`;
};

/**
 * 与えられた日付をローカルの真夜中（0時0分0秒）に調整する関数。
 * @param {Date} date 調整する日付
 * @returns {Date} 調整された日付
 */
export const adjustToLocalMidnight = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};
