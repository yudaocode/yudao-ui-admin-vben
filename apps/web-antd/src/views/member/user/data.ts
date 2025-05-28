import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getSimpleGroupList } from '#/api/member/group';
import { getSimpleLevelList } from '#/api/member/level';
import { getSimpleTagList } from '#/api/member/tag';
import { getAreaTree } from '#/api/system/area';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

/** 修改的表单 */
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
      component: 'Input',
      fieldName: 'mobile',
      label: '手机号',
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE).optional(),
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '用户昵称',
    },
    {
      component: 'ImageUpload',
      fieldName: 'avatar',
      label: '头像',
      componentProps: {
        maxSize: 1,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '真实名字',
    },
    {
      fieldName: 'sex',
      label: '用户性别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'birthday',
      label: '出生日期',
      componentProps: {
        format: 'YYYY-MM-DD',
      },
    },
    {
      component: 'ApiTreeSelect',
      fieldName: 'areaId',
      label: '所在地',
      componentProps: {
        api: () => getAreaTree(),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'tagIds',
      label: '用户标签',
      componentProps: {
        api: () => getSimpleTagList(),
        fieldNames: { label: 'name', value: 'id' },
        mode: 'multiple',
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'groupId',
      label: '用户分组',
      componentProps: {
        api: () => getSimpleGroupList(),
        fieldNames: { label: 'name', value: 'id' },
      },
    },
    {
      component: 'Textarea',
      fieldName: 'mark',
      label: '会员备注',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
    },
    {
      fieldName: 'loginDate',
      label: '登录时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'createTime',
      label: '注册时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'tagIds',
      label: '用户标签',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleTagList(),
        fieldNames: { label: 'name', value: 'id' },
        mode: 'multiple',
      },
    },
    {
      fieldName: 'levelId',
      label: '用户等级',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleLevelList(),
        fieldNames: { label: 'name', value: 'id' },
      },
    },
    {
      fieldName: 'groupId',
      label: '用户分组',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleGroupList(),
        fieldNames: { label: 'name', value: 'id' },
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'id',
      title: '用户编号',
    },
    {
      field: 'avatar',
      title: '头像',
      slots: {
        default: ({ row }) => {
          return h('img', {
            src: row.avatar,
            style: { width: '40px' },
          });
        },
      },
    },
    {
      field: 'mobile',
      title: '手机号',
    },
    {
      field: 'nickname',
      title: '昵称',
    },
    {
      field: 'levelName',
      title: '等级',
    },
    {
      field: 'groupName',
      title: '分组',
    },
    {
      field: 'tagNames',
      title: '用户标签',
      slots: {
        default: ({ row }) => {
          return row.tagNames?.map((tagName: string, index: number) => {
            return h(
              Tag,
              {
                key: index,
                class: 'mr-5px',
                color: 'blue',
              },
              () => tagName,
            );
          });
        },
      },
    },
    {
      field: 'point',
      title: '积分',
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'loginDate',
      title: '登录时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '注册时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
