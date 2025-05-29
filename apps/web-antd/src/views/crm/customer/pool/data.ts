import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE, getDictOptions } from '#/utils/dict';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '客户名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入客户名称',
      },
    },
    {
      fieldName: 'mobile',
      label: '手机',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机',
      },
    },
    {
      fieldName: 'industryId',
      label: '所属行业',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY, 'number'),
        placeholder: '请选择所属行业',
      },
    },
    {
      fieldName: 'level',
      label: '客户级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL, 'number'),
        placeholder: '请选择客户级别',
      },
    },
    {
      fieldName: 'source',
      label: '客户来源',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE, 'number'),
        placeholder: '请选择客户来源',
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '客户名称',
      field: 'name',
      width: 160,
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      title: '客户来源',
      field: 'source',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_SOURCE },
      },
    },
    {
      title: '手机',
      field: 'mobile',
      width: 120,
    },
    {
      title: '电话',
      field: 'telephone',
      width: 120,
    },
    {
      title: '邮箱',
      field: 'email',
      width: 140,
    },
    {
      title: '客户级别',
      field: 'level',
      width: 135,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_LEVEL },
      },
    },
    {
      title: '客户行业',
      field: 'industryId',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
      },
    },
    {
      title: '下次联系时间',
      field: 'contactNextTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '备注',
      field: 'remark',
      width: 200,
    },
    {
      title: '成交状态',
      field: 'dealStatus',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      title: '最后跟进时间',
      field: 'contactLastTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '最后跟进记录',
      field: 'contactLastContent',
      width: 200,
    },
    {
      title: '更新时间',
      field: 'updateTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      width: 100,
    },
  ];
}
