import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProTaskApi } from '#/api/mes/pro/task';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProProcessSelect } from '#/views/mes/pro/process/components';
import { RouteColorPicker } from '#/views/mes/pro/route/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

/** 待排产工单列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '工单编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工单编码',
      },
    },
    {
      fieldName: 'name',
      label: '工单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入工单名称',
      },
    },
    {
      fieldName: 'orderSourceCode',
      label: '来源单据',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入来源单据编号',
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'requestDate',
      label: '需求日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 待排产工单列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProWorkOrderApi.WorkOrder>['columns'] {
  return [
    {
      field: 'code',
      title: '工单编码',
      fixed: 'left',
      width: 200,
      treeNode: true,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '工单名称',
      minWidth: 150,
    },
    {
      field: 'orderSourceType',
      title: '工单来源',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE },
      },
    },
    {
      field: 'orderSourceCode',
      title: '来源单据编号',
      width: 140,
    },
    {
      field: 'productCode',
      title: '产品编码',
      width: 120,
    },
    {
      field: 'productName',
      title: '产品名称',
      minWidth: 120,
    },
    {
      field: 'productSpecification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'quantity',
      title: '工单数量',
      width: 100,
    },
    {
      field: 'quantityChanged',
      title: '调整数量',
      width: 100,
    },
    {
      field: 'quantityProduced',
      title: '已生产数量',
      width: 100,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      width: 120,
    },
    {
      field: 'clientName',
      title: '客户名称',
      width: 120,
    },
    {
      field: 'requestDate',
      title: '需求日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '排产状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_WORK_ORDER_STATUS },
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

/** 排产对话框只读工单信息的表单 */
export function useScheduleFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '工单编码',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'name',
      label: '工单名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'orderSourceType',
      label: '工单来源',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE, 'number'),
      },
    },
    {
      fieldName: 'orderSourceCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'type',
      label: '工单类型',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE, 'number'),
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'productSpecification',
      label: '规格型号',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'unitMeasureName',
      label: '单位',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'quantity',
      label: '工单数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        disabled: true,
        precision: 2,
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'requestDate',
      label: '需求日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: true,
        format: 'YYYY-MM-DD',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'status',
      label: '工单状态',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_STATUS, 'number'),
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        disabled: true,
        rows: 2,
      },
    },
  ];
}

/** 生产任务子表的字段 */
export function useTaskGridColumns(
  editable: boolean,
): VxeTableGridOptions<MesProTaskApi.Task>['columns'] {
  return [
    {
      field: 'code',
      title: '任务编码',
      width: 140,
    },
    {
      field: 'name',
      title: '任务名称',
      minWidth: 150,
    },
    {
      field: 'workstationCode',
      title: '工作站编号',
      width: 120,
    },
    {
      field: 'workstationName',
      title: '工作站名称',
      width: 120,
    },
    {
      field: 'quantity',
      title: '排产数量',
      width: 100,
    },
    {
      field: 'producedQuantity',
      title: '已生产数量',
      width: 100,
    },
    {
      field: 'startTime',
      title: '开始生产时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'duration',
      title: '生产时长',
      width: 80,
    },
    {
      field: 'endTime',
      title: '预计完成时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'colorCode',
      title: '显示颜色',
      width: 100,
      slots: { default: 'colorCode' },
    },
    ...(editable
      ? [
          {
            title: '操作',
            width: 160,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 生产任务新增/修改的表单 */
export function useTaskFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        placeholder: '请选择工作站',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '排产数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0.01,
        placeholder: '请输入排产数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'colorCode',
      label: '甘特颜色',
      component: markRaw(RouteColorPicker),
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
        // 开始时间变更：重新计算结束时间
        onChange: () => recalcEndTime(formApi),
      },
      rules: 'required',
    },
    {
      fieldName: 'duration',
      label: '生产时长',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        placeholder: '请输入生产时长',
        precision: 0,
        // 生产时长变更：重新计算结束时间
        onChange: () => recalcEndTime(formApi),
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: true,
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 计算结束时间：开始时间 + 生产时长 × 8 小时 */
async function recalcEndTime(formApi?: VbenFormApi) {
  if (!formApi) {
    return;
  }
  const values = await formApi.getValues();
  if (values.startTime && values.duration) {
    const start = Number(values.startTime);
    await formApi.setFieldValue(
      'endTime',
      start + values.duration * 8 * 3600 * 1000,
    );
  }
}

/** 任务选择弹窗的搜索表单 */
export function useTaskSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'processId',
      label: '所属工序',
      component: markRaw(ProProcessSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择工序',
      },
    },
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择工作站',
      },
    },
    {
      fieldName: 'code',
      label: '任务编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入任务编号',
      },
    },
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入任务名称',
      },
    },
  ];
}

/** 任务选择弹窗的字段 */
export function useTaskSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesProTaskApi.Task>['columns'] {
  return [
    { type: multiple ? 'checkbox' : 'radio', width: 50 },
    { field: 'code', title: '任务编号', width: 180 },
    { field: 'name', title: '任务名称', minWidth: 140 },
    { field: 'workstationCode', title: '工作站编码', width: 140 },
    { field: 'workstationName', title: '工作站名称', width: 140 },
    { field: 'processName', title: '工序', width: 120 },
    {
      field: 'checkFlag',
      title: '是否质检',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    { field: 'itemCode', title: '物料编码', width: 140 },
    { field: 'itemName', title: '物料名称', width: 140 },
    { field: 'itemSpecification', title: '规格型号', width: 120 },
    { field: 'quantity', title: '排产数量', width: 100 },
    { field: 'producedQuantity', title: '已生产数量', width: 110 },
    {
      field: 'startTime',
      title: '开始生产时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    { field: 'duration', title: '生产时长', width: 100 },
    {
      field: 'endTime',
      title: '预计完成时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '任务状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_TASK_STATUS },
      },
    },
  ];
}
