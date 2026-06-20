import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import { UserSelect } from '#/views/system/user/components';

/** 通话记录搜索表单 */
export function useRtcGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'inviterUserId',
      label: '发起人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择发起人',
      },
    },
    {
      fieldName: 'conversationType',
      label: '会话类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE, 'number'),
        placeholder: '请选择会话类型',
      },
    },
    {
      fieldName: 'mediaType',
      label: '媒体类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE, 'number'),
        placeholder: '请选择媒体类型',
      },
    },
    {
      fieldName: 'status',
      label: '通话状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_RTC_CALL_STATUS, 'number'),
        placeholder: '请选择通话状态',
      },
    },
    {
      fieldName: 'endReason',
      label: '结束原因',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.IM_RTC_CALL_END_REASON, 'number'),
        placeholder: '请选择结束原因',
      },
    },
    {
      fieldName: 'startTime',
      label: '发起时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 通话记录字段 */
export function useRtcGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 100,
    },
    {
      title: '发起人',
      minWidth: 160,
      slots: { default: 'inviter' },
    },
    {
      field: 'conversationType',
      title: '会话类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE },
      },
    },
    {
      title: '群',
      minWidth: 160,
      slots: { default: 'group' },
    },
    {
      field: 'mediaType',
      title: '媒体类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE },
      },
    },
    {
      field: 'status',
      title: '通话状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IM_RTC_CALL_STATUS },
      },
    },
    {
      field: 'endReason',
      title: '结束原因',
      width: 120,
      slots: { default: 'endReason' },
    },
    {
      title: '通话时长',
      width: 120,
      slots: { default: 'duration' },
    },
    {
      field: 'startTime',
      title: '发起时间',
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
