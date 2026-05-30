import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBatchApi } from '#/api/mes/wm/batch';
import type { DescriptionItemSchema } from '#/components/description';

import { markRaw } from 'vue';

import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '批次号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入批次号',
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
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
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
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'purchaseOrderCode',
      label: '采购订单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入采购订单编号',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmBatchApi.Batch>['columns'] {
  return [
    {
      field: 'code',
      title: '批次编号',
      minWidth: 160,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 140,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 160,
    },
    {
      field: 'itemSpecification',
      title: '规格型号',
      minWidth: 140,
    },
    {
      field: 'unitName',
      title: '单位',
      width: 80,
    },
    {
      field: 'vendorCode',
      title: '供应商编码',
      minWidth: 140,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      minWidth: 160,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      minWidth: 140,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 160,
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 160,
    },
    {
      field: 'purchaseOrderCode',
      title: '采购订单编号',
      minWidth: 160,
    },
    {
      title: '操作',
      width: 110,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 追溯明细列表的字段 */
export function useTraceGridColumns(): VxeTableGridOptions<MesWmBatchApi.Batch>['columns'] {
  return [
    {
      field: 'workOrderCode',
      title: '生产工单号',
      width: 160,
    },
    {
      field: 'code',
      title: '批次编号',
      minWidth: 160,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 140,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 160,
    },
    {
      field: 'itemSpecification',
      title: '规格型号',
      minWidth: 140,
    },
    {
      field: 'unitName',
      title: '单位',
      width: 80,
    },
  ];
}

/** 批次追溯详情的描述字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'code',
      label: '批次编号',
    },
    {
      field: 'itemCode',
      label: '物资编码',
    },
    {
      field: 'itemName',
      label: '物资名称',
    },
    {
      field: 'itemSpecification',
      label: '规格型号',
      span: 3,
    },
    {
      field: 'purchaseOrderCode',
      label: '采购订单编号',
    },
    {
      field: 'vendorCode',
      label: '供应商编码',
    },
    {
      field: 'vendorName',
      label: '供应商名称',
    },
    {
      field: 'salesOrderCode',
      label: '销售订单编号',
    },
    {
      field: 'clientCode',
      label: '客户编码',
    },
    {
      field: 'clientName',
      label: '客户名称',
    },
    {
      field: 'lotNumber',
      label: '生产批号',
    },
    {
      field: 'workOrderCode',
      label: '生产工单',
    },
    {
      field: 'workstationCode',
      label: '工作站编码',
    },
  ];
}
