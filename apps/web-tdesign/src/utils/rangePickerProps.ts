import type { DateRangePickerProps } from 'tdesign-vue-next';

import dayjs from 'dayjs';

import { $t } from '#/locales';

/** 时间段选择器拓展 */
export function getRangePickerDefaultProps(): DateRangePickerProps {
  return {
    // 设置日期格式，配置参考 dayjs，支持自定义格式
    format: 'YYYY-MM-DD HH:mm:ss',
    // 绑定值的格式，对 value、defaultValue 起作用
    valueType: 'YYYY-MM-DD HH:mm:ss',
    // 输入框提示文字
    placeholder: [
      $t('utils.rangePicker.beginTime'),
      $t('utils.rangePicker.endTime'),
    ],
    // 快捷时间范围
    presets: {
      [$t('utils.rangePicker.today')]: [
        dayjs().startOf('day').toDate(),
        dayjs().endOf('day').toDate(),
      ],
      [$t('utils.rangePicker.last7Days')]: [
        dayjs().subtract(7, 'day').startOf('day').toDate(),
        dayjs().endOf('day').toDate(),
      ],
      [$t('utils.rangePicker.last30Days')]: [
        dayjs().subtract(30, 'day').startOf('day').toDate(),
        dayjs().endOf('day').toDate(),
      ],
      [$t('utils.rangePicker.yesterday')]: [
        dayjs().subtract(1, 'day').startOf('day').toDate(),
        dayjs().subtract(1, 'day').endOf('day').toDate(),
      ],
      [$t('utils.rangePicker.thisWeek')]: [
        dayjs().startOf('week').toDate(),
        dayjs().endOf('day').toDate(),
      ],
      [$t('utils.rangePicker.thisMonth')]: [
        dayjs().startOf('month').toDate(),
        dayjs().endOf('day').toDate(),
      ],
      [$t('utils.rangePicker.lastWeek')]: [
        dayjs().subtract(1, 'week').startOf('day').toDate(),
        dayjs().endOf('day').toDate(),
      ],
    },
    // 开启时间选择，开始、结束时间默认 00:00:00、23:59:59
    enableTimePicker: true,
    defaultTime: ['00:00:00', '23:59:59'],
  };
}
