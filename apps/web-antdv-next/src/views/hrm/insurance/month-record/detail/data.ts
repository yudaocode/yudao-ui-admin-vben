import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';

import { markRaw } from 'vue';

import { AreaCascader } from '#/components/area';
import InsuranceSchemeSelect from '#/views/hrm/insurance/scheme/components/insurance-scheme-select.vue';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeName',
      label: '员工姓名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入员工姓名',
      },
    },
    {
      fieldName: 'schemeId',
      label: '参保方案',
      component: markRaw(InsuranceSchemeSelect),
    },
    {
      fieldName: 'areaId',
      label: '参保城市',
      component: markRaw(AreaCascader),
      componentProps: {
        allowClear: true,
        changeOnSelect: true,
        placeholder: '请选择参保城市',
        showSearch: true,
      },
    },
  ];
}

export function useGridColumns(
  editable: boolean,
): VxeTableGridOptions<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>['columns'] {
  return [
    { type: 'checkbox' as const, width: 45, visible: editable },
    {
      field: 'employeeName',
      title: '姓名',
      minWidth: 130,
      fixed: 'left',
      slots: { default: 'employeeName' },
    },
    { field: 'jobNumber', title: '工号', width: 110 },
    { field: 'deptName', title: '部门', minWidth: 120 },
    {
      field: 'entryTime',
      title: '入职日期',
      width: 110,
      formatter: ({ cellValue }) => formatHrmDate(cellValue),
    },
    { field: 'mobile', title: '手机号码', width: 130 },
    { field: 'areaName', title: '参保城市', minWidth: 160 },
    { field: 'schemeName', title: '参保方案', minWidth: 160 },
    {
      field: 'personalInsuranceAmount',
      title: '个人社保费',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateInsuranceAmount',
      title: '公司社保费',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'personalProvidentFundAmount',
      title: '个人公积金费',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateProvidentFundAmount',
      title: '公司公积金费',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
  ];
}
