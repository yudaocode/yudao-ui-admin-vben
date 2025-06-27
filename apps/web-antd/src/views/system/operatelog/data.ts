import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { formatDateTime } from '@vben/utils';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '操作人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        allowClear: true,
        placeholder: '请选择操作人员',
      },
    },
    {
      fieldName: 'type',
      label: '操作模块',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入操作模块',
      },
    },
    {
      fieldName: 'subType',
      label: '操作名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入操作名',
      },
    },
    {
      fieldName: 'action',
      label: '操作内容',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入操作内容',
      },
    },
    {
      fieldName: 'createTime',
      label: '操作时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'bizId',
      label: '业务编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入业务编号',
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
      field: 'userName',
      title: '操作人',
    },
    {
      field: 'type',
      title: '操作模块',
    },
    {
      field: 'subType',
      title: '操作名',
    },
    {
      field: 'action',
      title: '操作内容',
    },
    {
      field: 'createTime',
      title: '操作时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'bizId',
      title: '业务编号',
    },
    {
      field: 'userIp',
      title: '操作IP',
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
      field: 'traceId',
      label: '链路追踪',
      content: (data) => data?.traceId || '',
    },
    {
      field: 'userId',
      label: '操作人编号',
    },
    {
      field: 'userName',
      label: '操作人名字',
    },
    {
      field: 'userIp',
      label: '操作人IP',
    },
    {
      field: 'userAgent',
      label: '操作人UA',
    },
    {
      field: 'type',
      label: '操作模块',
    },
    {
      field: 'subType',
      label: '操作名',
    },
    {
      field: 'action',
      label: '操作内容',
    },
    {
      field: 'extra',
      label: '操作拓展参数',
    },
    {
      field: 'requestUrl',
      label: '请求URL',
      content: (data) => {
        const method = data?.requestMethod || '';
        const url = data?.requestUrl || '';
        return `${method} ${url}`.trim();
      },
    },
    {
      field: 'createTime',
      label: '操作时间',
      content: (data) => formatDateTime(data?.createTime || '') as string,
    },
    {
      field: 'bizId',
      label: '业务编号',
    },
  ];
}
