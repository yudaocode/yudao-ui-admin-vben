import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraFileApi } from '#/api/infra/file';

import { useAccess } from '@vben/access';

import { getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

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
export function useGridColumns<T = InfraFileApi.File>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'name',
      title: '文件名',
      minWidth: 150,
    },
    {
      field: 'path',
      title: '文件路径',
      minWidth: 200,
      showOverflow: true,
    },
    {
      field: 'url',
      title: 'URL',
      minWidth: 200,
      showOverflow: true,
    },
    {
      field: 'size',
      title: '文件大小',
      minWidth: 80,
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
      minWidth: 120,
    },
    {
      field: 'file-content',
      title: '文件内容',
      minWidth: 120,
      slots: {
        default: 'file-content',
      },
    },
    {
      field: 'createTime',
      title: '上传时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      width: 160,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '文件',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'copyUrl',
            text: '复制链接',
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:file:delete']),
          },
        ],
      },
    },
  ];
}
