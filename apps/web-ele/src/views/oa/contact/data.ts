import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { z } from '#/adapter/form';
import { DictTag } from '#/components/dict-tag';
import { OA_CONTACT_SCENE_TYPE } from '#/views/oa/utils/constants';

/** 姓名拼音首字母选项 */
const ALPHABET_OPTIONS = [
  { label: '全部', value: '' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((value) => ({
    label: value,
    value,
  })),
];

/** 联系人性别选项 */
const SEX_OPTIONS = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
  { label: '未知', value: 0 },
];

/** 共享处理状态选项 */
const HANDLE_STATUS_OPTIONS = [
  { label: '待处理', value: false },
  { label: '已处理', value: true },
];

/** 新增/修改联系人的表单 */
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
      label: '姓名',
      component: 'Input',
      componentProps: {
        maxlength: 50,
        showWordLimit: true,
        placeholder: '请输入姓名',
      },
      rules: 'required',
    },
    {
      fieldName: 'categoryId',
      label: '分类名称',
      component: 'Select',
      componentProps: {
        options: [],
        clearable: true,
        filterable: true,
        placeholder: '请选择分类',
      },
    },
    {
      fieldName: 'sex',
      label: '性别',
      component: 'RadioGroup',
      componentProps: {
        options: SEX_OPTIONS,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入手机号码',
      },
      rules: 'required',
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入邮箱',
      },
      rules: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
    },
    {
      fieldName: 'companyPhone',
      label: '公司电话',
      component: 'Input',
      componentProps: {
        maxlength: 30,
        placeholder: '请输入公司电话',
      },
    },
    {
      fieldName: 'companyName',
      label: '公司名称',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入公司名称',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'address',
      label: '联系地址',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入联系地址',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'avatar',
      label: '头像',
      component: 'ImageUpload',
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 500,
        showWordLimit: true,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 新增/修改联系人分类的表单 */
export function useCategoryFormSchema(): VbenFormSchema[] {
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
      label: '分类名称',
      component: 'Input',
      componentProps: {
        maxlength: 50,
        placeholder: '请输入分类名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        class: '!w-full',
      },
      rules: z.number().default(0),
    },
  ];
}

/** 处理共享联系人的表单 */
export function useHandleFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'categoryId',
      label: '归入分类',
      component: 'Select',
      componentProps: {
        options: [],
        clearable: true,
        filterable: true,
        placeholder: '不选择时暂不分类',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'keyword',
      label: '关键字',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入姓名、拼音、手机或公司',
      },
    },
    {
      fieldName: 'alphabet',
      label: '首字母',
      component: 'Select',
      componentProps: {
        options: ALPHABET_OPTIONS,
        clearable: true,
        placeholder: '请选择姓名首字母',
      },
      defaultValue: '',
    },
    {
      fieldName: 'scene',
      component: 'Input',
      defaultValue: OA_CONTACT_SCENE_TYPE.MINE,
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'handleStatus',
      label: '处理状态',
      component: 'Select',
      componentProps: {
        options: HANDLE_STATUS_OPTIONS,
        clearable: true,
        placeholder: '请选择处理状态',
      },
      dependencies: {
        triggerFields: ['scene'],
        show: (values) =>
          Number(values.scene) === OA_CONTACT_SCENE_TYPE.RECEIVED,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(
  scene: number,
): VxeTableGridOptions['columns'] {
  const columns: VxeTableGridOptions['columns'] = [
    {
      field: 'name',
      title: '姓名',
      minWidth: 130,
      slots: { default: 'name' },
    },
    {
      field: 'avatar',
      title: '头像',
      width: 75,
      align: 'center',
      slots: { default: 'avatar' },
    },
    {
      field: 'sex',
      title: '性别',
      width: 80,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_USER_SEX },
      },
    },
    {
      field: 'sharedCategoryName',
      title: '分类',
      width: 120,
      slots: { default: 'categoryName' },
    },
    {
      field: 'mobile',
      title: '手机号码',
      width: 140,
    },
    {
      field: 'email',
      title: '邮箱',
      minWidth: 180,
    },
    {
      field: 'companyName',
      title: '公司名称',
      minWidth: 160,
    },
    {
      field: 'ownerUserName',
      title: '创建人',
      width: 120,
    },
  ];
  // “我共享的”场景展示当前行的接收关系
  if (scene === OA_CONTACT_SCENE_TYPE.SENT) {
    columns.push(
      {
        field: 'share.userName',
        title: '接收人',
        width: 120,
      },
      {
        field: 'share.createTime',
        title: '共享时间',
        width: 180,
        formatter: 'formatDateTime',
      },
      {
        field: 'share.handleStatus',
        title: '处理状态',
        width: 100,
        slots: { default: 'shareHandleStatus' },
      },
    );
  }
  // “共享与我”场景展示分享人与处理状态
  if (scene === OA_CONTACT_SCENE_TYPE.RECEIVED) {
    columns.push(
      {
        field: 'sharerName',
        title: '分享人',
        width: 120,
      },
      {
        field: 'handleStatus',
        title: '处理状态',
        width: 100,
        slots: { default: 'handleStatus' },
      },
    );
  }
  columns.push({
    title: '操作',
    width: 220,
    fixed: 'right',
    slots: { default: 'actions' },
  });
  return columns;
}

/** 联系人详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '姓名',
      slot: 'name',
    },
    {
      field: 'sex',
      label: '性别',
      render: (value) =>
        value === null || value === undefined
          ? undefined
          : h(DictTag, { type: DICT_TYPE.SYSTEM_USER_SEX, value }),
    },
    {
      field: 'mobile',
      label: '手机号码',
    },
    {
      field: 'email',
      label: '邮箱',
    },
    {
      field: 'categoryName',
      label: '分类',
      render: (_value, data) =>
        // 接收人查看共享联系人时，展示本人归入的分类
        (data?.handleStatus === null || data?.handleStatus === undefined
          ? data?.categoryName
          : data?.sharedCategoryName) || '-',
    },
    {
      field: 'ownerUserName',
      label: '创建人',
    },
    {
      field: 'companyName',
      label: '公司名称',
    },
    {
      field: 'companyPhone',
      label: '公司电话',
    },
    {
      field: 'address',
      label: '联系地址',
    },
    {
      field: 'remark',
      label: '备注',
    },
  ];
}
