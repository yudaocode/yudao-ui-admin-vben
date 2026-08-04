import type { VxeGridProps } from '#/adapter/vxe-table';

export { formatHrmAttendanceWeeks } from '#/views/hrm/utils/format';
export function useGridFormSchema() {
  return [
    {
      fieldName: 'name',
      label: '考勤组',
      component: 'Input',
      componentProps: { allowClear: true, placeholder: '请输入考勤组名称' },
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '考勤组', minWidth: 160, fixed: 'left' },
    {
      field: 'shifts',
      title: '考勤班次',
      minWidth: 420,
      slots: { default: 'shifts' },
    },
    {
      field: 'ruleType',
      title: '考勤规则',
      minWidth: 120,
      formatter: () => '早晚打卡',
    },
    {
      field: 'scope',
      title: '适用范围',
      minWidth: 220,
      slots: { default: 'scope' },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
