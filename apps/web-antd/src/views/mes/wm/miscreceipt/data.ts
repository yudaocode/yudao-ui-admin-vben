import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMiscReceiptApi } from '#/api/mes/wm/miscreceipt';
import type { MesWmMiscReceiptLineApi } from '#/api/mes/wm/miscreceipt/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'update';

/** 表单头部是否只读（详情、执行入库态） */
function isHeaderReadonly(formType: FormType): boolean {
  return formType === 'detail' || formType === 'finish';
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
                    MesAutoCodeRuleCode.WM_MISC_RECEIPT_CODE,
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
      fieldName: 'type',
      label: '杂项类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE, 'number'),
        placeholder: '请选择杂项类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'sourceDocType',
      label: '来源单据类型',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来源单据类型',
      },
    },
    {
      fieldName: 'sourceDocCode',
      label: '来源单据编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来源单据编码',
      },
    },
    {
      fieldName: 'receiptDate',
      label: '入库日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择入库日期',
        valueFormat: 'x',
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
      fieldName: 'type',
      label: '杂项类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE, 'number'),
        placeholder: '请选择杂项类型',
      },
    },
    {
      fieldName: 'sourceDocType',
      label: '来源单据类型',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入来源单据类型',
      },
    },
    {
      fieldName: 'sourceDocCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入来源单据编号',
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
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmMiscReceiptApi.MiscReceipt>['columns'] {
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
      field: 'type',
      title: '杂项类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_MISC_RECEIPT_TYPE },
      },
    },
    {
      field: 'sourceDocType',
      title: '来源单据类型',
      minWidth: 120,
    },
    {
      field: 'sourceDocCode',
      title: '来源单据编号',
      minWidth: 150,
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
        props: { type: DICT_TYPE.MES_WM_MISC_RECEIPT_STATUS },
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
  editable = true,
): VxeTableGridOptions<MesWmMiscReceiptLineApi.MiscReceiptLine>['columns'] {
  return [
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
      title: '入库数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'warehouseName',
      title: '仓库',
      minWidth: 100,
    },
    {
      field: 'locationName',
      title: '库区',
      minWidth: 100,
    },
    {
      field: 'areaName',
      title: '库位',
      minWidth: 100,
    },
    ...(editable
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

/** 入库单行新增/修改的表单 */
export function useLineFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
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
      label: '入库数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0.01,
        placeholder: '请输入入库数量',
        precision: 2,
      },
      rules: 'required',
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
      fieldName: 'warehouseId',
      label: '仓库',
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
