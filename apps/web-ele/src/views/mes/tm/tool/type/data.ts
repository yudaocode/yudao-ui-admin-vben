import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesMaintenTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改工具类型的表单 */
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
      label: '类型编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入类型编码',
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
                    const code = await generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_TYPE_CODE);
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '类型名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入类型名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'codeFlag',
      label: '是否编码管理',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
      rules: z.boolean().default(true),
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
      dependencies: {
        triggerFields: ['codeFlag'],
        show: (values) => !!values.codeFlag,
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'maintenPeriod',
      label: '保养周期',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        precision: 0,
      },
      dependencies: {
        triggerFields: ['codeFlag', 'maintenType'],
        show: (values) =>
          !!values.codeFlag &&
          [MesMaintenTypeEnum.REGULAR, MesMaintenTypeEnum.USAGE].includes(values.maintenType),
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
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
      label: '类型编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入类型编码',
      },
    },
    {
      fieldName: 'name',
      label: '类型名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入类型名称',
      },
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesTmToolTypeApi.ToolType>['columns'] {
  return [
    {
      field: 'code',
      title: '类型编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '类型名称', minWidth: 150 },
    {
      field: 'codeFlag',
      title: '编码管理',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
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
      field: 'maintenPeriod',
      title: '保养周期',
      width: 100,
      formatter: ({ row }) => {
        if (row.maintenPeriod == null) {
          return '-';
        }
        if (row.maintenType === MesMaintenTypeEnum.REGULAR) {
          return `${row.maintenPeriod} 天`;
        }
        if (row.maintenType === MesMaintenTypeEnum.USAGE) {
          return `${row.maintenPeriod} 次`;
        }
        return '-';
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
