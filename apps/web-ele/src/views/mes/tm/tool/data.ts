import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesTmToolApi } from '#/api/mes/tm/tool';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import {
  MesAutoCodeRuleCode,
  MesMaintenTypeEnum,
  MesToolStatusEnum,
} from '#/views/mes/utils/constants';

import { TmToolTypeSelect } from './type/components';

/** 新增/修改工具的表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
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
      label: '工具编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入工具编码',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({ disabled: !!values.id }),
      },
      rules: 'required',
      suffix: () =>
        h(
          ElButton,
          {
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_CODE);
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '工具名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入工具名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'toolTypeId',
      label: '工具类型',
      component: markRaw(TmToolTypeSelect),
      componentProps: {
        placeholder: '请选择工具类型',
        onChange: async (row: any) => {
          if (row?.codeFlag) {
            await formApi?.setFieldValue('quantity', 1);
            await formApi?.setFieldValue('availableQuantity', 1);
          }
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'brand',
      label: '品牌',
      component: 'Input',
      componentProps: {
        placeholder: '请输入品牌',
      },
    },
    {
      fieldName: 'specification',
      label: '型号规格',
      component: 'Input',
      componentProps: {
        placeholder: '请输入型号规格',
      },
    },
    {
      fieldName: 'quantity',
      label: '库存数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        onChange: async (value?: number) => {
          const values = (await formApi?.getValues()) as MesTmToolApi.Tool | undefined;
          if (!values?.id) {
            await formApi?.setFieldValue('availableQuantity', value);
          }
        },
        precision: 0,
      },
      rules: 'required',
    },
    {
      fieldName: 'availableQuantity',
      label: '可用数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        disabled: true,
        min: 0,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_TM_TOOL_STATUS, 'number'),
      },
      rules: z.number().default(MesToolStatusEnum.STORE),
    },
    {
      fieldName: 'maintenType',
      label: '保养维护类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_TM_MAINTEN_TYPE, 'number'),
        placeholder: '请选择保养维护类型',
      },
    },
    {
      fieldName: 'nextMaintenDate',
      label: '下次保养日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['maintenType'],
        show: (values) => values.maintenType === MesMaintenTypeEnum.REGULAR,
      },
    },
    {
      fieldName: 'nextMaintenPeriod',
      label: '下次保养周期',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        precision: 0,
      },
      dependencies: {
        triggerFields: ['maintenType'],
        show: (values) => values.maintenType === MesMaintenTypeEnum.USAGE,
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
      label: '工具编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入工具编码',
      },
    },
    {
      fieldName: 'name',
      label: '工具名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入工具名称',
      },
    },
    {
      fieldName: 'brand',
      label: '品牌',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入品牌',
      },
    },
    {
      fieldName: 'specification',
      label: '型号规格',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入型号规格',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_TM_TOOL_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesTmToolApi.Tool>['columns'] {
  return [
    {
      field: 'code',
      title: '工具编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '工具名称', minWidth: 150 },
    { field: 'toolTypeName', title: '工具类型', minWidth: 140 },
    { field: 'brand', title: '品牌', minWidth: 120 },
    { field: 'specification', title: '型号规格', minWidth: 140 },
    { field: 'quantity', title: '库存数量', width: 100 },
    { field: 'availableQuantity', title: '可用数量', width: 100 },
    {
      field: 'maintenType',
      title: '保养维护类型',
      width: 140,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_TM_MAINTEN_TYPE },
      },
    },
    {
      field: 'nextMaintenDate',
      title: '下次保养',
      width: 180,
      formatter: ({ row }) => {
        if (row.maintenType === MesMaintenTypeEnum.REGULAR) {
          return row.nextMaintenDate ? formatDateTime(row.nextMaintenDate) : '-';
        }
        if (row.maintenType === MesMaintenTypeEnum.USAGE) {
          return row.nextMaintenPeriod == null ? '-' : `${row.nextMaintenPeriod} 次`;
        }
        return '-';
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_TM_TOOL_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}
