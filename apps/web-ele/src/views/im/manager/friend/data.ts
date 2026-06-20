import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import { UserSelect } from '#/views/system/user/components';

/** 好友关系搜索表单 */
export function useFriendGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户',
      component: markRaw(UserSelect),
    },
    {
      fieldName: 'friendUserId',
      label: '好友',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择好友',
      },
    },
    {
      fieldName: 'status',
      label: '好友状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_FRIEND_STATUS, 'number'),
        placeholder: '请选择好友状态',
      },
    },
    {
      fieldName: 'silent',
      label: '免打扰',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        placeholder: '请选择免打扰状态',
      },
    },
    {
      fieldName: 'addTime',
      label: '添加时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 好友关系列表字段 */
export function useFriendGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      title: '用户',
      minWidth: 180,
      slots: { default: 'user' },
    },
    {
      title: '好友',
      minWidth: 180,
      slots: { default: 'friend' },
    },
    {
      field: 'displayName',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'addSource',
      title: '添加来源',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_FRIEND_ADD_SOURCE },
      },
    },
    {
      field: 'silent',
      title: '免打扰',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'pinned',
      title: '置顶',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'blocked',
      title: '拉黑',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_FRIEND_STATUS },
      },
    },
    {
      field: 'addTime',
      title: '添加时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'deleteTime',
      title: '删除时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 好友申请搜索表单 */
export function useFriendRequestGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'fromUserId',
      label: '发起方',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择发起方',
      },
    },
    {
      fieldName: 'toUserId',
      label: '接收方',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择接收方',
      },
    },
    {
      fieldName: 'handleResult',
      label: '处理结果',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT, 'number'),
        placeholder: '请选择处理结果',
      },
    },
    {
      fieldName: 'addSource',
      label: '添加来源',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_FRIEND_ADD_SOURCE, 'number'),
        placeholder: '请选择添加来源',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 好友申请列表字段 */
export function useFriendRequestGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      title: '发起方',
      minWidth: 180,
      slots: { default: 'fromUser' },
    },
    {
      title: '接收方',
      minWidth: 180,
      slots: { default: 'toUser' },
    },
    {
      field: 'applyContent',
      title: '申请理由',
      minWidth: 160,
    },
    {
      field: 'displayName',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'addSource',
      title: '添加来源',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_FRIEND_ADD_SOURCE },
      },
    },
    {
      field: 'handleResult',
      title: '处理结果',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT },
      },
    },
    {
      field: 'handleContent',
      title: '处理理由',
      minWidth: 140,
    },
    {
      field: 'handleTime',
      title: '处理时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
  ];
}
