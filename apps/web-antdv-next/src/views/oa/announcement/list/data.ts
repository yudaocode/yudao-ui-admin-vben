import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import {
  OA_ANNOUNCEMENT_TYPE,
  OA_PRIORITY,
} from '#/views/oa/utils/constants';

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
      label: '公告类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ANNOUNCEMENT_TYPE, 'number'),
        placeholder: '请选择公告类型',
      },
      rules: z.number().default(OA_ANNOUNCEMENT_TYPE.ANNOUNCEMENT),
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'),
        placeholder: '请选择优先级',
      },
      rules: z.number().default(OA_PRIORITY.NORMAL),
    },
    {
      fieldName: 'top',
      label: '置顶',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'title',
      label: '公告标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showCount: true,
        placeholder: '请输入公告标题',
      },
      formItemClass: 'col-span-3',
      rules: 'required',
    },
    {
      fieldName: 'url',
      label: '相关链接',
      component: 'Input',
      componentProps: {
        maxlength: 512,
        placeholder: '请输入相关链接（可选）',
      },
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'content',
      label: '公告内容',
      component: 'RichTextarea',
      componentProps: {
        height: 300,
      },
      formItemClass: 'col-span-3',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '公告标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入公告标题',
      },
    },
    {
      fieldName: 'type',
      label: '公告类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ANNOUNCEMENT_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择公告类型',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'),
        allowClear: true,
        placeholder: '请选择优先级',
      },
    },
    {
      fieldName: 'createTime',
      label: '发布时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'top',
      title: '置顶',
      width: 70,
      align: 'center',
      slots: { default: 'topTag' },
    },
    {
      field: 'title',
      title: '公告标题',
      minWidth: 220,
      slots: { default: 'title' },
    },
    {
      field: 'type',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_ANNOUNCEMENT_TYPE },
      },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PRIORITY },
      },
    },
    {
      field: 'publisherUserName',
      title: '发布人',
      minWidth: 120,
    },
    {
      field: 'publisherDeptName',
      title: '所属部门',
      minWidth: 140,
    },
    {
      field: 'createTime',
      title: '发布时间',
      width: 180,
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

/** 公告详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'title',
      label: '公告标题',
    },
    {
      field: 'publisherUserName',
      label: '发布人',
    },
    {
      field: 'createTime',
      label: '发布时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'publisherDeptName',
      label: '所属部门',
    },
    {
      field: 'type',
      label: '公告类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_ANNOUNCEMENT_TYPE, value }),
    },
    {
      field: 'priority',
      label: '优先级',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_PRIORITY, value }),
    },
    {
      field: 'content',
      label: '公告内容',
      slot: 'content',
    },
    {
      field: 'url',
      label: '相关链接',
      slot: 'url',
    },
  ];
}
