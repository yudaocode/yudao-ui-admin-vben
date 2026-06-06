import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBatchApi } from '#/api/mes/wm/batch';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProTaskSelect } from '#/views/mes/pro/task/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
import { TmToolSelect } from '#/views/mes/tm/tool/components';

/** 批次选择弹窗的搜索表单 */
export function useBatchSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '批次编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次编号',
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
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        placeholder: '请选择工作站',
      },
    },
    {
      fieldName: 'taskId',
      label: '生产任务',
      component: markRaw(ProTaskSelect),
      componentProps: {
        placeholder: '请选择生产任务',
      },
    },
    {
      fieldName: 'toolId',
      label: '工具',
      component: markRaw(TmToolSelect),
      componentProps: {
        placeholder: '请选择工具',
      },
    },
    {
      fieldName: 'moldId',
      label: '模具编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模具编号',
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'purchaseOrderCode',
      label: '采购订单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入采购订单编号',
      },
    },
    {
      fieldName: 'lotNumber',
      label: '生产批号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入生产批号',
      },
    },
    {
      fieldName: 'qualityStatus',
      label: '质量状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS, 'number'),
        placeholder: '请选择质量状态',
      },
    },
    {
      fieldName: 'produceDate',
      label: '生产日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'expireDate',
      label: '有效期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'receiptDate',
      label: '入库日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 批次选择弹窗的字段 */
export function useBatchSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesWmBatchApi.Batch>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '批次编号',
      width: 150,
    },
    {
      field: 'itemCode',
      title: '物料编码',
      width: 150,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 140,
    },
    {
      field: 'itemSpecification',
      title: '规格型号',
      width: 120,
    },
    {
      field: 'unitName',
      title: '单位',
      width: 80,
    },
    {
      field: 'vendorCode',
      title: '供应商编码',
      width: 120,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      width: 120,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      width: 110,
    },
    {
      field: 'clientName',
      title: '客户名称',
      width: 110,
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      width: 140,
    },
    {
      field: 'purchaseOrderCode',
      title: '采购订单编号',
      width: 140,
    },
    {
      field: 'workOrderCode',
      title: '工单编码',
      width: 140,
    },
    {
      field: 'workstationCode',
      title: '工作站编码',
      width: 120,
    },
    {
      field: 'taskCode',
      title: '生产任务编号',
      width: 140,
    },
    {
      field: 'toolCode',
      title: '工具编号',
      width: 120,
    },
    {
      field: 'lotNumber',
      title: '生产批号',
      width: 120,
    },
    {
      field: 'qualityStatus',
      title: '质量状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_QUALITY_STATUS },
      },
    },
    {
      field: 'produceDate',
      title: '生产日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'expireDate',
      title: '有效期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'receiptDate',
      title: '入库日期',
      width: 120,
      formatter: 'formatDate',
    },
  ];
}

/** 批次详情的描述字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'code',
      label: '批次编号',
    },
    {
      field: 'itemCode',
      label: '物料编码',
    },
    {
      field: 'itemName',
      label: '物料名称',
    },
    {
      field: 'itemSpecification',
      label: '规格型号',
    },
    {
      field: 'unitName',
      label: '单位',
    },
    {
      field: 'lotNumber',
      label: '生产批号',
    },
    {
      field: 'produceDate',
      label: '生产日期',
      render: (value) => (value ? formatDate(value, 'YYYY-MM-DD') : '-'),
    },
    {
      field: 'expireDate',
      label: '有效期',
      render: (value) => (value ? formatDate(value, 'YYYY-MM-DD') : '-'),
    },
    {
      field: 'receiptDate',
      label: '入库日期',
      render: (value) => (value ? formatDate(value, 'YYYY-MM-DD') : '-'),
    },
    {
      field: 'vendorName',
      label: '供应商',
      render: (value) => value || '-',
    },
    {
      field: 'clientName',
      label: '客户',
      render: (value) => value || '-',
    },
    {
      field: 'workstationCode',
      label: '工作站',
      render: (value) => value || '-',
    },
    {
      field: 'purchaseOrderCode',
      label: '采购订单编号',
      render: (value) => value || '-',
    },
    {
      field: 'salesOrderCode',
      label: '销售订单编号',
      render: (value) => value || '-',
    },
    {
      field: 'workOrderCode',
      label: '生产工单',
      render: (value) => value || '-',
    },
    {
      field: 'qualityStatus',
      label: '质量状态',
      render: (value) =>
        value == null
          ? '-'
          : h(DictTag, { type: DICT_TYPE.MES_WM_QUALITY_STATUS, value }),
    },
    {
      field: 'remark',
      label: '备注',
      span: 3,
      render: (value) => value || '-',
    },
  ];
}
