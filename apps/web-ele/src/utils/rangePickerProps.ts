import dayjs from 'dayjs';

import { $t } from '#/locales';

/** 时间段选择器拓展 */
export function getRangePickerDefaultProps() {
  return {
    startPlaceholder: $t('utils.rangePicker.beginTime'),
    endPlaceholder: $t('utils.rangePicker.endTime'),
    shortcuts: [
      {
        text: $t('utils.rangePicker.today'),
        value: () => {
          return [dayjs().startOf('day'), dayjs().endOf('day')];
        },
      },
      {
        text: $t('utils.rangePicker.yesterday'),
        value: () => {
          return [
            dayjs().subtract(1, 'day').startOf('day'),
            dayjs().subtract(1, 'day').endOf('day'),
          ];
        },
      },
      {
        text: $t('utils.rangePicker.last7Days'),
        value: () => {
          return [
            dayjs().subtract(7, 'day').startOf('day'),
            dayjs().endOf('day'),
          ];
        },
      },
      {
        text: $t('utils.rangePicker.last30Days'),
        value: () => {
          return [
            dayjs().subtract(30, 'day').startOf('day'),
            dayjs().endOf('day'),
          ];
        },
      },
      {
        text: $t('utils.rangePicker.thisWeek'),
        value: () => {
          return [dayjs().startOf('week'), dayjs().endOf('day')];
        },
      },
      {
        text: $t('utils.rangePicker.lastWeek'),
        value: () => {
          return [
            dayjs().subtract(1, 'week').startOf('day'),
            dayjs().endOf('day'),
          ];
        },
      },
      {
        text: $t('utils.rangePicker.thisMonth'),
        value: () => {
          return [dayjs().startOf('month'), dayjs().endOf('day')];
        },
      },
    ],
    transformDateFunc: (dates: any) => {
      // TODO puhui999: 没起作用后面调试再看看
      if (dates && dates.length === 2) {
        // 格式化为后台支持的时间格式
        return [dates.createTime[0], dates.createTime[1]].join(',');
      }
      return {};
    },
    format: 'YYYY-MM-DD HH:mm:ss',
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };
}
