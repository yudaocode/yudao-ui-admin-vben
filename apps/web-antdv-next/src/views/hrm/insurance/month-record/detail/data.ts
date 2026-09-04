import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';

import { markRaw } from 'vue';

import { AreaCascader } from '#/components/area';
import InsuranceSchemeSelect from '#/views/hrm/insurance/scheme/components/insurance-scheme-select.vue';
import {
  formatHrmDate,
  formatHrmInsuranceProjectName,
  formatHrmMoney,
  formatHrmRate,
} from '#/views/hrm/utils/format';

type InsuranceSchemeChange = (
  scheme?: import('#/api/hrm/insurance/scheme').HrmInsuranceSchemeApi.InsuranceScheme,
) => Promise<void> | void;

type ProjectRow = HrmInsuranceMonthEmployeeRecordApi.Project & {
  totalAmount?: number;
};

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

/** 单个员工参保方案表单 */
export function useEmployeeRecordFormSchema(
  onSchemeChange: InsuranceSchemeChange,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeDisplay',
      label: '员工',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'schemeId',
      label: '社保方案',
      component: markRaw(InsuranceSchemeSelect),
      componentProps: { onChange: onSchemeChange },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'DictSelect',
      componentProps: { dictType: 'hrm_insurance_emp_status', disabled: true },
    },
  ];
}

/** 批量调整参保方案表单 */
export function useBatchEmployeeRecordFormSchema(
  onSchemeChange: InsuranceSchemeChange,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeCount',
      label: '已选员工',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'schemeId',
      label: '社保方案',
      component: markRaw(InsuranceSchemeSelect),
      componentProps: { onChange: onSchemeChange },
      rules: 'required',
    },
  ];
}

/** 可编辑缴费项目字段 */
export function useEditableProjectGridColumns(
  showProportion: boolean,
): VxeTableGridOptions<ProjectRow>['columns'] {
  return [
    { field: 'type', title: '类型', width: 130, slots: { default: 'type' } },
    { field: 'name', title: '项目名称', minWidth: 180 },
    ...(showProportion
      ? [
          {
            field: 'baseAmount',
            title: '缴纳基数',
            width: 150,
            slots: { default: 'baseAmount' },
          },
          {
            field: 'corporateRate',
            title: '公司比例',
            width: 120,
            align: 'right' as const,
            formatter: ({ cellValue }: { cellValue: unknown }) =>
              formatHrmRate(Number(cellValue || 0)),
          },
          {
            field: 'personalRate',
            title: '个人比例',
            width: 120,
            align: 'right' as const,
            formatter: ({ cellValue }: { cellValue: unknown }) =>
              formatHrmRate(Number(cellValue || 0)),
          },
        ]
      : [
          {
            field: 'corporateAmount',
            title: '公司金额',
            width: 150,
            slots: { default: 'corporateAmount' },
          },
          {
            field: 'personalAmount',
            title: '个人金额',
            width: 150,
            slots: { default: 'personalAmount' },
          },
        ]),
  ];
}

/** 缴费项目详情字段 */
export function useProjectDetailGridColumns(
  showProportion: boolean,
): VxeTableGridOptions<ProjectRow>['columns'] {
  return [
    {
      field: 'name',
      title: '缴纳项目',
      minWidth: 180,
      formatter: ({ row }) => formatHrmInsuranceProjectName(row),
    },
    {
      field: 'baseAmount',
      title: '缴纳基数',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    ...(showProportion
      ? [
          {
            field: 'corporateRate',
            title: '企业比例',
            width: 110,
            align: 'right' as const,
            formatter: ({ cellValue }: { cellValue: unknown }) =>
              formatHrmRate(Number(cellValue || 0)),
          },
          {
            field: 'personalRate',
            title: '个人比例',
            width: 110,
            align: 'right' as const,
            formatter: ({ cellValue }: { cellValue: unknown }) =>
              formatHrmRate(Number(cellValue || 0)),
          },
        ]
      : []),
    ...[
      ['personalAmount', '个人缴纳'],
      ['corporateAmount', '企业缴纳'],
    ].map(([field, title]) => ({
      field,
      title,
      width: 130,
      align: 'right' as const,
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        formatHrmMoney(Number(cellValue || 0)),
    })),
    {
      field: 'totalAmount',
      title: '合计缴费',
      width: 130,
      align: 'right',
      formatter: ({ row }) =>
        formatHrmMoney(
          Number(row.personalAmount || 0) + Number(row.corporateAmount || 0),
        ),
    },
  ];
}

/** 缴费项目合计行 */
export function buildProjectFooterMethod() {
  return ({
    columns,
    data,
  }: {
    columns: Array<{ field?: string }>;
    data: ProjectRow[];
  }) => [
    columns.map((column, index) => {
      if (index === 0) return '缴费总价';
      if (
        column.field !== 'personalAmount' &&
        column.field !== 'corporateAmount' &&
        column.field !== 'totalAmount'
      )
        return '';
      let total = 0;
      for (const project of data) {
        total +=
          column.field === 'totalAmount'
            ? Number(project.personalAmount || 0) +
              Number(project.corporateAmount || 0)
            : Number(
                project[column.field as 'corporateAmount' | 'personalAmount'] ||
                  0,
              );
      }
      return formatHrmMoney(total);
    }),
  ];
}
