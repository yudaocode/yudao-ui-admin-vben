import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getRangePickerDefaultProps } from '#/utils';
import { OA_PLAN_STATUS, OA_PLAN_TYPE } from '#/views/oa/utils/constants';

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
      fieldName: 'type',
      label: '计划类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PLAN_TYPE, 'number'),
        placeholder: '请选择计划类型',
      },
      rules: z.number().default(OA_PLAN_TYPE.DAY),
    },
    {
      fieldName: 'status',
      label: '计划状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PLAN_STATUS, 'number'),
        placeholder: '请选择计划状态',
      },
      rules: z.number().default(OA_PLAN_STATUS.UNFINISHED),
    },
    {
      fieldName: 'title',
      label: '计划标题',
      component: 'Input',
      componentProps: {
        maxlength: 50,
        showWordLimit: true,
        placeholder: '请输入计划标题',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'label',
      label: '计划标签',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '例如：重点、销售',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择开始时间',
        class: '!w-full',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择结束时间',
        class: '!w-full',
      },
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '计划内容',
      component: 'Textarea',
      componentProps: {
        rows: 5,
        placeholder: '请输入计划内容',
      },
      formItemClass: 'col-span-2',
      rules: z
        .string({ message: '计划内容不能为空' })
        .min(20, '计划内容不能少于 20 个字符'),
    },
    {
      fieldName: 'summary',
      label: '计划总结',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: '请输入计划总结',
      },
      formItemClass: 'col-span-2',
      rules: z
        .string()
        .optional()
        .refine((value) => !value || value.trim().length >= 20, {
          message: '计划总结不能少于 20 个字符',
        }),
    },
    {
      fieldName: 'comment',
      label: '计划点评',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        readonly: true,
        placeholder: '暂无点评',
      },
      formItemClass: 'col-span-2',
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !!values.id,
      },
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 1,
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '计划标题',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入计划标题',
      },
    },
    {
      fieldName: 'label',
      label: '计划标签',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入计划标签',
      },
    },
    {
      fieldName: 'type',
      label: '计划类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PLAN_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择计划类型',
      },
    },
    {
      fieldName: 'status',
      label: '计划状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PLAN_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择计划状态',
      },
    },
    {
      fieldName: 'createTime',
      label: '发布时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'title',
      title: '计划标题',
      minWidth: 180,
    },
    {
      field: 'label',
      title: '标签',
      width: 120,
    },
    {
      field: 'type',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PLAN_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PLAN_STATUS },
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
      field: 'createTime',
      title: '发布时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'userName',
      title: '发布人',
      width: 110,
    },
    {
      field: 'deptName',
      title: '部门',
      width: 120,
    },
    {
      field: 'comment',
      title: '点评',
      minWidth: 180,
      slots: { default: 'comment' },
    },
    {
      field: 'fileUrls',
      title: '附件',
      width: 80,
      align: 'center',
      slots: { default: 'fileUrls' },
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
