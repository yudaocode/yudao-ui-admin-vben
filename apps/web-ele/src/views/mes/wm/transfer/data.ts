import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmTransferApi } from '#/api/mes/wm/transfer';
import type { MesWmTransferDetailApi } from '#/api/mes/wm/transfer/detail';
import type { MesWmTransferLineApi } from '#/api/mes/wm/transfer/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesWmTransferTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { WmMaterialStockSelect } from '#/views/mes/wm/materialstock/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType =
  | 'confirm'
  | 'create'
  | 'detail'
  | 'finish'
  | 'stock'
  | 'update';

/** 表头是否只读（上架、确认、执行、详情态） */
function isHeaderReadonly(formType: FormType): boolean {
  return ['confirm', 'detail', 'finish', 'stock'].includes(formType);
}

/** 新增/修改的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  const headerReadonly = isHeaderReadonly(formType);
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
      label: '转移单编号',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入转移单编号',
      },
      rules: 'required',
      suffix:
        formType === 'create' || formType === 'update'
          ? () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.TRANSFER_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              )
          : undefined,
    },
    {
      fieldName: 'name',
      label: '转移单名称',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入转移单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '转移单类型',
      component: 'Select',
      componentProps: {
        disabled: headerReadonly,
        options: getDictOptions(DICT_TYPE.MES_WM_TRANSFER_TYPE, 'number'),
        placeholder: '请选择转移单类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'transferDate',
      label: '转移日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: headerReadonly,
        placeholder: '请选择转移日期',
        type: 'date',
        valueFormat: 'YYYY-MM-DD 00:00:00',
      },
      rules: 'required',
    },
    {
      fieldName: 'deliveryFlag',
      label: '是否配送',
      component: 'Switch',
      componentProps: {
        disabled: headerReadonly,
      },
      rules: z.boolean().default(false),
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesWmTransferTypeEnum.OUTER,
      },
    },
    {
      fieldName: 'confirmFlag',
      label: '是否确认',
      component: 'Switch',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesWmTransferTypeEnum.OUTER,
      },
    },
    {
      fieldName: 'recipientName',
      label: '收货人',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入收货人',
      },
      dependencies: {
        triggerFields: ['type', 'deliveryFlag'],
        show: (values) =>
          values.type === MesWmTransferTypeEnum.OUTER && !!values.deliveryFlag,
      },
    },
    {
      fieldName: 'recipientTelephone',
      label: '联系电话',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入联系电话',
      },
      dependencies: {
        triggerFields: ['type', 'deliveryFlag'],
        show: (values) =>
          values.type === MesWmTransferTypeEnum.OUTER && !!values.deliveryFlag,
      },
    },
    {
      fieldName: 'carrier',
      label: '承运商',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入承运商',
      },
      dependencies: {
        triggerFields: ['type', 'deliveryFlag'],
        show: (values) =>
          values.type === MesWmTransferTypeEnum.OUTER && !!values.deliveryFlag,
      },
    },
    {
      fieldName: 'shippingNumber',
      label: '运输单号',
      component: 'Input',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入运输单号',
      },
      dependencies: {
        triggerFields: ['type', 'deliveryFlag'],
        show: (values) =>
          values.type === MesWmTransferTypeEnum.OUTER && !!values.deliveryFlag,
      },
    },
    {
      fieldName: 'destinationAddress',
      label: '目的地',
      component: 'Input',
      formItemClass: 'col-span-2',
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请输入目的地',
      },
      dependencies: {
        triggerFields: ['type', 'deliveryFlag'],
        show: (values) =>
          values.type === MesWmTransferTypeEnum.OUTER && !!values.deliveryFlag,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        disabled: headerReadonly,
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
      label: '转移单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入转移单编号',
      },
    },
    {
      fieldName: 'name',
      label: '转移单名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入转移单名称',
      },
    },
    {
      fieldName: 'type',
      label: '转移单类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_TRANSFER_TYPE, 'number'),
        placeholder: '请选择转移单类型',
      },
    },
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_TRANSFER_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmTransferApi.Transfer>['columns'] {
  return [
    {
      field: 'code',
      title: '转移单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '转移单名称',
      minWidth: 160,
    },
    {
      field: 'type',
      title: '转移单类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_TRANSFER_TYPE },
      },
    },
    {
      field: 'deliveryFlag',
      title: '是否配送',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'transferDate',
      title: '转移日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_TRANSFER_STATUS },
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

/** 转移单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmTransferLineApi.TransferLine>['columns'] {
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
      title: '转移数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'fromWarehouseName',
      title: '移出仓库',
      minWidth: 120,
    },
    {
      field: 'fromLocationName',
      title: '移出库区',
      minWidth: 120,
    },
    {
      field: 'fromAreaName',
      title: '移出库位',
      minWidth: 120,
    },
    ...(editable || stockable
      ? [
          {
            title: '操作',
            width: 180,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 转移单行新增/修改的表单 */
export function useLineFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
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
      fieldName: 'batchId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'materialStockId',
      label: '选择库存',
      component: markRaw(WmMaterialStockSelect),
      componentProps: {
        // 选择库存后，自动回填物料/仓库位置/批次/数量
        onChange: async (stock?: MesWmMaterialStockApi.MaterialStock) => {
          await formApi?.setValues({
            batchCode: stock?.batchCode,
            batchId: stock?.batchId,
            fromAreaId: stock?.areaId,
            fromLocationId: stock?.locationId,
            fromWarehouseId: stock?.warehouseId,
            itemId: stock?.itemId,
            quantity: stock?.quantity,
            quantityMax: stock?.quantity,
          });
        },
      },
      rules: 'selectRequired',
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
      fieldName: 'quantity',
      label: '转移数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入转移数量',
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['quantityMax'],
        componentProps: (values) => ({
          class: '!w-full',
          controlsPosition: 'right',
          max: values.quantityMax,
          min: 0,
          placeholder: '请输入转移数量',
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
      },
    },
    {
      fieldName: 'fromWarehouseId',
      label: '移出仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'fromLocationId',
      label: '移出库区',
      component: markRaw(WmWarehouseLocationSelect),
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['fromWarehouseId'],
        componentProps: (values) => ({
          disabled: true,
          warehouseId: values.fromWarehouseId,
        }),
      },
    },
    {
      fieldName: 'fromAreaId',
      label: '移出库位',
      component: markRaw(WmWarehouseAreaSelect),
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['fromLocationId'],
        componentProps: (values) => ({
          disabled: true,
          locationId: values.fromLocationId,
        }),
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

/** 调拨明细子表的字段 */
export function useDetailGridColumns(
  stockable: boolean,
): VxeTableGridOptions<MesWmTransferDetailApi.TransferDetail>['columns'] {
  return [
    {
      field: 'toWarehouseName',
      title: '移入仓库',
      minWidth: 100,
    },
    {
      field: 'toLocationName',
      title: '移入库区',
      minWidth: 100,
    },
    {
      field: 'toAreaName',
      title: '移入库位',
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

/** 调拨明细新增/修改的表单 */
export function useDetailFormSchema(): VbenFormSchema[] {
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
      fieldName: 'toWarehouseId',
      label: '移入仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        placeholder: '请选择移入仓库',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'toLocationId',
      label: '移入库区',
      component: markRaw(WmWarehouseLocationSelect),
      componentProps: {
        placeholder: '请选择移入库区',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['toWarehouseId'],
        componentProps: (values) => ({
          placeholder: '请选择移入库区',
          warehouseId: values.toWarehouseId,
        }),
      },
    },
    {
      fieldName: 'toAreaId',
      label: '移入库位',
      component: markRaw(WmWarehouseAreaSelect),
      componentProps: {
        placeholder: '请选择移入库位',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['toLocationId'],
        componentProps: (values) => ({
          locationId: values.toLocationId,
          placeholder: '请选择移入库位',
        }),
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
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}
