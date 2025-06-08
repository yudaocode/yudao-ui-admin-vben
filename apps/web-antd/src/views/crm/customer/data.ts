import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getAreaTree } from '#/api/system/area';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
      label: '客户名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'source',
      label: '客户来源',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE),
      },
      rules: 'required',
    },
    {
      fieldName: 'mobile',
      label: '手机',
      component: 'Input',
    },
    {
      fieldName: 'ownerUserId',
      label: '负责人',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleUserList(),
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
      },
      rules: 'required',
    },
    {
      fieldName: 'telephone',
      label: '电话',
      component: 'Input',
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
    },
    {
      fieldName: 'wechat',
      label: '微信',
      component: 'Input',
    },
    {
      fieldName: 'qq',
      label: 'QQ',
      component: 'Input',
    },
    {
      fieldName: 'industryId',
      label: '客户行业',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY),
      },
    },
    {
      fieldName: 'level',
      label: '客户级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL),
      },
    },
    {
      fieldName: 'areaId',
      label: '地址',
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getAreaTree(),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
      },
    },
    {
      fieldName: 'detailAddress',
      label: '详细地址',
      component: 'Input',
    },
    {
      fieldName: 'contactNextTime',
      label: '下次联系时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '客户名称',
      component: 'Input',
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
    },
    {
      fieldName: 'telephone',
      label: '电话',
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
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '客户名称',
      fixed: 'left',
      slots: {
        default: 'name',
      },
    },
    {
      field: 'source',
      title: '客户来源',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_SOURCE },
      },
    },
    {
      field: 'mobile',
      title: '手机',
    },
    {
      field: 'telephone',
      title: '电话',
    },
    {
      field: 'email',
      title: '邮箱',
    },
    {
      field: 'detailAddress',
      title: '地址',
    },
    {
      field: 'industryId',
      title: '客户行业',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
      },
    },
    {
      field: 'level',
      title: '客户级别',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_LEVEL },
      },
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
      field: 'contactNextTime',
      title: '下次联系时间',
      formatter: 'formatDateTime',
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
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
