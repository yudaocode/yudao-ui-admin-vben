import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';
import type { MesWmReturnIssueApi } from '#/api/mes/wm/returnissue';
import type { MesWmReturnIssueDetailApi } from '#/api/mes/wm/returnissue/detail';
import type { MesWmReturnIssueLineApi } from '#/api/mes/wm/returnissue/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProWorkOrderStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
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

/** 表单头部是否只读（上架、详情、执行退料态） */
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
      label: '退料单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入退料单编号',
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
                    MesAutoCodeRuleCode.WM_RETURN_ISSUE_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '退料单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入退料单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '退料类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE, 'number'),
        placeholder: '请选择退料类型',
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
      fieldName: 'returnDate',
      label: '退料日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择退料日期',
        showTime: true,
        valueFormat: 'x',
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
      label: '退料单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入退料单编号',
      },
    },
    {
      fieldName: 'name',
      label: '退料单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入退料单名称',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
      },
    },
    {
      fieldName: 'type',
      label: '退料类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE, 'number'),
        placeholder: '请选择退料类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmReturnIssueApi.ReturnIssue>['columns'] {
  return [
    {
      field: 'code',
      title: '退料单编号',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '退料单名称',
      minWidth: 150,
    },
    {
      field: 'type',
      title: '退料类型',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_RETURN_ISSUE_TYPE },
      },
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
      field: 'returnDate',
      title: '退料日期',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_RETURN_ISSUE_STATUS },
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

/** 退料单行子表的字段 */
export function useLineGridColumns(
  editable: boolean,
  stockable: boolean,
): VxeTableGridOptions<MesWmReturnIssueLineApi.ReturnIssueLine>['columns'] {
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
      title: '退料数量',
      width: 100,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'rqcCheckFlag',
      title: '是否检测',
      width: 100,
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
            width: 200,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 退料单行新增/修改的表单 */
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
      label: '退料数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入退料数量',
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['quantityMax'],
        componentProps: (values) => ({
          class: '!w-full',
          max: values.quantityMax,
          min: 0,
          placeholder: '请输入退料数量',
          precision: 2,
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
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        disabled: true,
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
): VxeTableGridOptions<MesWmReturnIssueDetailApi.ReturnIssueDetail>['columns'] {
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
      rules: 'selectRequired',
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
        virtualFilter: 'only',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['itemId'],
        componentProps: (values) => ({
          itemId: values.itemId,
          virtualFilter: 'only',
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
      label: '入库仓库',
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
