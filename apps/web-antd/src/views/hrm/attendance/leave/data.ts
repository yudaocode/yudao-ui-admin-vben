import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { getHrmMonthRange } from '#/views/hrm/utils/format';

/** 部门多选 ApiTreeSelect 配置 */
export function useDeptTreeSelectProps() {
  return {
    api: async () => handleTree(await getSimpleDeptList()),
    fieldNames: { label: 'name', value: 'id', children: 'children' },
    multiple: true,
    placeholder: '请选择部门',
    treeDefaultExpandAll: true,
  };
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'month',
      label: '月份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY-MM'),
      componentProps: {
        allowClear: false,
        class: 'w-full',
        picker: 'month',
        valueFormat: 'YYYY-MM',
      },
    },
    {
      fieldName: 'employeeKeyword',
      label: '员工',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入员工姓名或工号',
      },
    },
    {
      fieldName: 'deptIds',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(),
    },
    {
      fieldName: 'types',
      label: '请假类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        options: getDictOptions(DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE, 'string'),
        placeholder: '请选择请假类型',
      },
    },
    {
      fieldName: 'approvalStatus',
      label: '审批状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        placeholder: '请选择审批状态',
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmAttendanceLeaveApi.AttendanceLeave>['columns'] {
  return [
    { field: 'employeeName', title: '姓名', minWidth: 110, showOverflow: true },
    { field: 'jobNumber', title: '工号', minWidth: 110, showOverflow: true },
    { field: 'deptName', title: '部门', minWidth: 120, showOverflow: true },
    { field: 'postName', title: '岗位', minWidth: 120, showOverflow: true },
    {
      field: 'type',
      title: '请假类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE },
      },
    },
    {
      field: 'startTime',
      title: '请假开始时间',
      width: 170,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'endTime',
      title: '请假结束时间',
      width: 170,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'day',
      title: '请假天数',
      width: 100,
      sortable: true,
      formatter: ({ cellValue }) => `${cellValue || 0} 天`,
    },
    { field: 'reason', title: '请假事由', minWidth: 160, showOverflow: true },
    { field: 'remark', title: '备注', minWidth: 140, showOverflow: true },
    {
      field: 'approvalStatus',
      title: '审批状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 构建列表查询参数 */
export function buildLeaveQueryParams(formValues: Record<string, unknown>) {
  const month = String(formValues.month || formatDate(new Date(), 'YYYY-MM'));
  const { employeeKeyword, deptIds, types, approvalStatus } = formValues;
  return {
    employeeKeyword,
    deptIds,
    types,
    approvalStatus,
    startTime: getHrmMonthRange(month),
  };
}
