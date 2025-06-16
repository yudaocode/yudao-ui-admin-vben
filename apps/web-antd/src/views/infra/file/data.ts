import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getRangePickerDefaultProps } from '#/utils';

/** 表单的字段 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '文件上传',
      component: 'Upload',
      componentProps: {
        placeholder: '请选择要上传的文件',
      },
      rules: 'required',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'path',
      label: '文件路径',
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件路径',
        clearable: true,
      },
    },
    {
      fieldName: 'type',
      label: '文件类型',
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件类型',
        clearable: true,
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
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'name',
      title: '文件名',
    },
    {
      field: 'path',
      title: '文件路径',
      showOverflow: true,
    },
    {
      field: 'url',
      title: 'URL',
      showOverflow: true,
    },
    {
      field: 'size',
      title: '文件大小',
      formatter: ({ cellValue }) => {
        // TODO @芋艿：后续优化下
        if (!cellValue) return '0 B';
        const unitArr = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const index = Math.floor(Math.log(cellValue) / Math.log(1024));
        const size = cellValue / 1024 ** index;
        const formattedSize = size.toFixed(2);
        return `${formattedSize} ${unitArr[index]}`;
      },
    },
    {
      field: 'type',
      title: '文件类型',
    },
    {
      field: 'file-content',
      title: '文件内容',
      slots: { default: 'file-content' },
    },
    {
      field: 'createTime',
      title: '上传时间',
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
