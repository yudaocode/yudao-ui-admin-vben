import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmProductReceiptApi } from '#/api/mes/wm/productreceipt';
import type { MesWmProductReceiptDetailApi } from '#/api/mes/wm/productreceipt/detail';
import type { MesWmProductReceiptLineApi } from '#/api/mes/wm/productreceipt/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderStatusEnum } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
import { WmMaterialStockSelect } from '#/views/mes/wm/materialstock/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'stock' | 'update';

/** 表单头部是否只读（上架、详情、入库态） */
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
      label: '入库单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入入库单编号',
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
                    MesAutoCodeRuleCode.PRODUCTRECPT_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '入库单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入入库单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'receiptDate',
      label: '入库日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择入库日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        status: MesProWorkOrderStatusEnum.CONFIRMED,
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
      label: '入库单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入入库单编号',
      },
    },
    {
      fieldName: 'name',
      label: '入库单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入入库单名称',
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

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmProductReceiptApi.ProductReceipt>['columns'] {
  return [
    {
      field: 'code',
      title: '入库单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '入库单名称',
      minWidth: 150,
    },
    {
      field: 'workOrderCode',
      title: '生产工单',
      minWidth: 140,
    },
    {
      field: 'receiptDate',
      title: '入库日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_PRODUCT_RECEIPT_STATUS },
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

/** 入库单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmProductReceiptLineApi.ProductReceiptLine>['columns'] {
  return [
    {
      type: 'expand',
      width: 48,
      slots: { content: 'detail' },
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
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
      title: '入库数量',
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
            width: 200,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 入库单行新增/修改的表单 */
export function useLineFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'materialStockId',
      label: '库存记录',
      component: markRaw(WmMaterialStockSelect),
      componentProps: {
        // 选择库存记录后，自动回填物料/批次/数量
        onChange: async (stock?: MesWmMaterialStockApi.MaterialStock) => {
          await formApi?.setValues({
            batchCode: stock?.batchCode,
            batchId: stock?.batchId,
            itemId: stock?.itemId,
            quantity: stock?.quantity,
            quantityMax: stock?.quantity,
          });
        },
        virtualFilter: 'only',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantityMax',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'quantity',
      label: '入库数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入入库数量',
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['quantityMax'],
        componentProps: (values) => ({
          class: '!w-full',
          max: values.quantityMax,
          min: 0,
          placeholder: '请输入入库数量',
          precision: 2,
        }),
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '选择库存后自动带出',
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
): VxeTableGridOptions<MesWmProductReceiptDetailApi.ProductReceiptDetail>['columns'] {
  return [
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
    },
  ];
}
