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

/** 时间段选择器拓展  */
export function getRangePickerDefaultProps() {
  return {
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['开始时间', '结束时间'],
    // prettier-ignore
    ranges: {
      '今天': [dayjs().startOf('day'), dayjs().endOf('day')],
      '最近 7 天': [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')],
      '最近 30 天': [dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')],
      '昨天': [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')],
      '本周': [dayjs().startOf('week'), dayjs().endOf('day')],
      '本月': [dayjs().startOf('month'), dayjs().endOf('day')],
    },
    showTime: {
      defaultValue: [
        dayjs('00:00:00', 'HH:mm:ss'),
        dayjs('23:59:59', 'HH:mm:ss'),
      ],
      format: 'HH:mm:ss',
    },
    transformDateFunc: (dates: any) => {
      if (dates && dates.length === 2) {
        return [dates.createTime[0], dates.createTime[1]].join(','); // 格式化为后台支持的时间格式
      }
      return {};
    },
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };
}
