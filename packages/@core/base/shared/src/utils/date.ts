import dayjs from 'dayjs';

export function formatDate(
  time: Date | number | string | undefined,
  format = 'YYYY-MM-DD',
) {
  if (!time) {
    return time;
  }
  try {
    const date = dayjs(time);
    if (!date.isValid()) {
      throw new Error('Invalid date');
    }
    return date.format(format);
  } catch (error) {
    console.error(`Error formatting date: ${error}`);
    return time;
  }
}

export function formatDateTime(time: Date | number | string | undefined) {
  if (!time) {
    return time;
  }
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss');
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isDayjsObject(value: any): value is dayjs.Dayjs {
  return dayjs.isDayjs(value);
}
