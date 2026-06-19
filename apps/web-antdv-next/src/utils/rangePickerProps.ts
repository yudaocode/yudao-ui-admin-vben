import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

import { $t } from '#/locales';

type DateRangeTuple = [Dayjs, Dayjs];
type StringRangeTuple = [string, string];

function dateRange(start: Dayjs, end: Dayjs): DateRangeTuple {
  return [start, end];
}

/** 时间段选择器拓展 */
export function getRangePickerDefaultProps() {
  return {
    // 设置日期格式，为数组时支持多格式匹配，展示以第一个为准。配置参考 dayjs，支持自定义格式
    format: 'YYYY-MM-DD HH:mm:ss',
    // 绑定值的格式，对 value、defaultValue、defaultPickerValue 起作用。不指定则绑定值为 dayjs 对象
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
    // 输入框提示文字
    placeholder: [
      $t('utils.rangePicker.beginTime'),
      $t('utils.rangePicker.endTime'),
    ] as StringRangeTuple,
    // 快捷时间范围
    presets: [
      {
        label: $t('utils.rangePicker.today'),
        value: dateRange(dayjs().startOf('day'), dayjs().endOf('day')),
      },
      {
        label: $t('utils.rangePicker.last7Days'),
        value: dateRange(
          dayjs().subtract(7, 'day').startOf('day'),
          dayjs().endOf('day'),
        ),
      },
      {
        label: $t('utils.rangePicker.last30Days'),
        value: dateRange(
          dayjs().subtract(30, 'day').startOf('day'),
          dayjs().endOf('day'),
        ),
      },
      {
        label: $t('utils.rangePicker.yesterday'),
        value: dateRange(
          dayjs().subtract(1, 'day').startOf('day'),
          dayjs().subtract(1, 'day').endOf('day'),
        ),
      },
      {
        label: $t('utils.rangePicker.thisWeek'),
        value: dateRange(dayjs().startOf('week'), dayjs().endOf('day')),
      },
      {
        label: $t('utils.rangePicker.thisMonth'),
        value: dateRange(dayjs().startOf('month'), dayjs().endOf('day')),
      },
      {
        label: $t('utils.rangePicker.lastWeek'),
        value: dateRange(
          dayjs().subtract(1, 'week').startOf('day'),
          dayjs().endOf('day'),
        ),
      },
    ],
    showTime: {
      defaultValue: dateRange(
        dayjs('00:00:00', 'HH:mm:ss'),
        dayjs('23:59:59', 'HH:mm:ss'),
      ),
      format: 'HH:mm:ss',
    },
  };
}
