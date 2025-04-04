import dayjs from 'dayjs';

/** 时间段选择器拓展  */
export const rangePickerExtend = () => {
  return {
    showTime: {
      format: 'HH:mm:ss',
      defaultValue: [
        dayjs('00:00:00', 'HH:mm:ss'),
        dayjs('23:59:59', 'HH:mm:ss'),
      ],
    },
    // 如果需要10位时间戳（秒级）可以使用 valueFormat: 'X'
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
    format: 'YYYY-MM-DD HH:mm:ss', // 显示格式
    placeholder: ['开始时间', '结束时间'],
    ranges: {
      今天: [dayjs().startOf('day'), dayjs().endOf('day')],

      昨天: [
        dayjs().subtract(1, 'day').startOf('day'),
        dayjs().subtract(1, 'day').endOf('day'),
      ],

      本周: [dayjs().startOf('week'), dayjs().endOf('day')],

      本月: [dayjs().startOf('month'), dayjs().endOf('day')],

      最近7天: [
        dayjs().subtract(7, 'day').startOf('day'),
        dayjs().endOf('day'),
      ],

      最近30天: [
        dayjs().subtract(30, 'day').startOf('day'),
        dayjs().endOf('day'),
      ],
    },
    transformDateFunc: (dates: any) => {
      if (dates && dates.length === 2) {
        return [dates.createTime[0], dates.createTime[1]].join(','); // 格式化为后台支持的时间格式
      }
      return {};
    },
  };
};
