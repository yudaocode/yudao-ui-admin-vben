import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmOutsourceIssueApi } from '#/api/mes/wm/outsourceissue';
import type { MesWmOutsourceIssueDetailApi } from '#/api/mes/wm/outsourceissue/detail';
import type { MesWmOutsourceIssueLineApi } from '#/api/mes/wm/outsourceissue/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@vben/constants';

import { ElButton } from 'element-plus';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
import { WmMaterialStockSelect } from '#/views/mes/wm/materialstock/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'finish' | 'stock' | 'update';

/** 表单头部是否只读（拣货、详情、领出态） */
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
      label: '发料单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入发料单编号',
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
                    MesAutoCodeRuleCode.WM_OUTSOURCE_ISSUE_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '发料单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入发料单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'issueDate',
      label: '发料日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择发料日期',
        type: 'date',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '外协工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        // 选择外协工单后，自动回填供应商
        onChange: async (workOrder?: MesProWorkOrderApi.WorkOrder) => {
          await formApi?.setFieldValue('vendorId', workOrder?.vendorId);
        },
        status: MesProWorkOrderStatusEnum.CONFIRMED,
        type: MesProWorkOrderTypeEnum.OUTSOURCE,
      },
      rules: 'selectRequired',
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
      label: '发料单编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入发料单编号',
      },
    },
    {
      fieldName: 'name',
      label: '发料单名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入发料单名称',
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
      fieldName: 'issueDate',
      label: '发料日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmOutsourceIssueApi.OutsourceIssue>['columns'] {
  return [
    {
      field: 'code',
      title: '发料单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '发料单名称',
      minWidth: 150,
    },
    {
      field: 'workOrderCode',
      title: '生产工单号',
      minWidth: 140,
    },
    {
      field: 'vendorName',
      title: '供应商名称',
      minWidth: 120,
    },
    {
      field: 'issueDate',
      title: '发料日期',
      width: 180,
      formatter: 'formatDate',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_OUTSOURCE_ISSUE_STATUS },
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

/** 发料单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmOutsourceIssueLineApi.OutsourceIssueLine>['columns'] {
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
      title: '领料数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
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

/** 发料单行新增/修改的表单 */
export function useLineFormSchema(): VbenFormSchema[] {
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
      label: '发料数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        placeholder: '请输入发料数量',
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

/** 发料明细子表的字段 */
export function useDetailGridColumns(
  stockable: boolean,
): VxeTableGridOptions<MesWmOutsourceIssueDetailApi.OutsourceIssueDetail>['columns'] {
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

/** 发料明细新增/修改的表单 */
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
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: true,
      },
      rules: 'selectRequired',
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
      label: '发料仓库',
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
