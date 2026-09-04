import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import {
  HrmEmployeeStatus,
  HrmEmployeeStatusTab,
  HrmSalaryRecordType,
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
        clearable: true,
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
        clearable: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'postName',
      label: '岗位',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入岗位名称',
      },
    },
    {
      fieldName: 'changeType',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
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
    { type: 'checkbox', width: 50, fixed: 'left' },
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

/** 员工调薪记录列表字段 */
export function useChangeRecordGridColumns(): VxeTableGridOptions<HrmSalaryChangeRecordApi.SalaryChangeRecord>['columns'] {
  return [
    {
      field: 'recordType',
      title: '类型',
      width: 90,
      formatter: ({ cellValue }) =>
        cellValue === HrmSalaryRecordType.FIXED ? '定薪' : '调薪',
    },
    {
      field: 'changeReason',
      title: '调整原因',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_SALARY_CHANGE_REASON },
      },
    },
    {
      field: 'effectTime',
      title: '生效日期',
      width: 120,
      formatter: ({ cellValue }) => formatHrmDate(cellValue),
    },
    {
      field: 'beforeTotal',
      title: '正式调整前',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'afterTotal',
      title: '正式调整后',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'probationBeforeTotal',
      title: '试用调整前',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'probationAfterTotal',
      title: '试用调整后',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'status',
      title: '状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
      showOverflow: true,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 薪资明细列表字段 */
export function useSalaryOptionGridColumns(): VxeTableGridOptions<any>['columns'] {
  return [
    { field: 'name', title: '薪资项', minWidth: 160, showOverflow: true },
    { field: 'code', title: '编码', width: 110 },
    {
      field: 'value',
      title: '金额',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
  ];
}

/** 单个员工定薪/调薪明细编辑列 */
export function useSalaryEditOptionGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', minWidth: 180, title: '薪资项' },
    { align: 'center', field: 'code', title: '编码', width: 100 },
    {
      align: 'center',
      field: 'probationOption',
      slots: { default: 'probation' },
      title: '试用期工资',
      width: 220,
    },
    {
      align: 'center',
      field: 'regularOption',
      slots: { default: 'regular' },
      title: '转正后工资',
      width: 220,
    },
  ];
}

/** 批量调薪明细编辑列 */
export function useBatchSalaryEditGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', minWidth: 180, title: '调薪项' },
    { align: 'center', field: 'code', title: '编码', width: 100 },
    {
      align: 'center',
      field: 'value',
      slots: { default: 'value', header: 'valueHeader' },
      width: 240,
    },
  ];
}
