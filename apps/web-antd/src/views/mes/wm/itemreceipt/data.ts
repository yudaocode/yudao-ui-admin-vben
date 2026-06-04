import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';
import type { MesWmArrivalNoticeLineApi } from '#/api/mes/wm/arrivalnotice/line';
import type { MesWmItemReceiptApi } from '#/api/mes/wm/itemreceipt';
import type { MesWmItemReceiptDetailApi } from '#/api/mes/wm/itemreceipt/detail';
import type { MesWmItemReceiptLineApi } from '#/api/mes/wm/itemreceipt/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesWmArrivalNoticeStatusEnum } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';
import {
  WmArrivalNoticeLineSelect,
  WmArrivalNoticeSelect,
} from '#/views/mes/wm/arrivalnotice/components';
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
                    MesAutoCodeRuleCode.WM_ITEM_RECEIPT_CODE,
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
      fieldName: 'noticeId',
      label: '到货通知单',
      component: markRaw(WmArrivalNoticeSelect),
      componentProps: {
        // 选择到货通知单后，自动回填供应商和采购订单号
        onChange: async (notice?: MesWmArrivalNoticeApi.ArrivalNotice) => {
          await formApi?.setValues({
            purchaseOrderCode: notice?.purchaseOrderCode,
            vendorId: notice?.vendorId,
          });
        },
        status: MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT,
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
      fieldName: 'purchaseOrderCode',
      label: '采购订单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入采购订单号',
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
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
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
export function useGridColumns(): VxeTableGridOptions<MesWmItemReceiptApi.ItemReceipt>['columns'] {
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
      field: 'purchaseOrderCode',
      title: '采购订单号',
      minWidth: 140,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      minWidth: 120,
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
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_ITEM_RECEIPT_STATUS },
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
): VxeTableGridOptions<MesWmItemReceiptLineApi.ItemReceiptLine>['columns'] {
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
      field: 'receivedQuantity',
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
      fieldName: 'arrivalNoticeLineId',
      label: '到货通知单行',
      component: markRaw(WmArrivalNoticeLineSelect),
      componentProps: {
        // 选择到货通知单行后，自动回填物料和入库数量
        onChange: async (
          line?: MesWmArrivalNoticeLineApi.ArrivalNoticeLine,
        ) => {
          await formApi?.setValues({
            itemId: line?.itemId,
            receivedQuantity: line?.arrivalQuantity,
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
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择物料',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['arrivalNoticeLineId'],
        componentProps: (values) => ({
          disabled: !!values.arrivalNoticeLineId,
          placeholder: '请选择物料',
        }),
      },
    },
    {
      fieldName: 'receivedQuantity',
      label: '入库数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入入库数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'productionDate',
      label: '生产日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择生产日期',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'expireDate',
      label: '有效期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择有效期',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'lotNumber',
      label: '生产批号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入生产批号',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '由填写信息自动生成',
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
): VxeTableGridOptions<MesWmItemReceiptDetailApi.ItemReceiptDetail>['columns'] {
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
