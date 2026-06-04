import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProProcessApi } from '#/api/mes/pro/process';
import type { MesProProcessContentApi } from '#/api/mes/pro/process/content';

import { h } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改生产工序的表单 */
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
      label: '工序编码',
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入工序编码',
      },
      rules: z.string().min(1, '工序编码不能为空').max(64),
      suffix: () =>
        h(
          ElButton,
          {
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.PRO_PROCESS_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '工序名称',
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入工序名称',
      },
      rules: z.string().min(1, '工序名称不能为空').max(100),
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
      fieldName: 'attention',
      label: '工序说明',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        maxLength: 500,
        placeholder: '请输入工序说明',
        rows: 3,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        maxLength: 250,
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
      label: '工序编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入工序编码',
      },
    },
    {
      fieldName: 'name',
      label: '工序名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入工序名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProProcessApi.Process>['columns'] {
  return [
    {
      field: 'code',
      title: '工序编码',
      minWidth: 150,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '工序名称', minWidth: 180 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    { field: 'remark', title: '备注', minWidth: 180 },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}

/** 工序内容（操作步骤）表单 */
export function useContentFormSchema(): VbenFormSchema[] {
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
      fieldName: 'processId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'sort',
      label: '序号',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        max: 999,
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'content',
      label: '步骤说明',
      component: 'Textarea',
      componentProps: {
        maxLength: 500,
        placeholder: '请输入步骤说明',
        rows: 3,
      },
    },
    {
      fieldName: 'device',
      label: '辅助设备',
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入辅助设备',
      },
    },
    {
      fieldName: 'material',
      label: '辅助材料',
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入辅助材料',
      },
    },
    {
      fieldName: 'docUrl',
      label: '材料文档 URL',
      component: 'Input',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入材料文档 URL',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 工序内容列表的字段 */
export function useContentGridColumns(): VxeTableGridOptions<MesProProcessContentApi.ProcessContent>['columns'] {
  return [
    { field: 'sort', title: '序号', width: 80, align: 'center' },
    { field: 'content', title: '步骤说明', minWidth: 220 },
    { field: 'device', title: '辅助设备', width: 150 },
    { field: 'material', title: '辅助材料', width: 150 },
    { field: 'docUrl', title: '材料文档', minWidth: 180 },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
