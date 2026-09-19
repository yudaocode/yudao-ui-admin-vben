import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOfficialDocTemplateApi } from '#/api/oa/officialdoc/template';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { OaOfficialDocSeparatorType } from '#/views/oa/utils/constants';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入模板名称',
      },
    },
    {
      fieldName: 'authorityName',
      label: '机关/公司名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入机关/公司名称',
      },
    },
    {
      fieldName: 'fontSize',
      label: '名称字号',
      component: 'InputNumber',
      rules: z.number().default(36),
      componentProps: {
        min: 18,
        max: 72,
        class: 'w-full',
      },
    },
    {
      fieldName: 'noPrefix',
      label: '字号前缀',
      component: 'Input',
      componentProps: {
        placeholder: '请输入字号前缀',
      },
    },
    {
      fieldName: 'sealPicUrl',
      label: '印章图片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'separatorType',
      label: '分隔线样式',
      component: 'Select',
      rules: z.number().default(OaOfficialDocSeparatorType.SINGLE),
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_OFFICIAL_DOC_SEPARATOR_TYPE,
          'number',
        ),
        placeholder: '请选择分隔线样式',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      rules: z.number().default(CommonStatusEnum.ENABLE),
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      rules: z.number().default(0),
      componentProps: {
        min: 0,
        class: 'w-full',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模板名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions<OaOfficialDocTemplateApi.OfficialDocTemplate>['columns'] {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'name',
      title: '模板名称',
      minWidth: 120,
    },
    {
      field: 'authorityName',
      title: '机关/公司名称',
      minWidth: 160,
    },
    {
      field: 'noPrefix',
      title: '字号前缀',
      minWidth: 120,
    },
    {
      field: 'separatorType',
      title: '分隔线样式',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_OFFICIAL_DOC_SEPARATOR_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'sort',
      title: '排序',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 190,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
