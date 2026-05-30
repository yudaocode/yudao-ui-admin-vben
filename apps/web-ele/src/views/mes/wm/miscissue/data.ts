import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmMiscIssueApi } from '#/api/mes/wm/miscissue';
import type { MesWmMiscIssueLineApi } from '#/api/mes/wm/miscissue/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { WmMaterialStockSelect } from '#/views/mes/wm/materialstock/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'update';

/** 表单头部是否只读（详情、执行出库态） */
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
      label: '出库单编号',
      component: 'Input',
      componentProps: {
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
                    MesAutoCodeRuleCode.WM_MISC_ISSUE_CODE,
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
        placeholder: '请输入出库单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_WM_MISC_ISSUE_TYPE, 'number'),
        placeholder: '请选择业务类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'issueDate',
      label: '出库日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择出库日期',
        type: 'date',
        valueFormat: 'x',
      },
      rules: 'required',
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
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来源单据编号',
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
      fieldName: 'type',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_MISC_ISSUE_TYPE, 'number'),
        placeholder: '请选择业务类型',
      },
    },
    {
      fieldName: 'sourceDocType',
      label: '来源单据类型',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入来源单据类型',
      },
    },
    {
      fieldName: 'sourceDocCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入来源单据编号',
      },
    },
    {
      fieldName: 'issueDate',
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
        options: getDictOptions(DICT_TYPE.MES_WM_MISC_ISSUE_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmMiscIssueApi.MiscIssue>['columns'] {
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
      field: 'type',
      title: '业务类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_MISC_ISSUE_TYPE },
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
      field: 'issueDate',
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
        props: { type: DICT_TYPE.MES_WM_MISC_ISSUE_STATUS },
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
  editable = true,
): VxeTableGridOptions<MesWmMiscIssueLineApi.MiscIssueLine>['columns'] {
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
      title: '出库数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次编码',
      minWidth: 120,
    },
    {
      field: 'warehouseName',
      title: '仓库',
      minWidth: 120,
    },
    {
      field: 'locationName',
      title: '库区',
      minWidth: 120,
    },
    {
      field: 'areaName',
      title: '库位',
      minWidth: 120,
    },
    ...(editable
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

/** 出库单行新增/修改的表单 */
export function useLineFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'itemId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
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
      fieldName: 'materialStockId',
      label: '库存物资',
      component: markRaw(WmMaterialStockSelect),
      componentProps: {
        // 选择库存物资后，自动回填物料、批次号、仓库位置和最大可出库数量
        onChange: async (stock?: MesWmMaterialStockApi.MaterialStock) => {
          await formApi?.setValues({
            areaId: stock?.areaId,
            batchCode: stock?.batchCode,
            itemId: stock?.itemId,
            locationId: stock?.locationId,
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
      label: '出库数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0.01,
        placeholder: '请输入出库数量',
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['quantityMax'],
        componentProps: (values) => ({
          class: '!w-full',
          controlsPosition: 'right',
          max: values.quantityMax,
          min: 0.01,
          placeholder: '请输入出库数量',
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
        placeholder: '批次号',
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
