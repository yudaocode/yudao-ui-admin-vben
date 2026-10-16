import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { formatDateTime } from '@vben/utils';

/** 搜索表单配置 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'accountId',
      label: '公众号',
      component: 'Select',
      componentProps: {
        placeholder: '请选择公众号',
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeGridPropTypes.Columns {
  return [
    {
      field: 'cover',
      title: '图片',
      width: 360,
      slots: { default: 'cover' },
    },
    {
      field: 'title',
      title: '标题',
      slots: { default: 'title' },
    },
    {
      field: 'updateTime',
      title: '修改时间',
      formatter: ({ row }) => {
        return formatDateTime(row.updateTime * 1000);
      },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
