import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmProductIssueApi } from '#/api/mes/wm/productissue';
import type { MesWmProductIssueDetailApi } from '#/api/mes/wm/productissue/detail';
import type { MesWmProductIssueLineApi } from '#/api/mes/wm/productissue/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
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
      label: '领料单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入领料单编号',
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
                    MesAutoCodeRuleCode.WM_PRODUCT_ISSUE_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '领料单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入领料单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'requiredTime',
      label: '需求时间',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择需求时间',
        showTime: true,
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
      rules: 'selectRequired',
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
      label: '领料单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入领料单编号',
      },
    },
    {
      fieldName: 'name',
      label: '领料单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入领料单名称',
      },
    },
    {
      fieldName: 'issueDate',
      label: '领料日期',
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
        options: getDictOptions(DICT_TYPE.MES_WM_PRODUCT_ISSUE_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmProductIssueApi.ProductIssue>['columns'] {
  return [
    {
      field: 'code',
      title: '领料单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '领料单名称',
      minWidth: 150,
    },
    {
      field: 'workOrderCode',
      title: '生产工单',
      minWidth: 140,
    },
    {
      field: 'workstationName',
      title: '工作站',
      minWidth: 120,
    },
    {
      field: 'requiredTime',
      title: '需求时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_PRODUCT_ISSUE_STATUS },
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

/** 领料单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmProductIssueLineApi.ProductIssueLine>['columns'] {
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

/** 领料单行新增/修改的表单 */
export function useLineFormSchema(): VbenFormSchema[] {
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
      label: '领料数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入领料数量',
        precision: 2,
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

/** 拣货明细子表的字段 */
export function useDetailGridColumns(
  stockable: boolean,
): VxeTableGridOptions<MesWmProductIssueDetailApi.ProductIssueDetail>['columns'] {
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
