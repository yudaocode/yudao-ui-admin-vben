import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMessageApi } from '#/api/mp/message';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'accountId',
      label: '公众号',
      component: 'Input',
    },
    {
      fieldName: 'type',
      label: '消息类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择消息类型',
        options: getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE),
        allowClear: true,
      },
    },
    {
      fieldName: 'openid',
      label: '用户标识',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户标识',
        allowClear: true,
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MpMessageApi.Message>['columns'] {
  return [
    {
      field: 'createTime',
      title: '发送时间',
      width: 180,
      align: 'center',
      slots: { default: 'createTime' },
    },
    {
      field: 'type',
      title: '消息类型',
      width: 80,
      align: 'center',
    },
    {
      field: 'sendFrom',
      title: '发送方',
      width: 80,
      align: 'center',
      slots: { default: 'sendFrom' },
    },
    {
      field: 'openid',
      title: '用户标识',
      width: 300,
      align: 'center',
    },
    {
      field: 'content',
      title: '内容',
      align: 'left',
      minWidth: 320,
      slots: { default: 'content' },
    },
    {
      field: 'actions',
      title: '操作',
      width: 120,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
