import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmBusinessApi } from '#/api/crm/business';

import { useAccess } from '@vben/access';

import { getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '商机名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'customerId',
      label: '客户',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'totalPrice',
      label: '商机金额',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入商机金额',
      },
      rules: 'required',
    },
    {
      fieldName: 'dealTime',
      label: '预计成交日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: false,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
    },
    {
      fieldName: 'contactNextTime',
      label: '下次联系时间',
      component: 'DatePicker',
      componentProps: {
        showTime: false,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '商机名称',
      component: 'Input',
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
export function useGridColumns<T = CrmBusinessApi.Business>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '商机名称',
      minWidth: 160,
      fixed: 'left',
      slots: {
        default: 'name',
      },
    },
    {
      field: 'customerName',
      title: '客户名称',
      minWidth: 120,
      fixed: 'left',
      slots: {
        default: 'customerName',
      },
    },
    {
      field: 'totalPrice',
      title: '商机金额（元）',
      minWidth: 140,
      formatter: 'formatNumber',
    },
    {
      field: 'dealTime',
      title: '预计成交日期',
      minWidth: 180,
      formatter: 'formatDate',
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 200,
    },
    {
      field: 'contactNextTime',
      title: '下次联系时间',
      minWidth: 180,
      formatter: 'formatDate',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
      minWidth: 100,
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
      minWidth: 100,
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 100,
    },
    {
      field: 'statusTypeName',
      title: '商机状态组',
      minWidth: 140,
      fixed: 'right',
    },
    {
      field: 'statusName',
      title: '商机阶段',
      minWidth: 120,
      fixed: 'right',
    },
    {
      field: 'operation',
      title: '操作',
      width: 130,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '商机',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['crm:business:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['crm:business:delete']),
          },
        ],
      },
    },
  ];
}
