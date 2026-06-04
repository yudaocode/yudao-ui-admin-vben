import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmReturnVendorApi } from '#/api/mes/wm/returnvendor';
import type { MesWmReturnVendorDetailApi } from '#/api/mes/wm/returnvendor/detail';
import type { MesWmReturnVendorLineApi } from '#/api/mes/wm/returnvendor/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';
import { WmBatchSelect } from '#/views/mes/wm/batch/components';
import { WmMaterialStockSelect } from '#/views/mes/wm/materialstock/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'stock' | 'update';

/** 表单头部是否只读（拣货、详情、完成态） */
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
              Button,
              {
                type: 'default',
                onClick: async () => {
                  const code = await generateAutoCode(
                    MesAutoCodeRuleCode.WM_RETURN_VENDOR_CODE,
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
      fieldName: 'purchaseOrderCode',
      label: '采购订单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入采购订单号',
      },
    },
    {
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'returnDate',
      label: '退货日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择退货日期',
        showTime: true,
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
    },
    {
      fieldName: 'transportCode',
      label: '运单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入运单号',
      },
    },
    {
      fieldName: 'transportTelephone',
      label: '联系电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系电话',
      },
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
        allowClear: true,
        placeholder: '请输入退货单编号',
      },
    },
    {
      fieldName: 'name',
      label: '退货单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入退货单名称',
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
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmReturnVendorApi.ReturnVendor>['columns'] {
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
      field: 'purchaseOrderCode',
      title: '采购订单号',
      minWidth: 140,
    },
    {
      field: 'vendorCode',
      title: '供应商编码',
      minWidth: 120,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      minWidth: 150,
    },
    {
      field: 'returnDate',
      title: '退货日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_RETURN_VENDOR_STATUS },
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
): VxeTableGridOptions<MesWmReturnVendorLineApi.ReturnVendorLine>['columns'] {
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
  vendorId?: number,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '退货数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入退货数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'batchId',
      label: '批次号',
      component: markRaw(WmBatchSelect),
      componentProps: {
        // 选择批次后同步批次号
        onChange: async (batch?: { code?: string }) => {
          await formApi?.setFieldValue('batchCode', batch?.code);
        },
        vendorId,
      },
      dependencies: {
        triggerFields: ['itemId'],
        componentProps: (values) => ({
          itemId: values.itemId,
          vendorId,
        }),
      },
    },
    {
      fieldName: 'batchCode',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
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

/** 拣货明细子表的字段 */
export function useDetailGridColumns(
  stockable: boolean,
): VxeTableGridOptions<MesWmReturnVendorDetailApi.ReturnVendorDetail>['columns'] {
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

/** 拣货明细新增/修改的表单 */
export function useDetailFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'quantityMax',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'materialStockId',
      label: '库存记录',
      component: markRaw(WmMaterialStockSelect),
      componentProps: {
        // 选择库存记录后，自动回填仓库/库区/库位/批次/数量
        onChange: async (stock?: MesWmMaterialStockApi.MaterialStock) => {
          await formApi?.setValues({
            areaId: stock?.areaId,
            batchCode: stock?.batchCode,
            batchId: stock?.batchId,
            locationId: stock?.locationId,
            quantity: stock?.quantity,
            quantityMax: stock?.quantity,
            warehouseId: stock?.warehouseId,
          });
        },
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['itemId'],
        componentProps: (values) => ({
          itemId: values.itemId,
        }),
      },
    },
    {
      fieldName: 'quantity',
      label: '数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入数量',
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['quantityMax'],
        componentProps: (values) => ({
          class: '!w-full',
          max: values.quantityMax,
          min: 0,
          placeholder: '请输入数量',
          precision: 2,
        }),
      },
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'locationId',
      label: '库区',
      component: markRaw(WmWarehouseLocationSelect),
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['warehouseId'],
        componentProps: (values) => ({
          disabled: true,
          warehouseId: values.warehouseId,
        }),
      },
    },
    {
      fieldName: 'areaId',
      label: '库位',
      component: markRaw(WmWarehouseAreaSelect),
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['locationId'],
        componentProps: (values) => ({
          disabled: true,
          locationId: values.locationId,
        }),
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
  ];
}
