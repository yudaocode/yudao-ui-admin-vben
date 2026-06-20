import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import { GroupSelect } from '#/views/im/manager/group/components';
import { UserSelect } from '#/views/system/user/components';

/** 私聊消息搜索表单 */
export function usePrivateGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'senderId',
      label: '发送人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择发送人',
      },
    },
    {
      fieldName: 'receiverId',
      label: '接收人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择接收人',
      },
    },
    {
      fieldName: 'type',
      label: '内容类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_CONTENT_TYPE, 'number'),
        placeholder: '请选择内容类型',
      },
    },
    {
      fieldName: 'content',
      label: '消息内容',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入消息内容',
      },
    },
    {
      fieldName: 'sendTime',
      label: '发送时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 私聊消息字段 */
export function usePrivateGridColumns(showReadColumns: boolean): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      title: '发送人',
      minWidth: 160,
      slots: { default: 'sender' },
    },
    {
      title: '接收人',
      minWidth: 160,
      slots: { default: 'receiver' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_CONTENT_TYPE },
      },
    },
    {
      title: '内容预览',
      minWidth: 260,
      align: 'left',
      slots: { default: 'content' },
    },
    ...(showReadColumns
      ? [
          {
            field: 'status',
            title: '状态',
            width: 100,
            cellRender: {
              name: 'CellDict',
              props: { type: DICT_TYPE.IM_MESSAGE_STATUS },
            },
          },
          {
            field: 'receiptStatus',
            title: '回执',
            width: 110,
            cellRender: {
              name: 'CellDict',
              // 回执状态（私聊 / 群聊共用 im_message_receipt_status），与源端「回执」列对齐
              props: { type: DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS },
            },
          },
        ]
      : []),
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

/** 群聊消息搜索表单 */
export function useGroupGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'groupId',
      label: '群',
      component: markRaw(GroupSelect),
    },
    {
      fieldName: 'senderId',
      label: '发送人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择发送人',
      },
    },
    {
      fieldName: 'type',
      label: '内容类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_CONTENT_TYPE, 'number'),
        placeholder: '请选择内容类型',
      },
    },
    {
      fieldName: 'content',
      label: '消息内容',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入消息内容',
      },
    },
    {
      fieldName: 'sendTime',
      label: '发送时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 群聊消息字段 */
export function useGroupGridColumns(showReadColumns: boolean): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      title: '群',
      minWidth: 160,
      slots: { default: 'group' },
    },
    {
      title: '发送人',
      minWidth: 160,
      slots: { default: 'sender' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_CONTENT_TYPE },
      },
    },
    {
      title: '@用户',
      minWidth: 180,
      slots: { default: 'atUsers' },
    },
    {
      title: '内容预览',
      minWidth: 260,
      align: 'left',
      slots: { default: 'content' },
    },
    ...(showReadColumns
      ? [
          {
            field: 'status',
            title: '状态',
            width: 100,
            cellRender: {
              name: 'CellDict',
              props: { type: DICT_TYPE.IM_MESSAGE_STATUS },
            },
          },
          {
            field: 'receiptStatus',
            title: '回执',
            width: 110,
            cellRender: {
              name: 'CellDict',
              props: { type: DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS },
            },
          },
        ]
      : []),
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
