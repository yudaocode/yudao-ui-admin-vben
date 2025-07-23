import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { useAccess } from '@vben/access';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '操作人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        props: {
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
export function useGridColumns<T = SystemOperateLogApi.OperateLog>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '日志编号',
      minWidth: 100,
    },
    {
      field: 'userName',
      title: '操作人',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '操作模块',
      minWidth: 120,
    },
    {
      field: 'subType',
      title: '操作名',
      minWidth: 160,
    },
    {
      field: 'action',
      title: '操作内容',
      minWidth: 200,
    },
    {
      field: 'createTime',
      title: '操作时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'bizId',
      title: '业务编号',
      minWidth: 120,
    },
    {
      field: 'userIp',
      title: '操作IP',
      minWidth: 120,
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 120,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'action',
          nameTitle: '操作日志',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['system:operate-log:query']),
          },
        ],
      },
    },
  ];
}
