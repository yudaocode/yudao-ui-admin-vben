import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { getRangePickerDefaultProps } from '#/utils';
import { OA_WORK_REPORT_TYPE } from '#/views/oa/utils/constants';

/** 汇报类型页签 */
export const workReportTypeTabs = [
  { key: OA_WORK_REPORT_TYPE.DAILY, label: '工作日报' },
  { key: OA_WORK_REPORT_TYPE.WEEKLY, label: '工作周报' },
  { key: OA_WORK_REPORT_TYPE.MONTHLY, label: '工作月报' },
];

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'type',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'startTime',
      label: '开始日期',
      component: 'DatePicker',
      componentProps: {
        clearable: false,
        type: 'date',
        valueFormat: 'x',
        placeholder: '请选择开始日期',
        class: '!w-full',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束日期',
      component: 'DatePicker',
      componentProps: {
        clearable: false,
        type: 'date',
        valueFormat: 'x',
        placeholder: '请选择结束日期',
        class: '!w-full',
      },
      rules: 'required',
    },
    {
      fieldName: 'title',
      label: '汇报标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showWordLimit: true,
        placeholder: '留空时将根据汇报周期自动生成',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'summary',
      label: '工作总结',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 5000,
        showWordLimit: true,
        placeholder: '请输入工作总结补充说明',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'plan',
      label: '工作计划',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 5000,
        showWordLimit: true,
        placeholder: '请输入工作计划补充说明',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'problem',
      label: '问题与协调',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 5000,
        showWordLimit: true,
        placeholder: '请输入存在的问题或需要协调的事项',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        maxlength: 1000,
        showWordLimit: true,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 10,
        maxSize: 20,
        multiple: true,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      component: 'Input',
      defaultValue: OA_WORK_REPORT_TYPE.DAILY,
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'no',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'status',
      label: '汇报状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_WORK_REPORT_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择汇报状态',
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        clearable: true,
        placeholder: '请选择申请部门',
        defaultExpandAll: true,
      },
    },
    {
      fieldName: 'reportWeek',
      label: '汇报周次',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入周次，如 2026-12',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => Number(values.type) === OA_WORK_REPORT_TYPE.WEEKLY,
      },
    },
    {
      fieldName: 'reportMonth',
      label: '汇报月份',
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        type: 'month',
        valueFormat: 'YYYY-MM',
        placeholder: '请选择汇报月份',
        class: 'w-full',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => Number(values.type) === OA_WORK_REPORT_TYPE.MONTHLY,
      },
    },
    {
      fieldName: 'startTime',
      label: '开始日期',
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        type: 'date',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择开始日期',
        class: 'w-full',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束日期',
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        type: 'date',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择结束日期',
        class: 'w-full',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(
  type: number = OA_WORK_REPORT_TYPE.DAILY,
): VxeTableGridOptions['columns'] {
  const columns: VxeTableGridOptions['columns'] = [
    {
      field: 'no',
      title: '单据编号',
      width: 185,
      slots: { default: 'no' },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_WORK_REPORT_STATUS },
      },
    },
    {
      field: 'type',
      title: '汇报类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_WORK_REPORT_TYPE },
      },
    },
  ];
  // 周报展示汇报周次，月报展示汇报月份
  if (type !== OA_WORK_REPORT_TYPE.DAILY) {
    columns.push({
      field: 'periodKey',
      title: type === OA_WORK_REPORT_TYPE.WEEKLY ? '汇报周次' : '汇报月份',
      width: 120,
    });
  }
  columns.push(
    {
      field: 'title',
      title: '汇报标题',
      minWidth: 220,
      slots: { default: 'title' },
    },
    {
      field: 'startTime',
      title: '开始日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'userName',
      title: '申请人',
      width: 120,
    },
    {
      field: 'deptName',
      title: '申请部门',
      width: 130,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 210,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  );
  return columns;
}
