import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraDataSourceConfigApi } from '#/api/infra/data-source-config';

import { useAccess } from '@vben/access';

const { hasAccessByCodes } = useAccess();

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '数据源名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入数据源名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'url',
      label: '数据源连接',
      component: 'Input',
      componentProps: {
        placeholder: '请输入数据源连接',
      },
      rules: 'required',
    },
    {
      fieldName: 'username',
      label: '用户名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名',
      },
      rules: 'required',
    },
    {
      fieldName: 'password',
      label: '密码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入密码',
        type: 'password',
      },
      rules: 'required',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = InfraDataSourceConfigApi.DataSourceConfig>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '主键编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '数据源名称',
      minWidth: 150,
    },
    {
      field: 'url',
      title: '数据源连接',
      minWidth: 300,
    },
    {
      field: 'username',
      title: '用户名',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 130,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '数据源',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['infra:data-source-config:update']),
            disabled: (row: any) => row.id === 0,
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['infra:data-source-config:delete']),
            disabled: (row: any) => row.id === 0,
          },
        ],
      },
    },
  ];
}
