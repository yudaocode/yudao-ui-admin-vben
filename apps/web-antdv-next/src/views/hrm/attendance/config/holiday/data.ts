import type { VxeGridProps } from '#/adapter/vxe-table';

export function useGridFormSchema() {
  return [
    {
      fieldName: 'date',
      label: '日期',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'type',
      label: '日期类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择日期类型',
      },
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'id', title: '编号', width: 100, align: 'center' },
    {
      field: 'date',
      title: '日期',
      minWidth: 180,
      formatter: 'formatDate',
    },
    {
      field: 'type',
      title: '日期类型',
      width: 140,
      slots: { default: 'type' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
