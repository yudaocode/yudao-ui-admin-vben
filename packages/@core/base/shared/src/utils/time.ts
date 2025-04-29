import dayjs from 'dayjs';

/** 时间段选择器拓展  */
export function rangePickerExtend() {
  return {
    // 显示格式
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['开始时间', '结束时间'],
    ranges: {
      今天: [dayjs().startOf('day'), dayjs().endOf('day')],
      最近7天: [
        dayjs().subtract(7, 'day').startOf('day'),
        dayjs().endOf('day'),
      ],
      最近30天: [
        dayjs().subtract(30, 'day').startOf('day'),
        dayjs().endOf('day'),
      ],
      昨天: [
        dayjs().subtract(1, 'day').startOf('day'),
        dayjs().subtract(1, 'day').endOf('day'),
      ],
      本周: [dayjs().startOf('week'), dayjs().endOf('day')],
      本月: [dayjs().startOf('month'), dayjs().endOf('day')],
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
        // 格式化为后台支持的时间格式
        return [dates.createTime[0], dates.createTime[1]].join(',');
      }
      return {};
    },
    // 如果需要10位时间戳（秒级）可以使用 valueFormat: 'X'
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };
}
