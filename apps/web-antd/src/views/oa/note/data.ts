import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import {
  OA_NOTE_SCENE_TYPE,
  OA_NOTE_TYPE,
  OA_PRIORITY,
} from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

import OaNoteCategorySelect from './components/category-select.vue';

/** 新增/修改笔记的表单 */
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
      label: '笔记类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_NOTE_TYPE, 'number'),
        placeholder: '请选择笔记类型',
      },
      rules: z.number().default(OA_NOTE_TYPE.MINE),
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        // 笔记优先级只开放一般和重要
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number').filter(
          (item) => Number(item.value) <= OA_PRIORITY.IMPORTANT,
        ),
        placeholder: '请选择优先级',
      },
      rules: z.number().default(OA_PRIORITY.NORMAL),
    },
    {
      fieldName: 'categoryId',
      label: '笔记目录',
      component: markRaw(OaNoteCategorySelect),
      // OaNoteCategorySelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
    },
    {
      fieldName: 'title',
      label: '笔记标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showCount: true,
        placeholder: '请输入笔记标题',
      },
      formItemClass: 'col-span-3',
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '笔记内容',
      component: 'RichTextarea',
      componentProps: {
        height: 280,
      },
      formItemClass: 'col-span-3',
      // 空段落标签不算有效内容，附件图片除外
      rules: z
        .string({ message: '笔记内容不能为空' })
        .refine(
          (value) =>
            value.replace(/<[^>]*>/g, '').trim().length > 0 ||
            value.includes('<img'),
          { message: '笔记内容不能为空' },
        )
        .refine((value) => value.replace(/<[^>]*>/g, '').trim().length >= 10, {
          message: '笔记内容不能少于 10 个字',
        }),
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      formItemClass: 'col-span-3',
    },
  ];
}

/** 共享笔记的表单 */
export function useShareFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '笔记标题',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'receiverUserIds',
      label: '共享给',
      component: markRaw(UserSelect),
      // UserSelect 使用 modelValue 绑定，antd 适配层默认 v-model:value
      modelPropName: 'modelValue',
      componentProps: {
        multiple: true,
        placeholder: '请选择共享接收人',
      },
    },
  ];
}

/** 新增/修改笔记目录的表单 */
export function useCategoryFormSchema(): VbenFormSchema[] {
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
      label: '目录名称',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入目录名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        class: '!w-full',
        placeholder: '请输入显示排序',
      },
      rules: z.number().default(0),
    },
  ];
}

/** 笔记目录管理的表格列配置 */
export function useCategoryColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '目录名称',
      minWidth: 180,
    },
    {
      field: 'sort',
      title: '排序',
      width: 100,
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'scene',
      label: '笔记场景',
      component: 'RadioGroup',
      defaultValue: OA_NOTE_SCENE_TYPE.MINE,
      componentProps: {
        optionType: 'button',
        buttonStyle: 'solid',
        options: [
          { label: '我的笔记', value: OA_NOTE_SCENE_TYPE.MINE },
          { label: '共享给我', value: OA_NOTE_SCENE_TYPE.SHARED },
        ],
      },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入笔记标题',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        // 笔记优先级只开放一般和重要
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number').filter(
          (item) => Number(item.value) <= OA_PRIORITY.IMPORTANT,
        ),
        allowClear: true,
        placeholder: '请选择优先级',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'favorite',
      label: '收藏',
      component: 'Select',
      componentProps: {
        options: [
          { label: '已收藏', value: true },
          { label: '未收藏', value: false },
        ],
        allowClear: true,
        placeholder: '请选择收藏状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(
  scene: number,
): VxeTableGridOptions['columns'] {
  const isMine = scene === OA_NOTE_SCENE_TYPE.MINE;
  return [
    ...(isMine ? [{ type: 'checkbox', width: 40 }] : []),
    {
      field: 'favorite',
      title: '收藏',
      width: 65,
      align: 'center',
      slots: { default: 'favorite' },
    },
    {
      field: 'title',
      title: '标题',
      minWidth: 200,
      slots: { default: 'title' },
    },
    {
      field: 'categoryName',
      title: '目录',
      width: 120,
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_NOTE_TYPE },
      },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PRIORITY },
      },
    },
    {
      field: 'creatorUserName',
      title: '创建人',
      width: 120,
    },
    {
      field: 'receiverUserNames',
      title: '共享给',
      minWidth: 160,
      slots: { default: 'receiverUserNames' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ] as VxeTableGridOptions['columns'];
}

/** 笔记详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'title',
      label: '笔记标题',
    },
    {
      field: 'creatorUserName',
      label: '创建人',
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'categoryName',
      label: '笔记目录',
    },
    {
      field: 'type',
      label: '笔记类型',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_NOTE_TYPE, value }),
    },
    {
      field: 'priority',
      label: '优先级',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_PRIORITY, value }),
    },
    {
      field: 'receiverUserNames',
      label: '共享给',
      render: (value) => (value?.length ? value.join('、') : '-'),
    },
    {
      field: 'content',
      label: '笔记内容',
      slot: 'content',
    },
    {
      field: 'fileUrls',
      label: '附件',
      slot: 'fileUrls',
    },
  ];
}
