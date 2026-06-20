import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getRangePickerDefaultProps } from '#/utils';
import { ChannelSelect } from '#/views/im/manager/channel/list/components';

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
      fieldName: 'channelId',
      label: '所属频道',
      component: markRaw(ChannelSelect),
      rules: 'selectRequired',
    },
    {
      fieldName: 'type',
      label: '内容类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IM_CHANNEL_MATERIAL_TYPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        maxlength: 128,
        placeholder: '请输入标题',
      },
      rules: 'required',
    },
    {
      fieldName: 'coverUrl',
      label: '封面图',
      component: 'ImageUpload',
      componentProps: {
        maxNumber: 1,
      },
    },
    {
      fieldName: 'summary',
      label: '摘要',
      component: 'TextArea',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入摘要',
        rows: 2,
      },
    },
    {
      fieldName: 'content',
      label: '正文',
      component: 'RichTextarea',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === 1,
      },
    },
    {
      fieldName: 'url',
      label: '跳转链接',
      component: 'Input',
      componentProps: {
        placeholder: 'https://example.com/...',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type !== 1,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'channelId',
      label: '频道',
      component: markRaw(ChannelSelect),
      componentProps: {
        placeholder: '全部',
      },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '标题关键字',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 80,
    },
    {
      field: 'coverUrl',
      title: '封面',
      width: 80,
      slots: { default: 'cover' },
    },
    {
      field: 'channelName',
      title: '频道',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '内容类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_CHANNEL_MATERIAL_TYPE },
      },
    },
    {
      field: 'title',
      title: '标题',
      minWidth: 180,
    },
    {
      field: 'summary',
      title: '摘要',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 频道消息搜索表单 */
export function useMessageGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'channelId',
      label: '频道',
      component: markRaw(ChannelSelect),
      componentProps: {
        placeholder: '全部',
      },
    },
    {
      fieldName: 'sendTime',
      label: '发送时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 频道消息字段 */
export function useMessageGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 80,
    },
    {
      field: 'materialCoverUrl',
      title: '封面',
      width: 80,
      slots: { default: 'cover' },
    },
    {
      field: 'channelName',
      title: '频道',
      minWidth: 120,
    },
    {
      field: 'materialTitle',
      title: '素材标题',
      minWidth: 180,
    },
    {
      field: 'receiverUserIds',
      title: '接收人',
      width: 120,
      slots: { default: 'receivers' },
    },
    {
      field: 'sendTime',
      title: '发送时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
