import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { getAreaTree } from '#/api/system/area';
import { getSimpleUserList } from '#/api/system/user';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

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
      component: 'ImageUpload',
      fieldName: 'logo',
      label: '门店logo',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '门店名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: '门店手机',
      rules: 'mobileRequired',
    },
    {
      component: 'Textarea',
      fieldName: 'introduction',
      label: '门店简介',
    },
    {
      fieldName: 'areaId',
      label: '地址',
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getAreaTree(),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
      },
    },
    {
      component: 'Input',
      fieldName: 'detailAddress',
      label: '详细地址',
      rules: 'required',
    },
    {
      component: 'TimePicker',
      fieldName: 'openingTime',
      label: '营业开始时间',
      rules: 'required',
    },
    {
      component: 'TimePicker',
      fieldName: 'closingTime',
      label: '营业结束时间',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'longitude',
      label: '经度',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'latitude',
      label: '纬度',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'getGeo',
      label: '获取经纬度',
    },
    {
      fieldName: 'status',
      label: '门店状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 绑定店员的表单 */
export function useBindFormSchema(): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '门店名称',
      dependencies: {
        triggerFields: ['id'],
        disabled: true,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'verifyUserIds',
      label: '门店店员',
      rules: 'required',
      componentProps: {
        api: () => getSimpleUserList(),
        labelField: 'nickname',
        valueField: 'id',
        mode: 'tags',
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'verifyUsers',
      label: '店员列表',
      rules: 'required',
      componentProps: {
        options: [],
        mode: 'tags',
      },
      dependencies: {
        triggerFields: ['verifyUserIds'],
        trigger(values, form) {
          form.setFieldValue('verifyUsers', values.verifyUserIds);
        },
        disabled: true,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'phone',
      label: '门店手机',
      component: 'Input',
    },
    {
      fieldName: 'name',
      label: '门店名称',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '门店状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
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
      field: 'id',
      title: '编号',
    },
    {
      field: 'logo',
      title: '门店logo',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'name',
      title: '门店名称',
    },
    {
      field: 'phone',
      title: '门店手机',
    },
    {
      field: 'detailAddress',
      title: '地址',
    },
    {
      field: 'openingTime',
      title: '营业时间',
      formatter: ({ row }) => {
        return `${row.openingTime} ~ ${row.closingTime}`;
      },
    },
    {
      field: 'status',
      title: '开启状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
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
