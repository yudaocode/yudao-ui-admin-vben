import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmProductSalesApi } from '#/api/mes/wm/productsales';
import type { MesWmProductSalesDetailApi } from '#/api/mes/wm/productsales/detail';
import type { MesWmProductSalesLineApi } from '#/api/mes/wm/productsales/line';
import type { MesWmSalesNoticeApi } from '#/api/mes/wm/salesnotice';
import type { MesWmSalesNoticeLineApi } from '#/api/mes/wm/salesnotice/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesWmSalesNoticeStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { WmMaterialStockSelect } from '#/views/mes/wm/materialstock/components';
import {
  WmSalesNoticeLineSelect,
  WmSalesNoticeSelect,
} from '#/views/mes/wm/salesnotice/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType =
  | 'create'
  | 'detail'
  | 'finish'
  | 'shipping'
  | 'stock'
  | 'update';

/** 表单头部是否只读（拣货、填写运单、出库、详情态） */
function isHeaderReadonly(formType: FormType): boolean {
  return (
    formType === 'detail' ||
    formType === 'finish' ||
    formType === 'shipping' ||
    formType === 'stock'
  );
}

/** 是否展示运输信息 */
export function showShippingInfo(formType: FormType): boolean {
  return (
    formType === 'shipping' || formType === 'detail' || formType === 'finish'
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
      label: '出库单编号',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入出库单编号',
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
                    MesAutoCodeRuleCode.WM_PRODUCT_SALES_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '出库单名称',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入出库单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'noticeId',
      label: '发货通知单',
      component: markRaw(WmSalesNoticeSelect),
      componentProps: {
        disabled: isHeaderReadonly(formType),
        // 选择发货通知单后，自动回填销售订单号、客户、收货人信息
        onChange: async (notice?: MesWmSalesNoticeApi.SalesNotice) => {
          await formApi?.setValues({
            clientId: notice?.clientId,
            contactAddress: notice?.recipientAddress,
            contactName: notice?.recipientName,
            contactTelephone: notice?.recipientTelephone,
            salesOrderCode: notice?.salesOrderCode,
          });
        },
        status: MesWmSalesNoticeStatusEnum.APPROVED,
      },
    },
    {
      fieldName: 'salesOrderCode',
      label: '销售订单编号',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入销售订单编号',
      },
    },
    {
      fieldName: 'salesDate',
      label: '出库日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        disabled: isHeaderReadonly(formType),
        format: 'YYYY-MM-DD',
        placeholder: '请选择出库日期',
        type: 'date',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请选择客户',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'contactName',
      label: '收货人',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入收货人',
      },
    },
    {
      fieldName: 'contactTelephone',
      label: '联系方式',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入联系方式',
      },
    },
    {
      fieldName: 'contactAddress',
      label: '收货地址',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入收货地址',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        disabled: isHeaderReadonly(formType),
        placeholder: '请输入备注',
        rows: 3,
      },
    },
    {
      fieldName: 'carrier',
      label: '承运商',
      component: 'Input',
      componentProps: {
        disabled: formType !== 'shipping',
        placeholder: '请输入承运商',
      },
      dependencies: {
        triggerFields: [''],
        if: () => showShippingInfo(formType),
      },
    },
    {
      fieldName: 'shippingNumber',
      label: '运输单号',
      component: 'Input',
      componentProps: {
        disabled: formType !== 'shipping',
        placeholder: '请输入运输单号',
      },
      dependencies: {
        triggerFields: [''],
        if: () => showShippingInfo(formType),
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '出库单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入出库单编号',
      },
    },
    {
      fieldName: 'name',
      label: '出库单名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入出库单名称',
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
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'salesDate',
      label: '出库日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmProductSalesApi.ProductSales>['columns'] {
  return [
    {
      field: 'code',
      title: '出库单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '出库单名称',
      minWidth: 150,
    },
    {
      field: 'noticeCode',
      title: '发货通知单号',
      minWidth: 160,
    },
    {
      field: 'salesOrderCode',
      title: '销售订单编号',
      minWidth: 160,
    },
    {
      field: 'clientCode',
      title: '客户编码',
      minWidth: 120,
    },
    {
      field: 'clientName',
      title: '客户名称',
      minWidth: 120,
    },
    {
      field: 'contactName',
      title: '收货人',
      minWidth: 100,
    },
    {
      field: 'carrier',
      title: '承运商',
      minWidth: 120,
    },
    {
      field: 'shippingNumber',
      title: '运输单号',
      minWidth: 160,
    },
    {
      field: 'salesDate',
      title: '出库日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_PRODUCT_SALES_STATUS },
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

/** 出库单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmProductSalesLineApi.ProductSalesLine>['columns'] {
  return [
    {
      type: 'expand',
      width: 48,
      slots: { content: 'detail' },
    },
    {
      field: 'itemCode',
      title: '产品编码',
      minWidth: 120,
    },
    {
      field: 'itemName',
      title: '产品名称',
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
      title: '出库数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'oqcCheckFlag',
      title: '是否校验',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
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

/** 出库单行新增/修改的表单 */
export function useLineFormSchema(
  hasNotice: boolean,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'noticeId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'noticeLineId',
      label: '发货通知单行',
      component: markRaw(WmSalesNoticeLineSelect),
      componentProps: {
        // 选择发货通知单行后，自动回填物料、数量、批次、是否检验
        onChange: async (line?: MesWmSalesNoticeLineApi.SalesNoticeLine) => {
          await formApi?.setValues({
            batchCode: line?.batchCode,
            itemId: line?.itemId,
            oqcCheckFlag: line?.oqcCheckFlag ?? false,
            quantity: line?.quantity,
          });
        },
      },
      dependencies: {
        triggerFields: ['noticeId'],
        if: () => hasNotice,
        componentProps: (values) => ({
          noticeId: values.noticeId,
        }),
      },
    },
    {
      fieldName: 'itemId',
      label: '产品',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['noticeLineId'],
        componentProps: (values) => ({
          disabled: !!values.noticeLineId,
          placeholder: '请选择产品',
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
      label: '出库数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入出库数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'oqcCheckFlag',
      label: '是否校验',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
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

/** 拣货明细子表的字段 */
export function useDetailGridColumns(
  stockable: boolean,
): VxeTableGridOptions<MesWmProductSalesDetailApi.ProductSalesDetail>['columns'] {
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
      fieldName: 'batchId',
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
      label: '选择库存',
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
        triggerFields: ['itemId', 'batchId'],
        componentProps: (values) => ({
          batchId: values.batchId,
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
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入数量',
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
          placeholder: '请输入数量',
          precision: 2,
        }),
      },
    },
    {
      fieldName: 'warehouseId',
      label: '出库仓库',
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
