import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProProcessSelect } from '#/views/mes/pro/process/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

/** 任务选择弹窗的搜索表单 */
export function useTaskSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        clearable: true,
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'processId',
      label: '所属工序',
      component: markRaw(ProProcessSelect),
      componentProps: {
        clearable: true,
        placeholder: '请选择工序',
      },
    },
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        clearable: true,
        placeholder: '请选择工作站',
      },
    },
    {
      fieldName: 'code',
      label: '任务编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入任务编号',
      },
    },
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        clearable: true,
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
