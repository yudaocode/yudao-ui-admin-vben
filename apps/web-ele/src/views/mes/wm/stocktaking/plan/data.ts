import type { NumberDictDataType } from '@vben/hooks';

import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmStockTakingPlanApi } from '#/api/mes/wm/stocktaking/plan';
import type { MesWmStockTakingPlanParamApi } from '#/api/mes/wm/stocktaking/plan/param';

import { h, markRaw } from 'vue';

import {
  CommonStatusEnum,
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesWmStockTakingTypeEnum,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

import { StockTakingPlanConditionValueInput } from './components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

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
      fieldName: 'code',
      label: '方案编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案编码',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(
                      MesAutoCodeRuleCode.WM_STOCK_TAKING_PLAN_CODE,
                    );
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案名称',
      },
      rules: 'required',
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
        type: 'datetime',
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
        type: 'datetime',
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === MesWmStockTakingTypeEnum.DYNAMIC,
      },
    },
    {
      fieldName: 'blindFlag',
      label: '是否盲盘',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'frozen',
      label: '冻结库存',
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否',
        inlinePrompt: true,
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

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '方案编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入方案编码',
      },
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入方案名称',
      },
    },
    {
      fieldName: 'type',
      label: '盘点类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE, 'number'),
        placeholder: '请选择盘点类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: MesWmStockTakingPlanApi.StockTakingPlan,
  ) => Promise<boolean | undefined>,
): VxeTableGridOptions<MesWmStockTakingPlanApi.StockTakingPlan>['columns'] {
  return [
    {
      field: 'code',
      title: '方案编码',
      minWidth: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '方案名称',
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
      field: 'startTime',
      title: '开始时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'blindFlag',
      title: '是否盲盘',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'frozen',
      title: '是否冻结库存',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          activeValue: CommonStatusEnum.ENABLE,
          inactiveValue: CommonStatusEnum.DISABLE,
        },
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 盘点方案条件列表的字段 */
export function useParamGridColumns(
  editable = true,
): VxeTableGridOptions<MesWmStockTakingPlanParamApi.StockTakingPlanParam>['columns'] {
  return [
    {
      field: 'type',
      title: '条件类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE },
      },
    },
    {
      field: 'valueCode',
      title: '条件值编码',
      minWidth: 140,
    },
    {
      field: 'valueName',
      title: '条件值名称',
      minWidth: 160,
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

/** 盘点方案条件表单 schema */
export function useParamFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '条件类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(
          DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE,
          'number',
        ) as NumberDictDataType[],
        placeholder: '请选择条件类型',
        // 条件类型变化：清空已选条件值，避免残留旧类型的条件值
        onChange: async () => {
          await formApi?.setValues({
            valueCode: '',
            valueId: undefined,
            valueName: '',
          });
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'valueId',
      label: '条件值',
      component: markRaw(StockTakingPlanConditionValueInput),
      // 条件值控件内部按条件类型切换选择器，仅选择类型后展示
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type != null,
        componentProps: (values) => ({
          type: values.type,
          valueCode: values.valueCode,
          // 条件值控件回填 valueId / valueCode / valueName
          onValueChange: async (payload: {
            valueCode?: string;
            valueId?: number;
            valueName?: string;
          }) => {
            await formApi?.setValues({
              valueCode: payload.valueCode ?? '',
              valueId: payload.valueId,
              valueName: payload.valueName ?? '',
            });
          },
        }),
      },
    },
    {
      // 条件值编码：由条件值控件回写，隐藏字段
      fieldName: 'valueCode',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      // 条件值名称：由条件值控件回写，隐藏字段
      fieldName: 'valueName',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
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

/** 选择弹窗的搜索表单 */
export function useSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '方案编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入方案编码',
      },
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入方案名称',
      },
    },
    {
      fieldName: 'type',
      label: '盘点类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE, 'number'),
        placeholder: '请选择盘点类型',
      },
    },
  ];
}

/** 选择弹窗的字段 */
export function useSelectGridColumns(
  multiple = true,
): VxeTableGridOptions<MesWmStockTakingPlanApi.StockTakingPlan>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '方案编码',
      width: 200,
    },
    {
      field: 'name',
      title: '方案名称',
      minWidth: 150,
    },
    {
      field: 'type',
      title: '盘点类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_WM_STOCK_TAKING_TYPE },
      },
    },
    {
      field: 'startTime',
      title: '开始时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'blindFlag',
      title: '是否盲盘',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'frozen',
      title: '是否冻结库存',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
  ];
}
