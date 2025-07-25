import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户名称',
      },
    },
    {
      fieldName: 'userIp',
      label: '登录地址',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入登录地址',
      },
    },
    {
      fieldName: 'createTime',
      label: '登录时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '日志编号',
    },
    {
      field: 'logType',
      title: '操作类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_LOGIN_TYPE },
      },
    },
    {
      field: 'username',
      title: '用户名称',
    },
    {
      field: 'userIp',
      title: '登录地址',
    },
    {
      field: 'userAgent',
      title: '浏览器',
    },
    {
      field: 'result',
      title: '登录结果',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_LOGIN_RESULT },
      },
    },
    {
      field: 'createTime',
      title: '登录日期',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'id',
      label: '日志编号',
    },
    {
      field: 'logType',
      label: '操作类型',
      content: (data) => {
        return h(DictTag, {
          type: DICT_TYPE.SYSTEM_LOGIN_TYPE,
          value: data?.logType,
        });
      },
    },
    {
      field: 'username',
      label: '用户名称',
    },
    {
      field: 'userIp',
      label: '登录地址',
    },
    {
      field: 'userAgent',
      label: '浏览器',
    },
    {
      field: 'result',
      label: '登录结果',
      content: (data) => {
        return h(DictTag, {
          type: DICT_TYPE.SYSTEM_LOGIN_RESULT,
          value: data?.result,
        });
      },
    },
    {
      field: 'createTime',
      label: '登录日期',
      content: (data) => formatDateTime(data?.createTime || '') as string,
    },
  ];
}
