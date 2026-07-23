export type Periodicity = 'daily' | 'weekly' | 'monthly';

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = (): string => {
  return formatDateToString(new Date());
};

export const getCurrentPeriodRange = (periodicity: Periodicity) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (periodicity) {
    case 'daily': {
      const currentDate = formatDateToString(today);
      return { startDate: currentDate, endDate: currentDate };
    }

    case 'weekly': {
      const day = today.getDay();
      const mondayOffset = (day + 6) % 7;
      const start = new Date(today);
      start.setDate(today.getDate() - mondayOffset);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        startDate: formatDateToString(start),
        endDate: formatDateToString(end),
      };
    }

    case 'monthly': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        startDate: formatDateToString(start),
        endDate: formatDateToString(end),
      };
    }
  }
};

export const isDateInPeriod = (
  dateString: string,
  range: { startDate: string; endDate: string }
): boolean => {
  return dateString >= range.startDate && dateString <= range.endDate;
};