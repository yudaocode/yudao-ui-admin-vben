import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemWorkLogApi } from '#/api/pms/pm/workitem/worklog';

import { formatWorkHours } from '#/views/pms/pm/utils/format';

/** 登记/编辑工时的表单 */
export function useWorkLogFormSchema(
  onActualHoursChange: (actualHours?: number) => void,
): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '请输入投入工时',
        onChange: (value: number | string | undefined) =>
          onActualHoursChange(value === undefined ? undefined : Number(value)),
      },
      fieldName: 'actualHours',
      label: '投入工时',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入剩余工时',
      },
      fieldName: 'remainingHours',
      label: '剩余工时',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入本次工作内容',
        rows: 4,
        showCount: true,
      },
      fieldName: 'description',
      label: '工时说明',
    },
  ];
}

/** 工时记录列表的字段 */
export function useColumns(): VxeTableGridOptions<PmsWorkItemWorkLogApi.WorkItemWorkLog>['columns'] {
  return [
    {
      field: 'actualHours',
      title: '投入工时',
      width: 100,
      formatter: ({ cellValue }) => formatWorkHours(cellValue),
    },
    {
      field: 'remainingHours',
      title: '登记后剩余',
      width: 110,
      formatter: ({ cellValue }) => formatWorkHours(cellValue),
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 180,
    },
    {
      field: 'creatorUserName',
      title: '登记人',
      width: 110,
    },
    {
      field: 'createTime',
      title: '登记时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 70,
      slots: { default: 'action' },
    },
  ];
}
