import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnSalesApi } from '#/api/mes/wm/returnsales';
import type { MesWmReturnSalesDetailApi } from '#/api/mes/wm/returnsales/detail';
import type { MesWmReturnSalesLineApi } from '#/api/mes/wm/returnsales/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { WmBatchSelect } from '#/views/mes/wm/batch/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'stock' | 'update';

/** 表单头部是否只读（上架、详情、执行退货态） */
function isHeaderReadonly(formType: FormType): boolean {
  return (
    formType === 'detail' || formType === 'finish' || formType === 'stock'
  );
}

/** 新增/修改的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
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
      fieldName: 'status',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'code',
      label: '退货单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入退货单编号',
      },
      rules: 'required',
      suffix: isHeaderReadonly(formType)
        ? undefined
        : () =>
            h(
              ElButton,
              {
                onClick: async () => {
                  const code = await generateAutoCode(
                    MesAutoCodeRuleCode.WM_RETURN_SALES_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '退货单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入退货单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入销售订单号',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'returnDate',
      label: '退货日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择退货日期',
        type: 'date',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'returnReason',
      label: '退货原因',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入退货原因',
        rows: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '退货单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入退货单编号',
      },
    },
    {
      fieldName: 'name',
      label: '退货单名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入退货单名称',
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入销售订单号',
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
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_RETURN_SALES_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmReturnSalesApi.ReturnSales>['columns'] {
  return [
    {
      field: 'code',
      title: '退货单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '退货单名称',
      minWidth: 150,
    },
    {
      field: 'salesOrderCode',
      title: '销售订单号',
      minWidth: 140,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      minWidth: 120,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 150,
    },
    {
      field: 'returnReason',
      title: '退货原因',
      minWidth: 150,
    },
    {
      field: 'returnDate',
      title: '退货日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_RETURN_SALES_STATUS },
      },
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 退货单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmReturnSalesLineApi.ReturnSalesLine>['columns'] {
  return [
    {
      type: 'expand',
      width: 48,
      slots: { content: 'detail' },
    },
    {
      field: 'itemCode',
      title: '物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 140,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'quantity',
      title: '退货数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'rqcCheckFlag',
      title: '是否需要质检',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
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
    ...(editable || stockable
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

/** 退货单行新增/修改的表单 */
export function useLineFormSchema(
  clientId?: number,
  salesOrderCode?: string,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择物料',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '退货数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入退货数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'batchId',
      label: '批次',
      component: markRaw(WmBatchSelect),
      componentProps: {
        clientId,
        placeholder: '请选择批次',
        salesOrderCode,
      },
      dependencies: {
        triggerFields: ['itemId'],
        componentProps: (values) => ({
          clientId,
          itemId: values.itemId,
          placeholder: '请选择批次',
          salesOrderCode,
        }),
      },
    },
    {
      fieldName: 'rqcCheckFlag',
      label: '需要质检',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 上架明细子表的字段 */
export function useDetailGridColumns(
  stockable: boolean,
): VxeTableGridOptions<MesWmReturnSalesDetailApi.ReturnSalesDetail>['columns'] {
  return [
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'warehouseName',
      title: '仓库名称',
      minWidth: 100,
    },
    {
      field: 'locationName',
      title: '库区名称',
      minWidth: 100,
    },
    {
      field: 'areaName',
      title: '库位名称',
      minWidth: 100,
    },
    {
      field: 'quantity',
      title: '数量',
      width: 100,
    },
    ...(stockable
      ? [
          {
            title: '操作',
            width: 120,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 上架明细新增/修改的表单 */
export function useDetailFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'warehouseId',
      label: '入库仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        // 切换仓库后清空库区和库位
        onChange: async () => {
          await formApi?.setValues({
            areaId: undefined,
            locationId: undefined,
          });
        },
        placeholder: '请选择仓库',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'locationId',
      label: '库区',
      component: markRaw(WmWarehouseLocationSelect),
      componentProps: {
        placeholder: '请选择库区',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['warehouseId'],
        componentProps: (values) => ({
          // 切换库区后清空库位
          onChange: async () => {
            await formApi?.setFieldValue('areaId', undefined);
          },
          placeholder: '请选择库区',
          warehouseId: values.warehouseId,
        }),
      },
    },
    {
      fieldName: 'areaId',
      label: '库位',
      component: markRaw(WmWarehouseAreaSelect),
      componentProps: {
        placeholder: '请选择库位',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['locationId'],
        componentProps: (values) => ({
          locationId: values.locationId,
          placeholder: '请选择库位',
        }),
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'quantity',
      label: '数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入数量',
        precision: 2,
      },
      rules: 'required',
    },
  ];
}
