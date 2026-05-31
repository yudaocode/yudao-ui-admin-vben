import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvSubjectApi } from '#/api/mes/dv/subject';

import { h } from 'vue';

import {
  CommonStatusEnum,
  DICT_TYPE,
  MesAutoCodeRuleCode,
  MesDvSubjectTypeEnum,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改点检保养项目的表单 */
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
      label: '项目编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目编码',
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
                    const code = await generateAutoCode(MesAutoCodeRuleCode.DV_SUBJECT_CODE);
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入项目名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '项目类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE, 'number'),
      },
      rules: z.number().default(MesDvSubjectTypeEnum.CHECK),
    },
    {
      fieldName: 'content',
      label: '项目内容',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入项目内容',
        rows: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'standard',
      label: '标准',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入标准',
        rows: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
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
      label: '项目编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入项目编码',
      },
    },
    {
      fieldName: 'name',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入项目名称',
      },
    },
    {
      fieldName: 'type',
      label: '项目类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE, 'number'),
        placeholder: '请选择项目类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesDvSubjectApi.Subject>['columns'] {
  return [
    {
      field: 'code',
      title: '项目编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '项目名称', minWidth: 140 },
    {
      field: 'type',
      title: '项目类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_SUBJECT_TYPE },
      },
    },
    { field: 'content', title: '项目内容', minWidth: 180 },
    { field: 'standard', title: '标准', minWidth: 180 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
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
