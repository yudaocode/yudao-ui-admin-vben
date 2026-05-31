import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingPlanApi } from '#/api/mes/wm/stocktaking/plan';
import type { MesWmStockTakingTaskApi } from '#/api/mes/wm/stocktaking/task';
import type { MesWmStockTakingTaskLineApi } from '#/api/mes/wm/stocktaking/task/line';
import type { MesWmStockTakingResultApi } from '#/api/mes/wm/stocktaking/task/result';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesWmStockTakingTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { StockTakingPlanSelect } from '#/views/mes/wm/stocktaking/plan/components';
import {
  WmWarehouseAreaSelect,
  WmWarehouseLocationSelect,
  WmWarehouseSelect,
} from '#/views/mes/wm/warehouse/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'execute' | 'submit' | 'update';

/** 表单头部是否只读（提交、执行盘点、详情态） */
function isHeaderReadonly(formType: FormType): boolean {
  return (
    formType === 'detail' ||
    formType === 'execute' ||
    formType === 'submit'
  );
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
      label: '任务编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务编码',
      },
      rules: 'required',
      suffix: headerReadonly
        ? undefined
        : () =>
            h(
              Button,
              {
                type: 'default',
                onClick: async () => {
                  const code = await generateAutoCode(
                    MesAutoCodeRuleCode.WM_STOCK_TAKING_CODE,
                  );
                  await formApi?.setFieldValue('code', code);
                },
              },
              { default: () => '生成' },
            ),
    },
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'planId',
      label: '盘点方案',
      component: markRaw(StockTakingPlanSelect),
      componentProps: {
        // 选择盘点方案后，自动带出名称、类型、起止时间和盲盘/冻结配置
        onChange: async (plan?: MesWmStockTakingPlanApi.StockTakingPlan) => {
          if (!plan) {
            return;
          }
          await formApi?.setValues({
            blindFlag: !!plan.blindFlag,
            endTime: plan.endTime,
            frozen: !!plan.frozen,
            name: plan.name,
            startTime: plan.startTime,
            type: plan.type,
          });
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'type',
      label: '盘点类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE, 'number'),
        placeholder: '请选择盘点类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesWmStockTakingTypeEnum.DYNAMIC,
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择结束时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesWmStockTakingTypeEnum.DYNAMIC,
      },
    },
    {
      fieldName: 'takingDate',
      label: '盘点日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择盘点日期',
        valueFormat: 'YYYY-MM-DD',
      },
      rules: 'required',
    },
    {
      fieldName: 'blindFlag',
      label: '是否盲盘',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'frozen',
      label: '是否冻结库存',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'userId',
      label: '盘点人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择盘点人',
        valueField: 'id',
      },
      rules: 'selectRequired',
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
      fieldName: 'type',
      label: '盘点类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE, 'number'),
        placeholder: '请选择盘点类型',
      },
    },
    {
      fieldName: 'code',
      label: '任务编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入任务编码',
      },
    },
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入任务名称',
      },
    },
    {
      fieldName: 'takingDate',
      label: '盘点日期',
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
        options: getDictOptions(
          DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS,
          'number',
        ),
        placeholder: '请选择单据状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesWmStockTakingTaskApi.StockTakingTask>['columns'] {
  return [
    {
      field: 'code',
      title: '任务编码',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '任务名称',
      minWidth: 160,
    },
    {
      field: 'type',
      title: '盘点类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_STOCK_TAKING_TYPE },
      },
    },
    {
      field: 'planName',
      title: '盘点方案',
      minWidth: 180,
    },
    {
      field: 'takingDate',
      title: '盘点日期',
      minWidth: 180,
      formatter: 'formatDate',
    },
    {
      field: 'userNickname',
      title: '盘点人',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_STOCK_TAKING_TASK_STATUS },
      },
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 盘点任务行列表的字段 */
export function useLineGridColumns(
  editable = true,
): VxeTableGridOptions<MesWmStockTakingTaskLineApi.StockTakingTaskLine>['columns'] {
  return [
    {
      field: 'itemCode',
      title: '物料编码',
      minWidth: 140,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 160,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 90,
    },
    {
      field: 'batchCode',
      title: '批次号',
      minWidth: 120,
    },
    {
      field: 'quantity',
      title: '在库数量',
      width: 120,
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
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS },
      },
    },
    ...(editable
      ? [
          {
            title: '操作',
            width: 80,
            fixed: 'right',
            slots: { default: 'actions' },
          } as const,
        ]
      : []),
  ];
}

/** 盘点结果列表的字段 */
export function useResultGridColumns(
  editable = true,
): VxeTableGridOptions<MesWmStockTakingResultApi.StockTakingResult>['columns'] {
  return [
    {
      field: 'itemCode',
      title: '产品物料编码',
      minWidth: 140,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 160,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unitMeasureName',
      title: '单位名称',
      width: 90,
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
    {
      field: 'quantity',
      title: '数量',
      minWidth: 120,
    },
    {
      field: 'takingQuantity',
      title: '盘点数量',
      minWidth: 120,
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

/** 盘点结果新增/修改的表单 */
export function useResultFormSchema(
  formApi?: VbenFormApi,
  taskLines: MesWmStockTakingTaskLineApi.StockTakingTaskLine[] = [],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'lineId',
      label: '盘点清单',
      component: 'Select',
      componentProps: {
        allowClear: true,
        // 选择盘点清单后，自动带出物料、批次和仓储位置信息
        onChange: async (lineId?: number) => {
          const line = taskLines.find((item) => item.id === lineId);
          await formApi?.setValues({
            areaId: line?.areaId,
            batchCode: line?.batchCode,
            batchId: line?.batchId,
            itemId: line?.itemId,
            locationId: line?.locationId,
            materialStockId: line?.materialStockId,
            warehouseId: line?.warehouseId,
          });
        },
        options: taskLines.map((line) => ({
          label: `${line.itemCode} - ${line.itemName} (${line.warehouseName}${
            line.locationName ? ` / ${line.locationName}` : ''
          }${line.areaName ? ` / ${line.areaName}` : ''})`,
          value: line.id,
        })),
        placeholder: '请选择盘点清单（可选）',
      },
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'itemId',
      label: '物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择物料',
      },
      rules: 'selectRequired',
      // 选中盘点清单后，物料由清单带出且禁止改动
      dependencies: {
        triggerFields: ['lineId'],
        disabled: (values) => values.lineId != null,
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入批次编码',
      },
      // 选中盘点清单后，批次由清单带出且禁止改动
      dependencies: {
        triggerFields: ['lineId'],
        disabled: (values) => values.lineId != null,
      },
    },
    {
      fieldName: 'takingQuantity',
      label: '盘点数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        placeholder: '请输入盘点数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: markRaw(WmWarehouseSelect),
      componentProps: {
        // 仓库变化时清空库区和库位
        onChange: () =>
          formApi?.setValues({
            areaId: undefined,
            locationId: undefined,
          }),
        placeholder: '请选择仓库',
      },
      rules: 'selectRequired',
      // 选中盘点清单后，仓库由清单带出且禁止改动
      dependencies: {
        triggerFields: ['lineId'],
        disabled: (values) => values.lineId != null,
      },
    },
    {
      fieldName: 'locationId',
      label: '库区',
      component: markRaw(WmWarehouseLocationSelect),
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['warehouseId', 'lineId'],
        show: (values) => !!values.warehouseId,
        // 选中盘点清单后，库区由清单带出且禁止改动
        disabled: (values) => values.lineId != null,
        componentProps: (values) => ({
          onChange: () => formApi?.setFieldValue('areaId', undefined),
          placeholder: '请选择库区',
          warehouseId: values.warehouseId,
        }),
      },
    },
    {
      fieldName: 'areaId',
      label: '库位',
      component: markRaw(WmWarehouseAreaSelect),
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['locationId', 'lineId'],
        show: (values) => !!values.locationId,
        // 选中盘点清单后，库位由清单带出且禁止改动
        disabled: (values) => values.lineId != null,
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
