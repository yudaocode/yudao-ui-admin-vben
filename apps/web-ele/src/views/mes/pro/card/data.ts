import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProCardApi } from '#/api/mes/pro/card';

import { markRaw } from 'vue';

import { MdItemSelect } from '#/views/mes/md/item/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

/** 流转卡选择弹窗的搜索表单 */
export function useCardSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '流转卡编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入流转卡编号',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入批次号',
      },
    },
  ];
}

/** 流转卡选择弹窗的字段 */
export function useCardSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesProCardApi.Card>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '流转卡编号',
      width: 160,
    },
    {
      field: 'workOrderCode',
      title: '生产工单编号',
      width: 160,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      width: 140,
    },
    {
      field: 'batchCode',
      title: '批次号',
      width: 120,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 150,
    },
    {
      field: 'specification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'transferedQuantity',
      title: '流转数量',
      width: 100,
    },
  ];
}
