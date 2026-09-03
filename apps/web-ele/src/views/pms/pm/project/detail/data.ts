import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemWorkLogApi } from '#/api/pms/pm/workitem/worklog';

import dayjs from 'dayjs';

import { getRangePickerDefaultProps } from '#/utils';
import { formatDateWithWeekday } from '#/views/pms/pm/utils/format';

/** 工时报表行：迭代分组行包含工作项子行 */
export type ReportRow = PmsWorkItemWorkLogApi.ProjectWorkLogReportItem & {
  children?: ReportRow[];
  group?: boolean;
  rowKey: string;
};

/** 汇总分组内工作项的每日工时 */
function getGroupDailyHours(items: ReportRow[] | undefined, date: string) {
  return (items || []).reduce(
    (sum, item) => sum + (item.dailyHours[date] || 0),
    0,
  );
}

/** 列表的搜索表单 */
export function useSearchFormSchema(
  onCreateTimeChange: () => void,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'iterationName',
      label: '迭代名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '搜索迭代名称',
      },
    },
    {
      fieldName: 'createTime',
      label: '日期范围',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: false,
        onChange: onCreateTimeChange,
      },
      defaultValue: [
        dayjs().startOf('month').startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      ],
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  dates: string[],
): VxeTableGridOptions<ReportRow>['columns'] {
  return [
    {
      field: 'name',
      title: '迭代 / 工作项',
      minWidth: 260,
      align: 'left',
      fixed: 'left',
      treeNode: true,
      slots: { default: 'name' },
    },
    {
      field: 'totalHours',
      title: '总计',
      width: 90,
      align: 'center',
      fixed: 'left',
      formatter: ({ row }: { row: ReportRow }) => row.totalHours || '-',
    },
    ...dates.map((date) => ({
      field: `dailyHours.${date}`,
      title: formatDateWithWeekday(date),
      width: 110,
      align: 'center' as const,
      formatter: ({ row }: { row: ReportRow }) =>
        row.group
          ? getGroupDailyHours(row.children, date) || '-'
          : row.dailyHours[date] || '-',
    })),
  ];
}
