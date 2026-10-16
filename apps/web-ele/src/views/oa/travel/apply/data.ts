import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { getRangePickerDefaultProps } from '#/utils';

/** 单据状态搜索项：补充未提交 */
export function getStatusOptions() {
  return [
    { label: '未提交', value: -1 },
    ...getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number').filter(
      (item) => item.value !== -1,
    ),
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
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
      label: '单据状态',
      component: 'Select',
      componentProps: {
        options: getStatusOptions(),
        clearable: true,
        placeholder: '请选择单据状态',
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
        placeholder: '请选择申请部门',
        clearable: true,
        defaultExpandAll: true,
        checkStrictly: true,
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
    {
      fieldName: 'reimburseStatus',
      label: '报销状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_REIMBURSE_STATUS, 'boolean'),
        clearable: true,
        placeholder: '请选择报销状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '单据编号',
      minWidth: 200,
      slots: { default: 'no' },
    },
    {
      field: 'status',
      title: '单据状态',
      width: 110,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'reason',
      title: '出差事由',
      minWidth: 220,
      showOverflow: 'tooltip',
    },
    {
      field: 'startTime',
      title: '开始日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'days',
      title: '天数',
      width: 80,
      align: 'center',
    },
    {
      field: 'estimatedPrice',
      title: '预计费用',
      width: 130,
      align: 'right',
    },
    {
      field: 'reimburseStatus',
      title: '报销状态',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_REIMBURSE_STATUS },
      },
    },
    {
      field: 'creatorName',
      title: '申请人',
      width: 120,
    },
    {
      field: 'deptName',
      title: '申请部门',
      minWidth: 140,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 表单行程明细的列配置 */
export function useItemGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      title: '序号',
      width: 60,
      align: 'center',
    },
    {
      field: 'departureAreaId',
      title: '出发城市',
      minWidth: 180,
      slots: { default: 'departureAreaId' },
    },
    {
      field: 'arrivalAreaId',
      title: '到达城市',
      minWidth: 180,
      slots: { default: 'arrivalAreaId' },
    },
    {
      field: 'startTime',
      title: '开始日期',
      minWidth: 170,
      slots: { default: 'startTime' },
    },
    {
      field: 'endTime',
      title: '结束日期',
      minWidth: 170,
      slots: { default: 'endTime' },
    },
    {
      field: 'transportType',
      title: '交通方式',
      minWidth: 140,
      slots: { default: 'transportType' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
      slots: { default: 'remark' },
    },
    {
      title: '操作',
      width: 75,
      fixed: 'right',
      slots: { default: 'itemActions' },
    },
  ];
}

/** 详情行程明细的列配置 */
export function useItemDetailGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      title: '序号',
      width: 60,
      align: 'center',
    },
    {
      field: 'departureAreaId',
      title: '出发城市',
      minWidth: 180,
      slots: { default: 'departureAreaId' },
    },
    {
      field: 'arrivalAreaId',
      title: '到达城市',
      minWidth: 180,
      slots: { default: 'arrivalAreaId' },
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
      field: 'transportType',
      title: '交通方式',
      width: 140,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TRANSPORT_TYPE },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
  ];
}

/** 出差申请选择弹窗的搜索表单 */
export function useApplySelectGridFormSchema(): VbenFormSchema[] {
  return [
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
      fieldName: 'reason',
      label: '出差事由',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入出差事由',
      },
    },
    {
      fieldName: 'reimburseStatus',
      label: '报销状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_REIMBURSE_STATUS, 'boolean'),
        clearable: true,
        placeholder: '请选择报销状态',
      },
    },
  ];
}

/** 出差申请选择弹窗的列配置 */
export function useApplySelectGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '',
      width: 55,
      align: 'center',
      slots: { default: 'radioSelect' },
    },
    {
      field: 'no',
      title: '单据编号',
      width: 180,
    },
    {
      field: 'reason',
      title: '出差事由',
      minWidth: 220,
      showOverflow: 'tooltip',
    },
    {
      field: 'startTime',
      title: '开始日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'days',
      title: '天数',
      width: 80,
      align: 'center',
    },
    {
      field: 'reimburseStatus',
      title: '报销状态',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_REIMBURSE_STATUS },
      },
    },
  ];
}
