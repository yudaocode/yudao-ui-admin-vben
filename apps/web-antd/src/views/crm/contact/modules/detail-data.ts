import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

/** 详情页的基础字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '客户名称',
    },
    {
      field: 'post',
      label: '职务',
    },
    {
      field: 'mobile',
      label: '手机',
    },
    {
      field: 'createTime',
      label: '下次联系时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
  ];
}

/** 详情页的基础字段 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '姓名',
    },
    {
      field: 'customerName',
      label: '客户名称',
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
      field: 'qq',
      label: 'QQ',
    },
    {
      field: 'wechat',
      label: '微信',
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
      field: 'post',
      label: '职务',
    },
    {
      field: 'parentName',
      label: '直属上级',
    },
    {
      field: 'master',
      label: '关键决策人',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
          value: data?.master,
        }),
    },
    {
      field: 'sex',
      label: '性别',
      content: (data) =>
        h(DictTag, { type: DICT_TYPE.SYSTEM_USER_SEX, value: data?.sex }),
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

/** 详情列表的字段 */
export function useDetailListColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'name',
      title: '姓名',
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
  ];
}
