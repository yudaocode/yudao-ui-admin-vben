import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { getSimpleContactList } from '#/api/crm/contact';
import { getCustomerSimpleList } from '#/api/crm/customer';
import { getAreaTree } from '#/api/system/area';
import { getSimpleUserList } from '#/api/system/user';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictOptions } from '#/utils';

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
      label: '联系人姓名',
      component: 'Input',
      rules: 'required',
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
    },
    {
      fieldName: 'customerId',
      label: '客户名称',
      component: 'ApiSelect',
      componentProps: {
        api: () => getCustomerSimpleList(),
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
      },
    },
    {
      fieldName: 'mobile',
      label: '手机',
      component: 'Input',
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
      fieldName: 'post',
      label: '职位',
      component: 'Input',
    },
    {
      fieldName: 'master',
      label: '关键决策人',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
      },
    },
    {
      fieldName: 'parentId',
      label: '直属上级',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleContactList(),
        fieldNames: {
          label: 'name',
          value: 'id',
        },
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
      label: '客户',
      component: 'ApiSelect',
      componentProps: {
        api: () => getCustomerSimpleList(),
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
    },
    {
      fieldName: 'name',
      label: '姓名',
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
      fieldName: 'wechat',
      label: '微信',
      component: 'Input',
    },
    {
      fieldName: 'email',
      label: '电子邮箱',
      component: 'Input',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '联系人姓名',
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
      field: 'sex',
      title: '性别',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_USER_SEX },
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
      field: 'post',
      title: '职位',
    },
    {
      field: 'detailAddress',
      title: '地址',
    },
    {
      field: 'master',
      title: '关键决策人',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'parentId',
      title: '直属上级',
      slots: { default: 'parentId' },
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
      field: 'remark',
      title: '备注',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
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

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [...useDetailBaseSchema(), ...useDetailSystemSchema()];
}

/** 详情页的基础字段 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '客户名称',
    },
    {
      field: 'source',
      label: '客户来源',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_CUSTOMER_SOURCE,
          value: data?.source,
        }),
    },
    {
      field: 'mobile',
      label: '手机',
    },
    {
      field: 'telephone',
      label: '电话',
    },
    {
      field: 'email',
      label: '邮箱',
    },
    {
      field: 'wechat',
      label: '微信',
    },
    {
      field: 'qq',
      label: 'QQ',
    },
    {
      field: 'industryId',
      label: '客户行业',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY,
          value: data?.industryId,
        }),
    },
    {
      field: 'level',
      label: '客户级别',
      content: (data) =>
        h(DictTag, { type: DICT_TYPE.CRM_CUSTOMER_LEVEL, value: data?.level }),
    },
    {
      field: 'areaName',
      label: '地址',
    },
    {
      field: 'detailAddress',
      label: '详细地址',
    },
    {
      field: 'contactNextTime',
      label: '下次联系时间',
      content: (data) => formatDateTime(data?.contactNextTime) as string,
    },
    {
      field: 'remark',
      label: '备注',
    },
  ];
}

/** 详情页的系统字段 */
export function useDetailSystemSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'ownerUserName',
      label: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      label: '所属部门',
    },
    {
      field: 'contactLastTime',
      label: '最后跟进时间',
      content: (data) => formatDateTime(data?.contactLastTime) as string,
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
    {
      field: 'updateTime',
      label: '更新时间',
      content: (data) => formatDateTime(data?.updateTime) as string,
    },
  ];
}
