import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useUserStore } from '@vben/stores';

import { getAreaTree } from '#/api/system/area';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  const userStore = useUserStore();
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
      componentProps: {
        placeholder: '请输入客户名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'source',
      label: '客户来源',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'mobile',
      label: '手机',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机',
        allowClear: true,
      },
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
        placeholder: '请选择负责人',
        allowClear: true,
      },
      defaultValue: userStore.userInfo?.id,
      rules: 'required',
    },
    {
      fieldName: 'telephone',
      label: '电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入电话',
        allowClear: true,
      },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      componentProps: {
        placeholder: '请输入邮箱',
        allowClear: true,
      },
    },
    {
      fieldName: 'wechat',
      label: '微信',
      component: 'Input',
      componentProps: {
        placeholder: '请输入微信',
        allowClear: true,
      },
    },
    {
      fieldName: 'qq',
      label: 'QQ',
      component: 'Input',
      componentProps: {
        placeholder: '请输入QQ',
        allowClear: true,
      },
    },
    {
      fieldName: 'industryId',
      label: '客户行业',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY, 'number'),
        placeholder: '请选择客户行业',
        allowClear: true,
      },
    },
    {
      fieldName: 'level',
      label: '客户级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL, 'number'),
        placeholder: '请选择客户级别',
        allowClear: true,
      },
    },
    {
      fieldName: 'areaId',
      label: '地址',
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getAreaTree(),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: '请选择地址',
        allowClear: true,
      },
    },
    {
      fieldName: 'detailAddress',
      label: '详细地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入详细地址',
        allowClear: true,
      },
    },
    {
      fieldName: 'contactNextTime',
      label: '下次联系时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择下次联系时间',
        allowClear: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        allowClear: true,
      },
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
      componentProps: {
        placeholder: '请输入客户名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号',
        allowClear: true,
      },
    },
    {
      fieldName: 'telephone',
      label: '电话',
      component: 'Input',
      componentProps: {
        placeholder: '请输入电话',
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        placeholder: '请选择创建时间',
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
      align: 'left',
      minWidth: 280,
      slots: {
        default: 'name',
      },
    },
    {
      field: 'source',
      title: '客户来源',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_SOURCE },
      },
    },
    {
      field: 'mobile',
      title: '手机',
      minWidth: 100,
    },
    {
      field: 'telephone',
      title: '电话',
      minWidth: 100,
    },
    {
      field: 'email',
      title: '邮箱',
      minWidth: 100,
    },
    {
      field: 'areaName',
      title: '地址',
      minWidth: 140,
    },
    {
      field: 'detailAddress',
      title: '地址',
      minWidth: 140,
    },
    {
      field: 'industryId',
      title: '客户行业',
      minWidth: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
      },
    },
    {
      field: 'level',
      title: '客户级别',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_LEVEL },
      },
    },
    {
      field: 'ownerUserName',
      title: '负责人',
      minWidth: 80,
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
      minWidth: 100,
    },
    {
      field: 'contactNextTime',
      title: '下次联系时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
