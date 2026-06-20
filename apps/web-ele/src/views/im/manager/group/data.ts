import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import { GroupSelect } from '#/views/im/manager/group/components';
import { UserSelect } from '#/views/system/user/components';

/** 群搜索表单 */
export function useGroupGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '群名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入群名称',
      },
    },
    {
      fieldName: 'ownerUserId',
      label: '群主',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择群主',
      },
    },
    {
      fieldName: 'status',
      label: '群状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_GROUP_STATUS, 'number'),
        placeholder: '请选择群状态',
      },
    },
    {
      fieldName: 'banned',
      label: '是否封禁',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        placeholder: '请选择封禁状态',
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

/** 群列表字段 */
export function useGroupGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      field: 'avatar',
      title: '头像',
      width: 80,
      slots: { default: 'avatar' },
    },
    {
      field: 'name',
      title: '群名称',
      minWidth: 160,
    },
    {
      title: '群主',
      minWidth: 180,
      slots: { default: 'owner' },
    },
    {
      field: 'memberCount',
      title: '成员数',
      width: 90,
    },
    {
      field: 'status',
      title: '群状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_GROUP_STATUS },
      },
    },
    {
      field: 'banned',
      title: '封禁状态',
      width: 120,
      slots: { default: 'banned' },
    },
    {
      field: 'mutedAll',
      title: '全群禁言',
      width: 100,
      slots: { default: 'mutedAll' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 320,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 加群申请搜索表单 */
export function useGroupRequestGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'groupId',
      label: '群',
      component: markRaw(GroupSelect),
    },
    {
      fieldName: 'userId',
      label: '申请人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择申请人',
      },
    },
    {
      fieldName: 'inviterUserId',
      label: '邀请人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择邀请人',
      },
    },
    {
      fieldName: 'handleResult',
      label: '处理结果',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT, 'number'),
        placeholder: '请选择处理结果',
      },
    },
    {
      fieldName: 'addSource',
      label: '加入来源',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_GROUP_ADD_SOURCE, 'number'),
        placeholder: '请选择加入来源',
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

/** 加群申请列表字段 */
export function useGroupRequestGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      title: '群',
      minWidth: 180,
      slots: { default: 'group' },
    },
    {
      title: '申请人 / 被邀请人',
      minWidth: 200,
      slots: { default: 'user' },
    },
    {
      title: '邀请人',
      minWidth: 180,
      slots: { default: 'inviter' },
    },
    {
      field: 'applyContent',
      title: '申请理由',
      minWidth: 160,
    },
    {
      field: 'addSource',
      title: '加入来源',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_GROUP_ADD_SOURCE },
      },
    },
    {
      field: 'handleResult',
      title: '处理结果',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT },
      },
    },
    {
      title: '处理人',
      minWidth: 180,
      slots: { default: 'handler' },
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
