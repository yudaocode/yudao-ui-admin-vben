import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

/** 时间段选择器拓展  */
export function getRangePickerDefaultProps() {
  return {
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['开始时间', '结束时间'],
    ranges: {
      今天: () =>
        [dayjs().startOf('day'), dayjs().endOf('day')] as [Dayjs, Dayjs],
      '最近 7 天': () =>
        [dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')] as [
          Dayjs,
          Dayjs,
        ],
      '最近 30 天': () =>
        [dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')] as [
          Dayjs,
          Dayjs,
        ],
      昨天: () =>
        [
          dayjs().subtract(1, 'day').startOf('day'),
          dayjs().subtract(1, 'day').endOf('day'),
        ] as [Dayjs, Dayjs],
      本周: () =>
        [dayjs().startOf('week'), dayjs().endOf('day')] as [Dayjs, Dayjs],
      本月: () =>
        [dayjs().startOf('month'), dayjs().endOf('day')] as [Dayjs, Dayjs],
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
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };
}
