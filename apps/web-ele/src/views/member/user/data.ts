import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { convertToInteger, formatToFraction } from '@vben/utils';

import { ElTag } from 'element-plus';

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
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'tagIds',
      label: '用户标签',
      componentProps: {
        api: () => getSimpleTagList(),
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'groupId',
      label: '用户分组',
      componentProps: {
        api: () => getSimpleGroupList(),
        labelField: 'name',
        valueField: 'id',
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
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
      },
    },
    {
      fieldName: 'levelId',
      label: '用户等级',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleLevelList(),
        labelField: 'name',
        valueField: 'id',
      },
    },
    {
      fieldName: 'groupId',
      label: '用户分组',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleGroupList(),
        labelField: 'name',
        valueField: 'id',
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
              ElTag,
              {
                key: index,
                class: 'mr-1',
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

/** 修改用户等级 */
export function useLeavelFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: '用户编号',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '用户昵称',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'point',
      label: '用户等级',
      component: 'ApiSelect',
      componentProps: {
        api: () => getSimpleLevelList(),
        labelField: 'name',
        valueField: 'id',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'reason',
      label: '修改原因',
      rules: 'required',
    },
  ];
}

/** 修改用户余额 */
export function useBalanceFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: '用户编号',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '用户昵称',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'balance',
      label: '变动前余额(元)',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'changeType',
      label: '变动类型',
      componentProps: {
        options: [
          { label: '增加', value: 1 },
          { label: '减少', value: -1 },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
      defaultValue: 1,
    },
    {
      component: 'InputNumber',
      fieldName: 'changeBalance',
      label: '变动余额(元)',
      rules: 'required',
      componentProps: {
        min: 0,
        precision: 2,
        step: 0.1,
      },
      defaultValue: 0,
    },
    {
      component: 'Input',
      fieldName: 'balanceResult',
      label: '变动后余额(元)',
      dependencies: {
        triggerFields: ['changeBalance', 'changeType'],
        disabled: true,
        trigger(values, form) {
          form.setFieldValue(
            'balanceResult',
            formatToFraction(
              convertToInteger(values.balance) +
                convertToInteger(values.changeBalance) * values.changeType,
            ),
          );
        },
      },
    },
  ];
}

/** 修改用户积分 */
export function usePointFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: '用户编号',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '用户昵称',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'point',
      label: '变动前积分',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'changeType',
      label: '变动类型',
      componentProps: {
        options: [
          { label: '增加', value: 1 },
          { label: '减少', value: -1 },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
      defaultValue: 1,
    },
    {
      component: 'InputNumber',
      fieldName: 'changePoint',
      label: '变动积分',
      rules: 'required',
      componentProps: {
        min: 0,
        precision: 0,
      },
      defaultValue: 0,
    },
    {
      component: 'Input',
      fieldName: 'pointResult',
      label: '变动后积分',
      dependencies: {
        triggerFields: ['changePoint', 'changeType'],
        disabled: true,
        trigger(values, form) {
          form.setFieldValue(
            'pointResult',
            values.point + values.changePoint * values.changeType ||
              values.point,
          );
        },
      },
      rules: z.number().min(0),
    },
  ];
}
