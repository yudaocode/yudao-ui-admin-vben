import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '商机名称',
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'customerName',
      title: '客户名称',
      fixed: 'left',
      slots: { default: 'customerName' },
    },
    {
      field: 'totalPrice',
      title: '商机金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'dealTime',
      title: '预计成交日期',
      formatter: 'formatDate',
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      field: 'contactNextTime',
      title: '下次联系时间',
      formatter: 'formatDate',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'statusTypeName',
      title: '商机状态组',
      fixed: 'right',
    },
    {
      field: 'statusName',
      title: '商机阶段',
      fixed: 'right',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
