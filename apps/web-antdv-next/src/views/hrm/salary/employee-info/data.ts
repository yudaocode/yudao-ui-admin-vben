import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import {
  HrmEmployeeStatus,
  HrmEmployeeStatusTab,
} from '#/views/hrm/utils/constants';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';

/** 薪资档案状态页签 */
export function getSalaryEmployeeStatusTabItems() {
  return [
    { status: HrmEmployeeStatusTab.ACTIVE, label: '在职' },
    { status: HrmEmployeeStatusTab.FULL_TIME, label: '全职' },
    {
      status: HrmEmployeeStatus.INTERN,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.INTERN,
      ),
    },
    {
      status: HrmEmployeeStatus.LABOR,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.LABOR,
      ),
    },
    {
      status: HrmEmployeeStatus.CONSULTANT,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.CONSULTANT,
      ),
    },
    {
      status: HrmEmployeeStatus.REHIRE,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.REHIRE,
      ),
    },
    {
      status: HrmEmployeeStatus.OUTSOURCE,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.OUTSOURCE,
      ),
    },
    {
      status: HrmEmployeeStatus.PART_TIME,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.PART_TIME,
      ),
    },
    {
      status: HrmEmployeeStatus.PROBATION,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.PROBATION,
      ),
    },
    {
      status: HrmEmployeeStatus.REGULAR,
      label: getDictLabel(
        DICT_TYPE.HRM_EMPLOYEE_STATUS,
        HrmEmployeeStatus.REGULAR,
      ),
    },
  ];
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'search',
      label: '员工',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入姓名或工号',
      },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择部门',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'postName',
      label: '岗位',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入岗位名称',
      },
    },
    {
      fieldName: 'changeType',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.HRM_SALARY_CHANGE_TYPE, 'number'),
        placeholder: '请选择档案状态',
      },
    },
  ];
}

/** 获得员工当前工资合计 */
export function getSalaryEmployeeTotal(
  row: HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo,
) {
  return row.status === HrmEmployeeStatus.PROBATION
    ? row.probationSalary
    : row.regularSalary;
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>['columns'] {
  return [
    { type: 'checkbox' as const, width: 50, fixed: 'left' },
    {
      field: 'employeeName',
      title: '员工姓名',
      minWidth: 140,
      fixed: 'left',
      showOverflow: true,
      slots: { default: 'employeeName' },
    },
    {
      field: 'jobNumber',
      title: '工号',
      width: 120,
      showOverflow: true,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 140,
      showOverflow: true,
    },
    {
      field: 'postName',
      title: '岗位',
      minWidth: 140,
      showOverflow: true,
    },
    {
      field: 'status',
      title: '员工状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_EMPLOYEE_STATUS },
      },
    },
    {
      field: 'entryTime',
      title: '入职日期',
      width: 120,
      align: 'center',
      formatter: ({ cellValue }) => formatHrmDate(cellValue),
    },
    {
      field: 'regularTime',
      title: '转正日期',
      width: 120,
      align: 'center',
      formatter: ({ cellValue }) => formatHrmDate(cellValue),
    },
    {
      field: 'effectTime',
      title: '最近调整日期',
      width: 120,
      align: 'center',
      formatter: ({ cellValue }) => formatHrmDate(cellValue),
    },
    {
      field: 'changeReason',
      title: '调薪原因',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_SALARY_CHANGE_REASON },
      },
    },
    {
      field: 'salaryTotal',
      title: '工资合计',
      width: 130,
      align: 'right',
      formatter: ({ row }) => formatHrmMoney(getSalaryEmployeeTotal(row)),
    },
    {
      field: 'actions',
      title: '操作',
      width: 90,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
